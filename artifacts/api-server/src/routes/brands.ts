import { Router } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { formatBrand, normalizeBrandPayload, syncBrandCatalogueFromCars } from "../lib/catalog";

const router = Router();

async function getBrandCarCounts() {
  const cars = await db.select({
    brandId: schema.carsTable.brandId,
    brand: schema.carsTable.brand,
  }).from(schema.carsTable);

  const countsByBrandId = new Map<number, number>();
  const countsByName = new Map<string, number>();

  for (const car of cars) {
    if (car.brandId) {
      countsByBrandId.set(car.brandId, (countsByBrandId.get(car.brandId) ?? 0) + 1);
    } else if (car.brand?.trim()) {
      const key = car.brand.trim().toLowerCase();
      countsByName.set(key, (countsByName.get(key) ?? 0) + 1);
    }
  }

  return { countsByBrandId, countsByName };
}

router.get("/", async (_req, res) => {
  try {
    await syncBrandCatalogueFromCars();
    const brands = await db.select().from(schema.carBrandsTable).orderBy(asc(schema.carBrandsTable.name));
    const { countsByBrandId, countsByName } = await getBrandCarCounts();

    res.json(brands.map((brand) => ({
      ...formatBrand(brand),
      carsCount: countsByBrandId.get(brand.id) ?? countsByName.get(brand.name.toLowerCase()) ?? 0,
    })));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const payload = normalizeBrandPayload(req.body);
    const [existing] = await db
      .select()
      .from(schema.carBrandsTable)
      .where(sql`lower(${schema.carBrandsTable.name}) = lower(${payload.name})`)
      .limit(1);

    const [brand] = existing
      ? await db.update(schema.carBrandsTable).set(payload).where(eq(schema.carBrandsTable.id, existing.id)).returning()
      : await db.insert(schema.carBrandsTable).values(payload).returning();

    res.status(existing ? 200 : 201).json(formatBrand(brand));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Impossible d'enregistrer la marque" });
  }
});

router.patch("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const payload = normalizeBrandPayload(req.body);
    const [brand] = await db
      .update(schema.carBrandsTable)
      .set(payload)
      .where(eq(schema.carBrandsTable.id, parseInt(String(req.params.id), 10)))
      .returning();

    if (!brand) {
      res.status(404).json({ error: "Marque introuvable" });
      return;
    }

    res.json(formatBrand(brand));
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Impossible de mettre a jour la marque" });
  }
});

export default router;
