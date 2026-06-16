import { Router } from "express";
import { eq, and, ilike, gte, lte, sql, asc, desc, notInArray } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { combineDateAndHour, expireStaleAvailabilityLocks } from "../lib/availability";

const router = Router();

function formatCar(car: typeof schema.carsTable.$inferSelect) {
  return {
    ...car,
    dailyPrice: Number(car.dailyPrice),
    weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
    monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
    depositAmount: car.depositAmount ? Number(car.depositAmount) : null,
  };
}

// GET /api/cars
router.get("/", async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const { search, brand, model, category, city, transmission, fuelType, minPrice, maxPrice, seats, available, startDate, returnDate, startHour, returnHour, startAt, returnAt, sortBy, page = "1", limit = "12" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const conditions = [];
    if (search) {
      conditions.push(
        sql`(${ilike(schema.carsTable.brand, `%${search}%`)} OR ${ilike(schema.carsTable.model, `%${search}%`)} OR ${ilike(schema.carsTable.city, `%${search}%`)})`
      );
    }
    if (brand) conditions.push(ilike(schema.carsTable.brand, `%${brand}%`));
    if (model) conditions.push(ilike(schema.carsTable.model, `%${model}%`));
    if (category) conditions.push(eq(schema.carsTable.category, category as any));
    if (city) conditions.push(ilike(schema.carsTable.city, `%${city}%`));
    if (transmission) conditions.push(eq(schema.carsTable.transmission, transmission as any));
    if (fuelType) conditions.push(eq(schema.carsTable.fuelType, fuelType as any));
    if (minPrice) conditions.push(gte(schema.carsTable.dailyPrice, minPrice));
    if (maxPrice) conditions.push(lte(schema.carsTable.dailyPrice, maxPrice));
    if (seats) conditions.push(eq(schema.carsTable.seats, parseInt(seats)));
    if (available === "true") conditions.push(eq(schema.carsTable.status, "AVAILABLE"));
    if (startDate && returnDate) {
      const now = new Date();
      const requestedStartAt = startAt ? new Date(startAt) : combineDateAndHour(startDate, startHour ?? "09:00");
      const requestedEndAt = returnAt ? new Date(returnAt) : new Date(combineDateAndHour(returnDate, returnHour ?? "18:00").getTime() + 30 * 60 * 1000);
      const blockedRows = await db.selectDistinct({ carId: schema.carAvailabilityBlocksTable.carId })
        .from(schema.carAvailabilityBlocksTable)
        .where(and(
          eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
          lte(schema.carAvailabilityBlocksTable.startDate, returnDate),
          gte(schema.carAvailabilityBlocksTable.endDate, startDate),
          sql`coalesce(${schema.carAvailabilityBlocksTable.startAt}, (${schema.carAvailabilityBlocksTable.startDate}::text || 'T00:00:00')::timestamptz) < ${requestedEndAt}`,
          sql`coalesce(${schema.carAvailabilityBlocksTable.endAt}, (${schema.carAvailabilityBlocksTable.endDate}::text || 'T23:59:00')::timestamptz) > ${requestedStartAt}`,
          sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${now})`,
        ));
      const blockedCarIds = blockedRows.map((row) => row.carId);
      if (blockedCarIds.length > 0) {
        conditions.push(notInArray(schema.carsTable.id, blockedCarIds));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sortBy) {
      case "price_asc": orderBy = asc(schema.carsTable.dailyPrice); break;
      case "price_desc": orderBy = desc(schema.carsTable.dailyPrice); break;
      case "year_desc": orderBy = desc(schema.carsTable.year); break;
      case "newest": orderBy = desc(schema.carsTable.createdAt); break;
      default: orderBy = asc(schema.carsTable.id);
    }

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.carsTable).where(where);
    const cars = await db.select().from(schema.carsTable).where(where).orderBy(orderBy).limit(limitNum).offset((pageNum - 1) * limitNum);

    res.json({ cars: cars.map(formatCar), total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/cars
router.post("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const [car] = await db.insert(schema.carsTable).values(req.body).returning();
    await logAudit({ userId: req.user!.userId, action: "CREATE_CAR", entityType: "car", entityId: car.id });
    res.status(201).json(formatCar(car));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/cars/:id
router.get("/:id", async (req, res) => {
  try {
    const [car] = await db.select().from(schema.carsTable).where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10))).limit(1);
    if (!car) { res.status(404).json({ error: "Voiture non trouvée" }); return; }
    const images = await db.select().from(schema.carImagesTable).where(eq(schema.carImagesTable.carId, car.id));
    res.json({ ...formatCar(car), images });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/cars/:id
router.patch("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const [car] = await db.update(schema.carsTable).set(req.body).where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10))).returning();
    if (!car) { res.status(404).json({ error: "Voiture non trouvée" }); return; }
    await logAudit({ userId: req.user!.userId, action: "UPDATE_CAR", entityType: "car", entityId: car.id });
    res.json(formatCar(car));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/cars/:id
router.delete("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    await db.delete(schema.carsTable).where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10)));
    await logAudit({ userId: req.user!.userId, action: "DELETE_CAR", entityType: "car", entityId: parseInt(String(req.params.id), 10) });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/cars/:id/images
router.post("/:id/images", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const carId = parseInt(String(req.params.id), 10);
    const { url, altText, isMain, sortOrder, mediaType = "IMAGE", sourceType = "URL" } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL ou fichier requis" });
      return;
    }
    const [media] = await db.insert(schema.carImagesTable).values({
      carId,
      url,
      altText,
      isMain: Boolean(isMain),
      sortOrder: Number(sortOrder ?? 0),
      mediaType,
      sourceType,
    }).returning();
    if (media.isMain && media.mediaType === "IMAGE") {
      await db.update(schema.carsTable).set({ mainImageUrl: media.url }).where(eq(schema.carsTable.id, carId));
    }
    res.status(201).json(media);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/cars/:id/images/:imageId
router.delete("/:id/images/:imageId", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    await db.delete(schema.carImagesTable)
      .where(and(
        eq(schema.carImagesTable.carId, parseInt(String(req.params.id), 10)),
        eq(schema.carImagesTable.id, parseInt(String(req.params.imageId), 10)),
      ));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/cars/:id/availability
router.get("/:id/availability", async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const blocks = await db.select().from(schema.carAvailabilityBlocksTable)
      .where(and(
        eq(schema.carAvailabilityBlocksTable.carId, parseInt(String(req.params.id), 10)),
        eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
        sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${new Date()})`,
      ));
    res.json(blocks);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
