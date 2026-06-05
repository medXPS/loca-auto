import { Router } from "express";
import { eq, and, sql, desc, lt } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";

const router = Router();

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  UNDER_REVIEW: "En cours de vérification",
  CALL_ATTEMPTED: "Appel effectué",
  CALL_CONFIRMED: "Confirmée par téléphone",
  WAITING_AGENCY_PAYMENT: "En attente de paiement à l'agence",
  RESERVED: "Réservée",
  REJECTED: "Refusée",
  WAITING_DOCUMENTS: "Documents demandés",
  CAR_DELIVERED: "Voiture livrée",
  CAR_RETURNED: "Voiture retournée",
  CANCELLED: "Annulée",
  ABANDONED: "Abandonnée",
  COMPLETED: "Terminée",
};

async function fetchRequestWithCar(id: number) {
  const [req] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, id)).limit(1);
  if (!req) return null;
  const [car] = await db.select().from(schema.carsTable).where(eq(schema.carsTable.id, req.carId)).limit(1);
  return {
    ...req,
    estimatedTotalPrice: Number(req.estimatedTotalPrice),
    finalPrice: req.finalPrice ? Number(req.finalPrice) : null,
    car: car ? {
      ...car,
      dailyPrice: Number(car.dailyPrice),
      weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
      monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
    } : null,
  };
}

// GET /api/rental-requests
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, customerId, carId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const conditions = [];
    if (status) conditions.push(eq(schema.rentalRequestsTable.status, status as any));
    if (customerId) conditions.push(eq(schema.rentalRequestsTable.customerId, parseInt(customerId)));
    if (carId) conditions.push(eq(schema.rentalRequestsTable.carId, parseInt(carId)));

    // Customers can only see their own
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (customer) conditions.push(eq(schema.rentalRequestsTable.customerId, customer.id));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(where);
    const requests = await db.select().from(schema.rentalRequestsTable).where(where).orderBy(desc(schema.rentalRequestsTable.createdAt)).limit(limitNum).offset((pageNum - 1) * limitNum);

    // Fetch cars
    const carIds = [...new Set(requests.map(r => r.carId))];
    const cars = carIds.length > 0 ? await db.select().from(schema.carsTable).where(sql`${schema.carsTable.id} = ANY(ARRAY[${sql.join(carIds.map(id => sql`${id}`), sql`, `)}]::int[])`) : [];
    const carsMap = Object.fromEntries(cars.map(c => [c.id, c]));

    const result = requests.map(r => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
      car: carsMap[r.carId] ? {
        ...carsMap[r.carId],
        dailyPrice: Number(carsMap[r.carId].dailyPrice),
        weeklyPrice: carsMap[r.carId].weeklyPrice ? Number(carsMap[r.carId].weeklyPrice) : null,
        monthlyPrice: carsMap[r.carId].monthlyPrice ? Number(carsMap[r.carId].monthlyPrice) : null,
      } : null,
    }));

    res.json({ requests: result, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/rental-requests
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { carId, fullName, phone, email, cinOrPassport, drivingLicenseNumber, startDate, returnDate, pickupLocation, returnLocation, estimatedTotalPrice, notes } = req.body;

    let customerId = null;
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (customer) customerId = customer.id;
    }

    const [request] = await db.insert(schema.rentalRequestsTable).values({
      customerId, carId, fullName, phone, email, cinOrPassport, drivingLicenseNumber,
      startDate, returnDate, pickupLocation, returnLocation, estimatedTotalPrice: String(estimatedTotalPrice), notes,
    }).returning();

    await logAudit({ userId: req.user!.userId, action: "CREATE_RENTAL_REQUEST", entityType: "rental_request", entityId: request.id });

    const result = await fetchRequestWithCar(request.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/rental-requests/check-expired
router.post("/check-expired", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const now = new Date();
    const expired = await db.select().from(schema.rentalRequestsTable).where(
      and(
        eq(schema.rentalRequestsTable.status, "WAITING_AGENCY_PAYMENT"),
        lt(schema.rentalRequestsTable.paymentDeadline, now)
      )
    );
    for (const r of expired) {
      await db.update(schema.rentalRequestsTable)
        .set({ status: "ABANDONED", abandonedAt: now })
        .where(eq(schema.rentalRequestsTable.id, r.id));
      if (r.customerId) {
        const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, r.customerId)).limit(1);
        if (customer) {
          await createNotification({
            userId: customer.userId,
            title: "Demande de location abandonnée",
            message: `Votre demande de location n°${r.id} a été abandonnée car le délai de paiement est dépassé.`,
          });
        }
      }
    }
    res.json({ message: `${expired.length} demande(s) abandonnée(s)` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/rental-requests/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await fetchRequestWithCar(parseInt(req.params.id));
    if (!result) { res.status(404).json({ error: "Demande non trouvée" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id
router.patch("/:id", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { fullName, phone, email, cinOrPassport, drivingLicenseNumber, startDate, returnDate, pickupLocation, returnLocation, finalPrice, notes } = req.body;
    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({ fullName, phone, email, cinOrPassport, drivingLicenseNumber, startDate, returnDate, pickupLocation, returnLocation, ...(finalPrice && { finalPrice: String(finalPrice) }), notes })
      .where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Demande non trouvée" }); return; }
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/status
router.patch("/:id/status", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({ status, ...(notes && { notes }) })
      .where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Demande non trouvée" }); return; }
    await logAudit({ userId: req.user!.userId, action: `STATUS_CHANGE_${status}`, entityType: "rental_request", entityId: updated.id, details: notes });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/confirm-call
router.patch("/:id/confirm-call", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { notes, finalPrice } = req.body;
    const now = new Date();

    // Get deadline hours from settings
    const [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    const deadlineHours = settings?.paymentDeadlineHours ?? 12;
    const paymentDeadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);

    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({
        status: "WAITING_AGENCY_PAYMENT",
        callConfirmedAt: now,
        callConfirmedBy: req.user!.userId,
        paymentDeadline,
        ...(notes && { notes }),
        ...(finalPrice && { finalPrice: String(finalPrice) }),
      })
      .where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Demande non trouvée" }); return; }

    // Notify customer
    if (updated.customerId) {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, updated.customerId)).limit(1);
      if (customer) {
        await createNotification({
          userId: customer.userId,
          title: "Demande confirmée — Paiement requis",
          message: `Votre demande n°${updated.id} a été confirmée. Vous avez ${deadlineHours}h pour passer à l'agence et effectuer le paiement.`,
        });
      }
    }

    await logAudit({ userId: req.user!.userId, action: "CONFIRM_CALL", entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/confirm-payment
router.patch("/:id/confirm-payment", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const now = new Date();
    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({
        status: "RESERVED",
        paymentStatus: "PAID_AT_AGENCY",
        paidAtAgencyAt: now,
        paymentConfirmedBy: req.user!.userId,
        ...(amount && { finalPrice: String(amount) }),
        ...(notes && { notes }),
      })
      .where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Demande non trouvée" }); return; }

    // Block availability
    await db.insert(schema.carAvailabilityBlocksTable).values({
      carId: updated.carId,
      rentalRequestId: updated.id,
      startDate: updated.startDate,
      endDate: updated.returnDate,
      type: "RESERVED",
      status: "ACTIVE",
    });

    // Update car status
    await db.update(schema.carsTable).set({ status: "RESERVED" }).where(eq(schema.carsTable.id, updated.carId));

    if (updated.customerId) {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, updated.customerId)).limit(1);
      if (customer) {
        await createNotification({
          userId: customer.userId,
          title: "Paiement confirmé — Réservation validée",
          message: `Votre paiement pour la demande n°${updated.id} a été confirmé. Votre réservation est validée.`,
        });
      }
    }

    await logAudit({ userId: req.user!.userId, action: "CONFIRM_PAYMENT", entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/cancel
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const [existing] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Demande non trouvée" }); return; }

    // Customers can only cancel their own
    if (req.user!.role === "CUSTOMER") {
      if (!existing.customerId) { res.status(403).json({ error: "Non autorisé" }); return; }
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (!customer || customer.id !== existing.customerId) { res.status(403).json({ error: "Non autorisé" }); return; }
    }

    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({ status: "CANCELLED" })
      .where(eq(schema.rentalRequestsTable.id, parseInt(req.params.id)))
      .returning();

    await logAudit({ userId: req.user!.userId, action: "CANCEL_RENTAL_REQUEST", entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
