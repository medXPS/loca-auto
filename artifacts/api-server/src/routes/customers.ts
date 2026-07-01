import { Router } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();

const ACTIVE_CUSTOMER_STATUSES = new Set([
  "CALL_CONFIRMED",
  "WAITING_AGENCY_PAYMENT",
  "RESERVED",
  "CAR_DELIVERED",
  "RENTED",
]);

const COMPLETED_CUSTOMER_STATUSES = new Set([
  "CAR_RETURNED",
  "RETURNED",
  "COMPLETED",
]);

function publicUser(user: typeof schema.usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
  };
}

function buildCustomerStatus(activeReservations: number, completedRentals: number, totalSpent: number) {
  if (activeReservations > 0) return "Actif";
  if (completedRentals >= 3 || totalSpent >= 20000) return "VIP";
  if (completedRentals > 0) return "Déjà client";
  return "Nouveau";
}

async function fetchCustomerDetail(id: number) {
  const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, id)).limit(1);
  if (!customer) return null;

  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, customer.userId)).limit(1);
  const requests = await db
    .select()
    .from(schema.rentalRequestsTable)
    .where(eq(schema.rentalRequestsTable.customerId, customer.id))
    .orderBy(desc(schema.rentalRequestsTable.createdAt));
  const documents = await db
    .select()
    .from(schema.documentsTable)
    .where(eq(schema.documentsTable.customerId, customer.id))
    .orderBy(desc(schema.documentsTable.uploadedAt));

  const visibleRequests = requests.filter((request) => request.status !== "CANCELLED");
  const rentalRequests = visibleRequests.map((r) => ({
    ...r,
    estimatedTotalPrice: Number(r.estimatedTotalPrice),
    finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
  }));

  const activeRentalRequests = rentalRequests.filter((request) => ACTIVE_CUSTOMER_STATUSES.has(request.status));
  const completedRentalRequests = rentalRequests.filter((request) => COMPLETED_CUSTOMER_STATUSES.has(request.status));
  const totalSpent = rentalRequests.reduce((sum, request) => {
    if (
      ACTIVE_CUSTOMER_STATUSES.has(request.status) ||
      COMPLETED_CUSTOMER_STATUSES.has(request.status) ||
      request.status === "RESERVED"
    ) {
      return sum + Number(request.finalPrice ?? request.estimatedTotalPrice ?? 0);
    }
    return sum;
  }, 0);

  return {
    ...customer,
    user: user ? publicUser(user) : null,
    rentalRequests,
    activeRentalRequests,
    summary: {
      totalSpent,
      activeReservations: activeRentalRequests.length,
      completedRentals: completedRentalRequests.length,
      status: buildCustomerStatus(activeRentalRequests.length, completedRentalRequests.length, totalSpent),
      lastRentalAt: rentalRequests[0]?.createdAt ?? null,
    },
    documents,
  };
}

// GET /api/customers
router.get("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const searchPattern = search ? `%${search.trim()}%` : null;

    let query: any = db
      .select({ customer: schema.customersTable, user: schema.usersTable })
      .from(schema.customersTable)
      .leftJoin(schema.usersTable, eq(schema.customersTable.userId, schema.usersTable.id));

    if (searchPattern) {
      query = query.where(
        or(
          ilike(schema.usersTable.fullName, searchPattern),
          ilike(schema.usersTable.email, searchPattern),
          ilike(schema.usersTable.phone, searchPattern),
          ilike(schema.customersTable.cin, searchPattern),
          ilike(schema.customersTable.passportNumber, searchPattern),
          ilike(schema.customersTable.drivingLicenseNumber, searchPattern),
        ),
      );
    }

    const rows = await query.orderBy(desc(schema.customersTable.id));
    const total = rows.length;
    const paged = rows.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    const customerIds = paged.map(({ customer }: any) => customer.id);
    const documents = customerIds.length > 0
      ? await db
          .select()
          .from(schema.documentsTable)
          .where(inArray(schema.documentsTable.customerId, customerIds))
          .orderBy(desc(schema.documentsTable.uploadedAt))
      : [];
    const documentsByCustomerId = documents.reduce((acc, document) => {
      const current = acc.get(document.customerId) ?? [];
      current.push(document);
      acc.set(document.customerId, current);
      return acc;
    }, new Map<number, typeof documents>());

    const customers = paged.map(({ customer, user }: any) => ({
      ...customer,
      user: user ? publicUser(user) : null,
      documents: documentsByCustomerId.get(customer.id) ?? [],
    }));

    res.json({ customers, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/customers/me/profile
router.get("/me/profile", authMiddleware, async (req, res) => {
  try {
    const [customer] = await db
      .select()
      .from(schema.customersTable)
      .where(eq(schema.customersTable.userId, req.user!.userId))
      .limit(1);
    if (!customer) {
      res.status(404).json({ error: "Profil non trouve" });
      return;
    }

    const result = await fetchCustomerDetail(customer.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/customers/me/profile
router.patch("/me/profile", authMiddleware, async (req, res) => {
  try {
    const [customer] = await db
      .select()
      .from(schema.customersTable)
      .where(eq(schema.customersTable.userId, req.user!.userId))
      .limit(1);
    if (!customer) {
      res.status(404).json({ error: "Profil non trouve" });
      return;
    }

    const { fullName, phone, cin, passportNumber, drivingLicenseNumber, address, city } = req.body;

    if (fullName || phone) {
      await db
        .update(schema.usersTable)
        .set({ ...(fullName && { fullName }), ...(phone && { phone }) })
        .where(eq(schema.usersTable.id, req.user!.userId));
    }

    await db
      .update(schema.customersTable)
      .set({
        ...(cin !== undefined && { cin }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(drivingLicenseNumber !== undefined && { drivingLicenseNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      })
      .where(eq(schema.customersTable.id, customer.id));

    const result = await fetchCustomerDetail(customer.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/customers/:id
router.get("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const result = await fetchCustomerDetail(parseInt(String(req.params.id), 10));
    if (!result) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/customers/:id
router.patch("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { fullName, phone, cin, passportNumber, drivingLicenseNumber, address, city } = req.body;
    const customerId = parseInt(String(req.params.id), 10);
    const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, customerId)).limit(1);
    if (!customer) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }

    if (fullName || phone) {
      await db
        .update(schema.usersTable)
        .set({ ...(fullName && { fullName }), ...(phone && { phone }) })
        .where(eq(schema.usersTable.id, customer.userId));
    }

    await db
      .update(schema.customersTable)
      .set({
        ...(cin !== undefined && { cin }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(drivingLicenseNumber !== undefined && { drivingLicenseNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      })
      .where(eq(schema.customersTable.id, customerId));

    const result = await fetchCustomerDetail(customerId);
    if (!result) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
