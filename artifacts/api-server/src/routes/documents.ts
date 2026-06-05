import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware } from "../lib/auth";

const router = Router();

// POST /api/documents
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { rentalRequestId, type, fileUrl } = req.body;
    const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
    if (!customer) { res.status(404).json({ error: "Profil client non trouvé" }); return; }
    const [doc] = await db.insert(schema.documentsTable).values({ customerId: customer.id, rentalRequestId, type, fileUrl }).returning();
    res.status(201).json(doc);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/documents/:rentalRequestId
router.get("/:rentalRequestId", authMiddleware, async (req, res) => {
  try {
    const docs = await db.select().from(schema.documentsTable)
      .where(eq(schema.documentsTable.rentalRequestId, parseInt(req.params.rentalRequestId)));
    res.json(docs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/upload/presign — simple stub for direct URL upload
export const uploadRouter = Router();
uploadRouter.post("/presign", authMiddleware, (req, res) => {
  const { fileName, fileType } = req.body;
  const fileUrl = `/uploads/${Date.now()}-${fileName}`;
  res.json({ uploadUrl: fileUrl, fileUrl });
});

export default router;
