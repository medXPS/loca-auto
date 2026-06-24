import { Router } from "express";
import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { createNotification } from "../lib/notify";
import { sendReceiptEmail } from "../lib/mailer";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import {
  addReturnBuffer,
  combineDateAndHour,
  createTemporaryHold,
  expireStaleAvailabilityLocks,
  getPaymentDeadlineHours,
  getRequestAvailabilityEndAt,
  getRequestStartAt,
  hasActiveAvailabilityOverlap,
  markRequestCallConfirmed,
  markRequestPendingCallConfirmation,
  markRequestReserved,
  releaseRequestAvailabilityBlocks,
} from "../lib/availability";

const router = Router();

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  DOCUMENT_SUBMISSION_WINDOW: "Documents requis",
  PENDING_CALL_CONFIRMATION: "Documents recus",
  EXTENDED_PAYMENT_DEADLINE: "Delai prolonge",
  PAID: "Payee",
  ACTIVE_RENTAL: "En cours de location",
  UNDER_REVIEW: "En attente",
  CALL_ATTEMPTED: "En attente",
  CALL_CONFIRMED: "Appel confirmé",
  WAITING_AGENCY_PAYMENT: "Appel confirmé",
  RESERVED: "Réservé",
  REJECTED: "Refusé",
  WAITING_DOCUMENTS: "En attente",
  CAR_DELIVERED: "En cours de location",
  RENTED: "En cours de location",
  CAR_RETURNED: "Retourné",
  RETURNED: "Retourné",
  CANCELLED: "Annulé",
  ABANDONED: "Abandonné",
  COMPLETED: "Retourné",
};

async function fetchRequestWithCar(id: number) {
  const [req] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, id)).limit(1);
  if (!req) return null;
  const [car] = await db.select().from(schema.carsTable).where(eq(schema.carsTable.id, req.carId)).limit(1);
  return {
    ...req,
    statusLabel: STATUS_LABELS[req.status] ?? req.status,
    estimatedTotalPrice: Number(req.estimatedTotalPrice),
    finalPrice: req.finalPrice ? Number(req.finalPrice) : null,
    car: car
      ? {
          ...car,
          dailyPrice: Number(car.dailyPrice),
          weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
          monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
        }
      : null,
  };
}

function normalizeAmount(amount: unknown) {
  if (amount === undefined || amount === null || amount === "") return null;
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveRentalTimes(body: any) {
  const startDate = String(body.startDate ?? "");
  const returnDate = String(body.returnDate ?? "");
  const startAt = body.startAt ? new Date(body.startAt) : combineDateAndHour(startDate, body.startHour ?? "09:00");
  const returnAt = body.returnAt ? new Date(body.returnAt) : combineDateAndHour(returnDate, body.returnHour ?? "18:00");
  return { startDate, returnDate, startAt, returnAt };
}

function formatMoney(amount: number) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} MAD`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(method?: string | null) {
  switch (method) {
    case "CARD_AT_AGENCY":
      return "Carte à l'agence";
    case "BANK_TRANSFER":
      return "Virement bancaire";
    case "CASH_AT_AGENCY":
    default:
      return "Espèces à l'agence";
  }
}

function calculateBreakdown(totalPaid: number, insuranceIncluded: boolean) {
  const taxes = Math.round(totalPaid * 0.1 * 100) / 100;
  const assurance = insuranceIncluded ? 0 : Math.round(totalPaid * 0.05 * 100) / 100;
  const repairs = 0;
  const subtotal = Math.round((totalPaid - taxes - assurance - repairs) * 100) / 100;

  return {
    subtotal,
    taxes,
    assurance,
    repairs,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

async function buildReceiptPdf(args: {
  settings: any;
  request: Awaited<ReturnType<typeof fetchRequestWithCar>> & { car: any };
  receiptNumber: string;
  verificationUrl: string;
}) {
  const { settings, request, receiptNumber, verificationUrl } = args;
  const paidAmount = Number(request.finalPrice || request.estimatedTotalPrice || 0);
  const breakdown = calculateBreakdown(paidAmount, Boolean(request.car?.insuranceIncluded));
  const days = Math.max(
    1,
    Math.round((new Date(`${request.returnDate}T00:00:00`).getTime() - new Date(`${request.startDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
    info: {
      Title: `Reçu ${receiptNumber}`,
      Author: settings.brandName || "Location Auto Maroc",
      Subject: "Reçu de paiement",
    },
  });

  const chunks: Buffer[] = [];
  const pdfDone = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const qrBuffer = await QRCode.toBuffer(verificationUrl, { margin: 1, width: 180 });

  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const top = doc.page.margins.top;

  const section = (x: number, y: number, sectionWidth: number, title: string, height: number) => {
    doc.roundedRect(x, y, sectionWidth, height, 14).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(title.toUpperCase(), x + 14, y + 12, { width: sectionWidth - 28 });
  };

  const textField = (x: number, y: number, label: string, value: string, widthValue: number) => {
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text(label, x, y);
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(value || "—", x, y + 12, { width: widthValue });
  };

  doc.fillColor("#0f172a");
  doc.font("Helvetica-Bold").fontSize(22).text(settings.brandName || "Location Auto Maroc", left, top);
  doc.font("Helvetica").fontSize(10).fillColor("#475569").text(settings.address || "", left, top + 28, { width: width * 0.6 });
  doc.text([settings.city, settings.phone].filter(Boolean).join(" • "), left, top + 42, { width: width * 0.6 });

  doc.roundedRect(left + width - 200, top - 4, 200, 72, 14).fillAndStroke("#eff6ff", "#bfdbfe");
  doc.fillColor("#1d4ed8").font("Helvetica-Bold").fontSize(10).text("REÇU DE PAIEMENT", left + width - 184, top + 12, { width: 168, align: "left" });
  doc.fillColor("#0f172a").font("Helvetica").fontSize(9).text(`N° ${receiptNumber}`, left + width - 184, top + 30);
  doc.text(`Date: ${formatDate(new Date())}`, left + width - 184, top + 44);

  doc.roundedRect(left, top + 78, width, 62, 14).fillAndStroke("#0f172a", "#0f172a");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text("Reçu archivable et imprimable", left + 16, top + 95);
  doc.font("Helvetica").fontSize(9).fillColor("#dbeafe").text("Ce document valide le paiement effectué à l'agence et peut être archivé dans le dossier client.", left + 16, top + 116, { width: width - 32 });

  const firstRowY = top + 158;
  const boxWidth = (width - 12) / 2;
  section(left, firstRowY, boxWidth, "Agence", 118);
  section(left + boxWidth + 12, firstRowY, boxWidth, "Client", 118);

  textField(left + 14, firstRowY + 32, "Nom", settings.brandName || "—", boxWidth - 28);
  textField(left + 14, firstRowY + 58, "Téléphone", settings.phone || "—", boxWidth - 28);
  textField(left + 14, firstRowY + 84, "Adresse", settings.address || "—", boxWidth - 28);

  textField(left + boxWidth + 26, firstRowY + 32, "Nom complet", request.fullName, boxWidth - 52);
  textField(left + boxWidth + 26, firstRowY + 58, "CIN", request.cinOrPassport || "—", boxWidth - 52);
  textField(left + boxWidth + 26, firstRowY + 84, "Téléphone", request.phone || "—", boxWidth - 52);

  const rentalY = firstRowY + 132;
  section(left, rentalY, width, "Location", 126);
  const rentalCols = [
    { label: "Réservation", value: `#${request.id}` },
    { label: "Véhicule", value: request.car ? `${request.car.brand} ${request.car.model}` : `Véhicule #${request.carId}` },
    { label: "Départ", value: new Date(request.startDate).toLocaleDateString("fr-MA") },
    { label: "Retour", value: new Date(request.returnDate).toLocaleDateString("fr-MA") },
    { label: "Jours", value: `${days} jour(s)` },
    { label: "Agence", value: request.pickupLocation || settings.city || "—" },
  ];
  rentalCols.forEach((item, index) => {
    const x = left + 14 + (index % 3) * ((width - 28) / 3);
    const y = rentalY + 34 + Math.floor(index / 3) * 36;
    textField(x, y, item.label, item.value, (width - 28) / 3 - 10);
  });

  const paymentY = rentalY + 146;
  section(left, paymentY, width, "Paiement", 206);

  const paymentRows = [
    ["Prix journalier", formatMoney(Number(request.car?.dailyPrice || 0))],
    ["Sous-total", formatMoney(breakdown.subtotal)],
    ["Taxes", formatMoney(breakdown.taxes)],
    ["Assurance", formatMoney(breakdown.assurance)],
    ["Réparations éventuelles", formatMoney(breakdown.repairs)],
    ["Montant total payé", formatMoney(breakdown.totalPaid)],
    ["Date de paiement", request.paidAtAgencyAt ? new Date(request.paidAtAgencyAt).toLocaleString("fr-MA") : new Date().toLocaleString("fr-MA")],
    ["Mode de paiement", formatPaymentMethod(request.paymentMethod)],
  ];

  paymentRows.forEach((row, index) => {
    const rowY = paymentY + 34 + index * 18;
    doc.fillColor(index === 5 ? "#1d4ed8" : "#64748b").font(index === 5 ? "Helvetica-Bold" : "Helvetica").fontSize(9).text(row[0], left + 14, rowY);
    doc.fillColor(index === 5 ? "#1d4ed8" : "#0f172a").font(index === 5 ? "Helvetica-Bold" : "Helvetica").fontSize(9).text(row[1], left + width - 210, rowY, { width: 196, align: "right" });
    if (index === 4) {
      doc.moveTo(left + 14, rowY + 15).lineTo(left + width - 14, rowY + 15).strokeColor("#e2e8f0").stroke();
    }
  });

  const footerY = paymentY + 220;
  section(left, footerY, width, "Vérification et signatures", 160);
  doc.image(qrBuffer, left + 18, footerY + 38, { width: 92, height: 92 });
  textField(left + 130, footerY + 40, "QR code", "Scannez pour vérifier l'authenticité du reçu", 220);
  textField(left + 130, footerY + 68, "Vérification", verificationUrl, 320);

  doc.moveTo(left + width - 210, footerY + 64).lineTo(left + width - 30, footerY + 64).strokeColor("#94a3b8").stroke();
  doc.fillColor("#475569").font("Helvetica").fontSize(9).text("Signature agence", left + width - 210, footerY + 72, { width: 180, align: "center" });
  doc.moveTo(left + width - 210, footerY + 112).lineTo(left + width - 30, footerY + 112).strokeColor("#94a3b8").stroke();
  doc.fillColor("#475569").font("Helvetica").fontSize(9).text("Signature client", left + width - 210, footerY + 120, { width: 180, align: "center" });

  doc.end();
  return pdfDone;
}

// GET /api/rental-requests/:id/receipt
router.get("/:id/receipt", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(String(req.params.id), 10);
    const result = await fetchRequestWithCar(requestId);
    if (!result) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (!customer || result.customerId !== customer.id) {
        res.status(403).json({ error: "Accès non autorisé" });
        return;
      }
    }

    if (!["RESERVED", "PAID", "ACTIVE_RENTAL", "CAR_DELIVERED", "CAR_RETURNED", "RETURNED", "COMPLETED"].includes(result.status)) {
      res.status(409).json({ error: "Le reçu PDF n'est disponible qu'après validation du paiement." });
      return;
    }

    const [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    const receiptNumber = `RCPT-${String(result.id).padStart(6, "0")}`;
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/rental-requests/${result.id}/receipt`;
    const pdfBuffer = await buildReceiptPdf({
      settings: settings || {},
      request: result as any,
      receiptNumber,
      verificationUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recu-${result.id}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.send(pdfBuffer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/rental-requests
router.get("/", authMiddleware, async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const { status, customerId, carId, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const conditions: any[] = [];

    if (status) conditions.push(eq(schema.rentalRequestsTable.status, status as any));
    if (customerId) conditions.push(eq(schema.rentalRequestsTable.customerId, parseInt(customerId, 10)));
    if (carId) conditions.push(eq(schema.rentalRequestsTable.carId, parseInt(carId, 10)));
    if (search) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.rentalRequestsTable.fullName, pattern),
          ilike(schema.rentalRequestsTable.phone, pattern),
          ilike(schema.rentalRequestsTable.email, pattern),
          ilike(schema.rentalRequestsTable.cinOrPassport, pattern),
        ),
      );
    }

    // Customers can only see their own
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (customer) conditions.push(eq(schema.rentalRequestsTable.customerId, customer.id));
    } else {
      conditions.push(sql`status <> 'CANCELLED'`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(where);
    const requests = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(where)
      .orderBy(desc(schema.rentalRequestsTable.createdAt))
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    const carIds = [...new Set(requests.map((r) => r.carId))];
    const cars = carIds.length > 0
      ? await db.select().from(schema.carsTable).where(sql`${schema.carsTable.id} = ANY(ARRAY[${sql.join(carIds.map((id) => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const carsMap = Object.fromEntries(cars.map((c) => [c.id, c]));

    const result = requests.map((r) => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
      car: carsMap[r.carId]
        ? {
            ...carsMap[r.carId],
            dailyPrice: Number(carsMap[r.carId].dailyPrice),
            weeklyPrice: carsMap[r.carId].weeklyPrice ? Number(carsMap[r.carId].weeklyPrice) : null,
            monthlyPrice: carsMap[r.carId].monthlyPrice ? Number(carsMap[r.carId].monthlyPrice) : null,
          }
        : null,
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
    await expireStaleAvailabilityLocks();
    const { carId, fullName, phone, email, cinOrPassport, drivingLicenseNumber, pickupLocation, returnLocation, estimatedTotalPrice, notes } = req.body;
    const { startDate, returnDate, startAt, returnAt } = resolveRentalTimes(req.body);

    if (!startDate || !returnDate || Number.isNaN(startAt.getTime()) || Number.isNaN(returnAt.getTime()) || returnAt <= startAt) {
      res.status(400).json({ error: "Dates ou heures de reservation invalides." });
      return;
    }

    const availabilityEndAt = addReturnBuffer(returnAt);
    if (await hasActiveAvailabilityOverlap(Number(carId), startDate, returnDate, undefined, startAt, availabilityEndAt)) {
      res.status(409).json({ error: "Cette voiture est deja reservee ou bloquee sur cette periode." });
      return;
    }

    let customerId = null;
    if (req.user!.role === "CUSTOMER") {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (customer) customerId = customer.id;
    }

    const [request] = await db
      .insert(schema.rentalRequestsTable)
      .values({
        customerId,
        carId,
        fullName,
        phone,
        email,
        cinOrPassport,
        drivingLicenseNumber,
        startDate,
        returnDate,
        startAt,
        returnAt,
        pickupLocation,
        returnLocation,
        estimatedTotalPrice: String(estimatedTotalPrice),
        notes,
        status: "DOCUMENT_SUBMISSION_WINDOW",
      })
      .returning();
    await createTemporaryHold(request);

    await logAudit({ userId: req.user!.userId, action: "CREATE_RENTAL_REQUEST", entityType: "rental_request", entityId: request.id });

    const result = await fetchRequestWithCar(request.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/rental-requests/check-expired
router.post("/check-expired", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const now = new Date();
    const expired = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(
        and(
          sql`status IN ('CALL_CONFIRMED', 'EXTENDED_PAYMENT_DEADLINE', 'WAITING_AGENCY_PAYMENT')`,
          lt(schema.rentalRequestsTable.paymentDeadline, now),
        ),
      );
    for (const r of expired) {
      await db.update(schema.rentalRequestsTable).set({ status: "ABANDONED", abandonedAt: now }).where(eq(schema.rentalRequestsTable.id, r.id));
      await releaseRequestAvailabilityBlocks(r.id, "EXPIRED");
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
    const result = await fetchRequestWithCar(parseInt(String(req.params.id), 10));
    if (!result) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    if (result.status === "CANCELLED" && req.user!.role !== "CUSTOMER") {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id
router.patch("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { fullName, phone, email, cinOrPassport, drivingLicenseNumber, pickupLocation, returnLocation, finalPrice, notes } = req.body;
    const requestId = parseInt(String(req.params.id), 10);
    const [existing] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, requestId)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Demande non trouvÃ©e" });
      return;
    }

    const hasDateUpdate = req.body.startDate || req.body.returnDate || req.body.startAt || req.body.returnAt || req.body.startHour || req.body.returnHour;
    const dateUpdate = hasDateUpdate
      ? resolveRentalTimes({
          ...req.body,
          startDate: req.body.startDate ?? existing.startDate,
          returnDate: req.body.returnDate ?? existing.returnDate,
        })
      : null;
    if (dateUpdate && await hasActiveAvailabilityOverlap(
      existing.carId,
      dateUpdate.startDate,
      dateUpdate.returnDate,
      existing.id,
      dateUpdate.startAt,
      addReturnBuffer(dateUpdate.returnAt),
    )) {
      res.status(409).json({ error: "Cette voiture est deja bloquee sur cette periode." });
      return;
    }

    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({
        fullName,
        phone,
        email,
        cinOrPassport,
        drivingLicenseNumber,
        ...(dateUpdate && {
          startDate: dateUpdate.startDate,
          returnDate: dateUpdate.returnDate,
          startAt: dateUpdate.startAt,
          returnAt: dateUpdate.returnAt,
        }),
        pickupLocation,
        returnLocation,
        ...(finalPrice !== undefined && finalPrice !== null && { finalPrice: String(finalPrice) }),
        notes,
      })
      .where(eq(schema.rentalRequestsTable.id, requestId))
      .returning();
    if (dateUpdate && updated) {
      const endAt = getRequestAvailabilityEndAt(updated);
      await db.update(schema.carAvailabilityBlocksTable)
        .set({
          startDate: updated.startDate,
          endDate: endAt.toISOString().slice(0, 10),
          startAt: getRequestStartAt(updated),
          endAt,
        })
        .where(and(
          eq(schema.carAvailabilityBlocksTable.rentalRequestId, updated.id),
          eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
        ));
    }
    if (!updated) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/status
router.patch("/:id/status", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({ status, ...(notes && { notes }) })
      .where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }
    if (["ABANDONED", "CANCELLED", "REJECTED"].includes(status)) {
      await releaseRequestAvailabilityBlocks(updated.id, status === "ABANDONED" ? "EXPIRED" : "RELEASED");
    }
    await logAudit({ userId: req.user!.userId, action: `STATUS_CHANGE_${status}`, entityType: "rental_request", entityId: updated.id, details: notes });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/confirm-call
router.patch("/:id/confirm-call", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { notes, finalPrice } = req.body;
    const now = new Date();

    const [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    const deadlineHours = getPaymentDeadlineHours(settings?.paymentDeadlineHours ?? 24);
    const paymentDeadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);

    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({
        status: "CALL_CONFIRMED",
        callConfirmedAt: now,
        callConfirmedBy: req.user!.userId,
        paymentDeadline,
        ...(notes && { notes }),
        ...(finalPrice !== undefined && finalPrice !== null && { finalPrice: String(finalPrice) }),
      })
      .where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    await markRequestCallConfirmed(updated);

    if (updated.customerId) {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, updated.customerId)).limit(1);
      if (customer) {
        await createNotification({
          userId: customer.userId,
          title: "Demande confirmée - Paiement requis",
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

// PATCH /api/rental-requests/:id/extend-payment-deadline
router.patch("/:id/extend-payment-deadline", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const hours = Number(req.body.hours);
    if (![12, 24].includes(hours)) {
      res.status(400).json({ error: "Extension autorisee: 12 ou 24 heures." });
      return;
    }

    const [existing] = await db.select().from(schema.rentalRequestsTable)
      .where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Demande non trouvee" });
      return;
    }
    if (!["CALL_CONFIRMED", "EXTENDED_PAYMENT_DEADLINE", "WAITING_AGENCY_PAYMENT"].includes(existing.status)) {
      res.status(409).json({ error: "Le delai ne peut etre prolonge qu'apres confirmation par appel." });
      return;
    }

    const baseDeadline = existing.paymentDeadline && existing.paymentDeadline > new Date()
      ? existing.paymentDeadline
      : new Date();
    const paymentDeadline = new Date(baseDeadline.getTime() + hours * 60 * 60 * 1000);

    const [updated] = await db.update(schema.rentalRequestsTable)
      .set({
        status: "EXTENDED_PAYMENT_DEADLINE",
        paymentDeadline,
        paymentDeadlineExtendedAt: new Date(),
        paymentDeadlineExtendedBy: req.user!.userId,
        paymentDeadlineExtensionHours: hours,
      })
      .where(eq(schema.rentalRequestsTable.id, existing.id))
      .returning();

    await markRequestCallConfirmed(updated, true);
    await logAudit({ userId: req.user!.userId, action: `EXTEND_PAYMENT_DEADLINE_${hours}H`, entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/confirm-payment
router.patch("/:id/confirm-payment", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { amount, notes, paymentMethod } = req.body;
    const now = new Date();
    const normalizedAmount = normalizeAmount(amount);
    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({
        status: "PAID",
        paymentStatus: "PAID_AT_AGENCY",
        paymentMethod: paymentMethod ?? "CASH_AT_AGENCY",
        paidAtAgencyAt: now,
        paymentConfirmedBy: req.user!.userId,
        ...(normalizedAmount !== null && { finalPrice: String(normalizedAmount) }),
        ...(notes && { notes }),
      })
      .where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    await markRequestReserved(updated);

    if (updated.customerId) {
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, updated.customerId)).limit(1);
      if (customer) {
        await createNotification({
          userId: customer.userId,
          title: "Paiement confirmé - Réservation validée",
          message: `Votre paiement pour la demande n°${updated.id} a été confirmé. Votre réservation est validée.`,
        });
      }
    }

    await logAudit({ userId: req.user!.userId, action: "CONFIRM_PAYMENT", entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    if (!result) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    const [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    const receiptNumber = `RCPT-${String(result.id).padStart(6, "0")}`;
    const verificationUrl = `${req.protocol}://${req.get("host")}/api/rental-requests/${result.id}/receipt`;

    try {
      const pdfBuffer = await buildReceiptPdf({
        settings: settings || {},
        request: result as any,
        receiptNumber,
        verificationUrl,
      });

      if (result.email) {
        await sendReceiptEmail(result.email, receiptNumber, pdfBuffer);
      }
    } catch (receiptError) {
      req.log.error(receiptError);
    }

    res.json({
      ...result,
      receiptUrl: `/api/rental-requests/${updated.id}/receipt`,
      receiptLabel: receiptNumber,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/rental-requests/:id/cancel
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const [existing] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10))).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Demande non trouvée" });
      return;
    }

    if (req.user!.role === "CUSTOMER") {
      if (!existing.customerId) {
        res.status(403).json({ error: "Non autorisé" });
        return;
      }
      const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
      if (!customer || customer.id !== existing.customerId) {
        res.status(403).json({ error: "Non autorisé" });
        return;
      }
    }

    const [updated] = await db
      .update(schema.rentalRequestsTable)
      .set({ status: "CANCELLED" })
      .where(eq(schema.rentalRequestsTable.id, parseInt(String(req.params.id), 10)))
      .returning();
    await releaseRequestAvailabilityBlocks(updated.id);

    await logAudit({ userId: req.user!.userId, action: "CANCEL_RENTAL_REQUEST", entityType: "rental_request", entityId: updated.id });
    const result = await fetchRequestWithCar(updated.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
