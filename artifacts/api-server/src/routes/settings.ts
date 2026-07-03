import { Router } from "express";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { eq } from "drizzle-orm";
import { normalizeCompanyPricingInput } from "../lib/pricing";

const router = Router();
const minimumPaymentDeadlineHours = 24;

function normalizePaymentDeadlineHours(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimumPaymentDeadlineHours
    ? Math.round(parsed)
    : minimumPaymentDeadlineHours;
}

async function ensurePaymentDeadlineMinimum(settings: typeof schema.companySettingsTable.$inferSelect) {
  if ((settings.paymentDeadlineHours ?? 0) >= minimumPaymentDeadlineHours) {
    return settings;
  }

  const [updated] = await db.update(schema.companySettingsTable)
    .set({ paymentDeadlineHours: minimumPaymentDeadlineHours })
    .where(eq(schema.companySettingsTable.id, settings.id))
    .returning();

  return updated ?? settings;
}

// GET /api/settings/company
router.get("/company", async (req, res) => {
  try {
    let [settings] = await db.select().from(schema.companySettingsTable).limit(1);
    if (!settings) {
      [settings] = await db.insert(schema.companySettingsTable).values({}).returning();
    }
    settings = await ensurePaymentDeadlineMinimum(settings);
    res.json(settings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/settings/company
router.patch("/company", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    let [existing] = await db.select().from(schema.companySettingsTable).limit(1);
    if (!existing) {
      [existing] = await db.insert(schema.companySettingsTable).values({}).returning();
    }
    const payload = {
      ...req.body,
      ...normalizeCompanyPricingInput(req.body),
      ...(req.body.paymentDeadlineHours !== undefined && {
        paymentDeadlineHours: normalizePaymentDeadlineHours(req.body.paymentDeadlineHours),
      }),
    };
    const [settings] = await db.update(schema.companySettingsTable).set(payload).where(eq(schema.companySettingsTable.id, existing.id)).returning();
    res.json(settings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
