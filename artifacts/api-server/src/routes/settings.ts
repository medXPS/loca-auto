import { Router } from "express";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/settings/company
router.get("/company", async (req, res) => {
  try {
    let [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    if (!settings) {
      [settings] = await db.insert(schema.companySettingsTable).values({}).returning();
    }
    res.json(settings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/settings/company
router.patch("/company", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    let [existing] = await db.select().from(schema.companySettingsTable).limit(1);
    if (!existing) {
      [existing] = await db.insert(schema.companySettingsTable).values({}).returning();
    }
    const [settings] = await db.update(schema.companySettingsTable).set(req.body).where(eq(schema.companySettingsTable.id, existing.id)).returning();
    res.json(settings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
