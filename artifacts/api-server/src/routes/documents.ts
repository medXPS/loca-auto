import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { expireStaleAvailabilityLocks, markRequestPendingCallConfirmation } from "../lib/availability";
import { logAudit } from "../lib/audit";

const router = Router();

async function getCurrentCustomerId(userId: number) {
  const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, userId)).limit(1);
  return customer?.id ?? null;
}

async function getRentalRequestById(rentalRequestId: number) {
  const [request] = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.id, rentalRequestId)).limit(1);
  return request ?? null;
}

async function getDocumentsForRentalRequest(rentalRequestId: number) {
  return db
    .select()
    .from(schema.documentsTable)
    .where(eq(schema.documentsTable.rentalRequestId, rentalRequestId))
    .orderBy(desc(schema.documentsTable.uploadedAt));
}

// POST /api/documents
router.post("/", authMiddleware, async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();

    const { rentalRequestId, type, fileUrl } = req.body;
    const customerId = await getCurrentCustomerId(req.user!.userId);
    if (!customerId) {
      res.status(404).json({ error: "Profil client non trouve" });
      return;
    }

    const requestId = rentalRequestId ? Number(rentalRequestId) : null;
    let request = null;
    if (requestId) {
      request = await getRentalRequestById(requestId);
      if (!request) {
        res.status(404).json({ error: "Demande non trouvee" });
        return;
      }

      if (req.user!.role === "CUSTOMER" && request.customerId !== customerId) {
        res.status(403).json({ error: "Non autorise" });
        return;
      }
    }

    const existingConditions = [
      eq(schema.documentsTable.customerId, customerId),
      eq(schema.documentsTable.type, type),
      requestId
        ? eq(schema.documentsTable.rentalRequestId, requestId)
        : sql`${schema.documentsTable.rentalRequestId} IS NULL`,
    ];

    const [existing] = await db.select().from(schema.documentsTable)
      .where(and(...existingConditions))
      .limit(1);

    let doc;
    if (existing) {
      [doc] = await db.update(schema.documentsTable)
        .set({
          fileUrl,
          status: "PENDING",
          uploadedAt: new Date(),
        })
        .where(eq(schema.documentsTable.id, existing.id))
        .returning();
    } else {
      [doc] = await db.insert(schema.documentsTable).values({
        customerId,
        rentalRequestId: requestId,
        type,
        fileUrl,
        status: "PENDING",
      }).returning();
    }

    const [profileDocument] = await db.select().from(schema.documentsTable)
      .where(and(
        eq(schema.documentsTable.customerId, customerId),
        eq(schema.documentsTable.type, type),
        sql`${schema.documentsTable.rentalRequestId} IS NULL`,
      ))
      .limit(1);

    if (profileDocument) {
      await db.update(schema.documentsTable)
        .set({
          fileUrl,
          status: "PENDING",
          uploadedAt: new Date(),
        })
        .where(eq(schema.documentsTable.id, profileDocument.id));
    } else {
      await db.insert(schema.documentsTable).values({
        customerId,
        rentalRequestId: null,
        type,
        fileUrl,
        status: "PENDING",
      });
    }

    if (requestId) {
      const docs = await db.select().from(schema.documentsTable)
        .where(eq(schema.documentsTable.rentalRequestId, requestId));
      const hasCin = docs.some((item) => item.type === "CIN" || item.type === "PASSPORT");
      const hasDrivingLicense = docs.some((item) => item.type === "PERMIS_CONDUIRE");
      if (hasCin && hasDrivingLicense) {
        const [updated] = await db.update(schema.rentalRequestsTable)
          .set({ status: "PENDING_CALL_CONFIRMATION" })
          .where(and(
            eq(schema.rentalRequestsTable.id, requestId),
            sql`${schema.rentalRequestsTable.status} IN ('DOCUMENT_SUBMISSION_WINDOW', 'WAITING_DOCUMENTS', 'PENDING')`,
          ))
          .returning();
        if (updated) {
          await markRequestPendingCallConfirmation(updated);
        }
      }
    }

    res.status(201).json(doc);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/documents/:rentalRequestId
router.get("/:rentalRequestId", authMiddleware, async (req, res) => {
  try {
    const rentalRequestId = parseInt(String(req.params.rentalRequestId), 10);
    const request = await getRentalRequestById(rentalRequestId);
    if (!request) {
      res.status(404).json({ error: "Demande non trouvee" });
      return;
    }

    if (req.user!.role === "CUSTOMER") {
      const customerId = await getCurrentCustomerId(req.user!.userId);
      if (!customerId || request.customerId !== customerId) {
        res.status(403).json({ error: "Non autorise" });
        return;
      }
    }

    const docs = await getDocumentsForRentalRequest(rentalRequestId);
    res.json(docs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/documents/:rentalRequestId/approve
router.patch("/:rentalRequestId/approve", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const rentalRequestId = parseInt(String(req.params.rentalRequestId), 10);
    const request = await getRentalRequestById(rentalRequestId);
    if (!request) {
      res.status(404).json({ error: "Demande non trouvee" });
      return;
    }

    const documents = await getDocumentsForRentalRequest(rentalRequestId);
    if (documents.length === 0) {
      res.status(404).json({ error: "Aucun document trouve" });
      return;
    }

    const updatedDocuments = await Promise.all(
      documents.map(async (document) => {
        const [updated] = await db
          .update(schema.documentsTable)
          .set({ status: "APPROVED" })
          .where(eq(schema.documentsTable.id, document.id))
          .returning();
        return updated ?? document;
      }),
    );

    await logAudit(req, {
      userId: req.user!.userId,
      action: "APPROVE_DOCUMENTS",
      entityType: "rental_request",
      entityId: request.id,
      details: `Validation de ${updatedDocuments.length} document${updatedDocuments.length > 1 ? "s" : ""}.`,
    });

    res.json({ documents: updatedDocuments });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/upload/presign - simple stub for direct URL upload
export const uploadRouter = Router();
uploadRouter.post("/presign", authMiddleware, (req, res) => {
  const { fileName } = req.body;
  const safeName = String(fileName ?? "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileUrl = `/uploads/${Date.now()}-${safeName}`;
  res.json({ uploadUrl: fileUrl, fileUrl });
});

export default router;
