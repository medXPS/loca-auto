import { Router } from "express";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  expireStaleAvailabilityLocks,
  getCarsAvailabilitySummaries,
  type CarAvailabilitySummary,
} from "../lib/availability";
import {
  ensureCatalogueBackfill,
  formatAgency,
  formatBrand,
  getCarRelations,
  resolveAgencyForCar,
  resolveBrandForCar,
} from "../lib/catalog";

const router = Router();

function inferCarMediaType(url: string, mediaType?: string | null) {
  const normalizedUrl = url.trim().toLowerCase();
  const looksLikeVideo =
    normalizedUrl.startsWith("data:video/") ||
    /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(normalizedUrl);

  if (looksLikeVideo) return "VIDEO";
  if (mediaType === "IMAGE_360") return "IMAGE_360";
  if (mediaType === "VIDEO") return "VIDEO";
  return "IMAGE";
}

function inferCarSourceType(url: string, sourceType?: string | null) {
  if (sourceType === "URL" || sourceType === "UPLOAD") return sourceType;
  return url.trim().toLowerCase().startsWith("data:") ? "UPLOAD" : "URL";
}

function formatCarBase(
  car: typeof schema.carsTable.$inferSelect,
  availability?: CarAvailabilitySummary,
) {
  return {
    ...car,
    dailyPrice: Number(car.dailyPrice),
    weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
    monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
    depositAmount: car.depositAmount ? Number(car.depositAmount) : null,
    status: car.status,
    rawStatus: car.status,
    availability,
  };
}

function attachCarRelations(
  car: typeof schema.carsTable.$inferSelect,
  relations: Awaited<ReturnType<typeof getCarRelations>>,
  availability?: CarAvailabilitySummary,
) {
  const brand = car.brandId
    ? relations.brandsById.get(car.brandId)
    : relations.brandsByName.get(car.brand.trim().toLowerCase());
  const agency = car.agencyId
    ? relations.agenciesById.get(car.agencyId)
    : relations.agenciesByCity.get(car.city.trim().toLowerCase());
  const rating = relations.ratingsByCarId.get(car.id);

  return {
    ...formatCarBase(car, availability),
    brandMeta: brand ? formatBrand(brand) : null,
    agency: agency ? formatAgency(agency) : null,
    ratingSummary: {
      average: rating ? Number(rating.average) : 0,
      count: rating?.count ?? 0,
    },
  };
}

async function enrichCars(cars: Array<typeof schema.carsTable.$inferSelect>) {
  if (cars.length === 0) return [];
  const relations = await getCarRelations(cars);
  const availabilityByCarId = await getCarsAvailabilitySummaries(
    cars.map((car) => car.id),
  );
  return cars.map((car) =>
    attachCarRelations(car, relations, availabilityByCarId.get(car.id)),
  );
}

async function getCarRatings(carId: number) {
  const rows = await db
    .select({
      rating: schema.carRatingsTable,
      user: schema.usersTable,
    })
    .from(schema.carRatingsTable)
    .innerJoin(
      schema.customersTable,
      eq(schema.carRatingsTable.customerId, schema.customersTable.id),
    )
    .innerJoin(
      schema.usersTable,
      eq(schema.customersTable.userId, schema.usersTable.id),
    )
    .where(eq(schema.carRatingsTable.carId, carId))
    .orderBy(desc(schema.carRatingsTable.createdAt))
    .limit(8);

  return rows.map(({ rating, user }) => ({
    id: rating.id,
    rentalRequestId: rating.rentalRequestId,
    score: rating.score,
    comment: rating.comment,
    createdAt: rating.createdAt,
    customerName: user.fullName,
  }));
}

// GET /api/cars
router.get("/", async (req, res) => {
  try {
    await ensureCatalogueBackfill();
    await expireStaleAvailabilityLocks();

    const {
      search,
      brand,
      model,
      category,
      city,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      seats,
      available,
      startDate,
      returnDate,
      startHour,
      returnHour,
      startAt,
      returnAt,
      sortBy,
      agencyId,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        sql`(${ilike(schema.carsTable.brand, `%${search}%`)} OR ${ilike(schema.carsTable.model, `%${search}%`)} OR ${ilike(schema.carsTable.city, `%${search}%`)})`,
      );
    }
    if (brand) conditions.push(ilike(schema.carsTable.brand, `%${brand}%`));
    if (model) conditions.push(ilike(schema.carsTable.model, `%${model}%`));
    if (category)
      conditions.push(eq(schema.carsTable.category, category as any));
    if (city) conditions.push(ilike(schema.carsTable.city, `%${city}%`));
    if (agencyId && Number.isInteger(Number(agencyId)))
      conditions.push(eq(schema.carsTable.agencyId, Number(agencyId)));
    if (transmission)
      conditions.push(eq(schema.carsTable.transmission, transmission as any));
    if (fuelType)
      conditions.push(eq(schema.carsTable.fuelType, fuelType as any));
    if (minPrice) conditions.push(gte(schema.carsTable.dailyPrice, minPrice));
    if (maxPrice) conditions.push(lte(schema.carsTable.dailyPrice, maxPrice));
    if (seats) conditions.push(eq(schema.carsTable.seats, parseInt(seats, 10)));
    if (available === "true")
      conditions.push(eq(schema.carsTable.status, "AVAILABLE"));

    if (startDate && returnDate) {
      const now = new Date();
      const blockedRows = await db
        .selectDistinct({ carId: schema.carAvailabilityBlocksTable.carId })
        .from(schema.carAvailabilityBlocksTable)
        .where(
          and(
            eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
            lte(schema.carAvailabilityBlocksTable.startDate, startDate),
            gte(schema.carAvailabilityBlocksTable.endDate, returnDate),
            sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${now})`,
          ),
        );

      const blockedCarIds = blockedRows.map((row) => row.carId);
      if (blockedCarIds.length > 0) {
        conditions.push(notInArray(schema.carsTable.id, blockedCarIds));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sortBy) {
      case "price_asc":
        orderBy = asc(schema.carsTable.dailyPrice);
        break;
      case "price_desc":
        orderBy = desc(schema.carsTable.dailyPrice);
        break;
      case "year_desc":
        orderBy = desc(schema.carsTable.year);
        break;
      case "newest":
        orderBy = desc(schema.carsTable.createdAt);
        break;
      default:
        orderBy = asc(schema.carsTable.id);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.carsTable)
      .where(where);
    const cars = await db
      .select()
      .from(schema.carsTable)
      .where(where)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    res.json({
      cars: await enrichCars(cars),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/cars
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const brandPayload = await resolveBrandForCar(req.body);
      const agencyPayload = await resolveAgencyForCar(req.body);
      const [car] = await db
        .insert(schema.carsTable)
        .values({
          ...req.body,
          ...brandPayload,
          ...agencyPayload,
        })
        .returning();

      await logAudit(req, {
        userId: req.user!.userId,
        action: "CREATE_CAR",
        entityType: "car",
        entityId: car.id,
      });
      const [enriched] = await enrichCars([car]);
      res.status(201).json(enriched);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// GET /api/cars/:id
router.get("/:id", async (req, res) => {
  try {
    await ensureCatalogueBackfill();

    const [car] = await db
      .select()
      .from(schema.carsTable)
      .where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10)))
      .limit(1);

    if (!car) {
      res.status(404).json({ error: "Voiture non trouvee" });
      return;
    }

    const images = await db
      .select()
      .from(schema.carImagesTable)
      .where(eq(schema.carImagesTable.carId, car.id))
      .orderBy(asc(schema.carImagesTable.sortOrder), asc(schema.carImagesTable.id));
    const [enriched] = await enrichCars([car]);

    res.json({
      ...enriched,
      images: images.map((image) => ({
        ...image,
        mediaType: inferCarMediaType(image.url, image.mediaType),
        sourceType: inferCarSourceType(image.url, image.sourceType),
      })),
      ratings: await getCarRatings(car.id),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/cars/:id
router.patch(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const brandPayload = await resolveBrandForCar(req.body);
      const agencyPayload = await resolveAgencyForCar(req.body);
      const [car] = await db
        .update(schema.carsTable)
        .set({
          ...req.body,
          ...brandPayload,
          ...agencyPayload,
        })
        .where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10)))
        .returning();

      if (!car) {
        res.status(404).json({ error: "Voiture non trouvee" });
        return;
      }

      await logAudit(req, {
        userId: req.user!.userId,
        action: "UPDATE_CAR",
        entityType: "car",
        entityId: car.id,
      });
      const [enriched] = await enrichCars([car]);
      res.json(enriched);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// DELETE /api/cars/:id
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      await db
        .delete(schema.carsTable)
        .where(eq(schema.carsTable.id, parseInt(String(req.params.id), 10)));
      await logAudit(req, {
        userId: req.user!.userId,
        action: "DELETE_CAR",
        entityType: "car",
        entityId: parseInt(String(req.params.id), 10),
      });
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// POST /api/cars/:id/images
router.post(
  "/:id/images",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const carId = parseInt(String(req.params.id), 10);
      const {
        url,
        altText,
        isMain,
        sortOrder,
        mediaType = "IMAGE",
        sourceType = "URL",
      } = req.body;
      if (!url) {
        res.status(400).json({ error: "URL ou fichier requis" });
        return;
      }

      const [media] = await db
        .insert(schema.carImagesTable)
        .values({
          carId,
          url,
          altText,
          isMain: Boolean(isMain),
          sortOrder: Number(sortOrder ?? 0),
          mediaType,
          sourceType,
        })
        .returning();

      const normalizedMedia = {
        ...media,
        mediaType: inferCarMediaType(media.url, media.mediaType),
        sourceType: inferCarSourceType(media.url, media.sourceType),
      };

      if (media.isMain && media.mediaType === "IMAGE") {
        await db
          .update(schema.carsTable)
          .set({ mainImageUrl: media.url })
          .where(eq(schema.carsTable.id, carId));
      }

      res.status(201).json(normalizedMedia);
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// DELETE /api/cars/:id/images/:imageId
router.delete(
  "/:id/images/:imageId",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      await db
        .delete(schema.carImagesTable)
        .where(
          and(
            eq(
              schema.carImagesTable.carId,
              parseInt(String(req.params.id), 10),
            ),
            eq(
              schema.carImagesTable.id,
              parseInt(String(req.params.imageId), 10),
            ),
          ),
        );
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// GET /api/cars/:id/availability
router.get("/:id/availability", async (req, res) => {
  try {
    await expireStaleAvailabilityLocks();
    const blocks = await db
      .select()
      .from(schema.carAvailabilityBlocksTable)
      .where(
        and(
          eq(
            schema.carAvailabilityBlocksTable.carId,
            parseInt(String(req.params.id), 10),
          ),
          eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
          sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${new Date()})`,
        ),
      );
    res.json(blocks);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
