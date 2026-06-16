import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { formatAgency, normalizeAgencyPayload, syncAgencyCatalogueFromCars } from "../lib/catalog";

const router = Router();

async function getAgencyCarCounts() {
  const cars = await db.select({
    agencyId: schema.carsTable.agencyId,
    city: schema.carsTable.city,
  }).from(schema.carsTable);

  const countsByAgencyId = new Map<number, number>();
  const countsByCity = new Map<string, number>();

  for (const car of cars) {
    if (car.agencyId) {
      countsByAgencyId.set(car.agencyId, (countsByAgencyId.get(car.agencyId) ?? 0) + 1);
    } else if (car.city?.trim()) {
      const key = car.city.trim().toLowerCase();
      countsByCity.set(key, (countsByCity.get(key) ?? 0) + 1);
    }
  }

  return { countsByAgencyId, countsByCity };
}

router.get("/", async (_req, res) => {
  try {
    await syncAgencyCatalogueFromCars();
    const agencies = await db
      .select()
      .from(schema.agenciesTable)
      .orderBy(asc(schema.agenciesTable.city), asc(schema.agenciesTable.name));
    const { countsByAgencyId, countsByCity } = await getAgencyCarCounts();

    res.json(agencies.map((agency) => ({
      ...formatAgency(agency),
      carsCount: countsByAgencyId.get(agency.id) ?? countsByCity.get(agency.city.toLowerCase()) ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const payload = normalizeAgencyPayload(req.body);
    const [agency] = await db.insert(schema.agenciesTable).values(payload).returning();
    res.status(201).json(formatAgency(agency));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Impossible d'enregistrer l'agence" });
  }
});

router.patch("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const payload = normalizeAgencyPayload(req.body);
    const [agency] = await db
      .update(schema.agenciesTable)
      .set(payload)
      .where(eq(schema.agenciesTable.id, parseInt(String(req.params.id), 10)))
      .returning();

    if (!agency) {
      res.status(404).json({ error: "Agence introuvable" });
      return;
    }

    res.json(formatAgency(agency));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Impossible de mettre a jour l'agence" });
  }
});

export default router;
