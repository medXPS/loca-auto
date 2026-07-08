import { Router } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();

const COMPLETED_RENTAL_STATUSES = [
  "CAR_RETURNED",
  "RETURNED",
  "COMPLETED",
] as const;

type SerializedRating = {
  id: number;
  rentalRequestId: number;
  score: number;
  serviceScore: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PublicRatingRow = {
  rating: typeof schema.carRatingsTable.$inferSelect;
  user: typeof schema.usersTable.$inferSelect;
  customer: typeof schema.customersTable.$inferSelect;
  car: typeof schema.carsTable.$inferSelect;
};

type CustomerRatingAggregate = {
  totalCarScore: number;
  totalServiceScore: number;
  totalReviews: number;
  latestCommentRating: PublicRatingRow | null;
};

function parseScore(value: unknown) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= 5
    ? numeric
    : null;
}

function getCurrentCustomer(userId: number) {
  return db
    .select()
    .from(schema.customersTable)
    .where(eq(schema.customersTable.userId, userId))
    .limit(1)
    .then(([customer]) => customer ?? null);
}

function serializeRating(rating: typeof schema.carRatingsTable.$inferSelect): SerializedRating {
  return {
    id: rating.id,
    rentalRequestId: rating.rentalRequestId,
    score: rating.score,
    serviceScore: rating.serviceScore ?? rating.score,
    comment: rating.comment?.trim() || null,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
  };
}

async function fetchEligibleRatingsForCustomer(customerId: number) {
  const requests = await db
    .select()
    .from(schema.rentalRequestsTable)
    .where(eq(schema.rentalRequestsTable.customerId, customerId))
    .orderBy(desc(schema.rentalRequestsTable.createdAt));

  const completedRequests = requests.filter((request) =>
    COMPLETED_RENTAL_STATUSES.includes(
      request.status as (typeof COMPLETED_RENTAL_STATUSES)[number],
    ),
  );

  const carIds = [...new Set(completedRequests.map((request) => request.carId))];
  const requestIds = completedRequests.map((request) => request.id);

  const cars =
    carIds.length > 0
      ? await db
          .select()
          .from(schema.carsTable)
          .where(inArray(schema.carsTable.id, carIds))
      : [];
  const ratings =
    requestIds.length > 0
      ? await db
          .select()
          .from(schema.carRatingsTable)
          .where(inArray(schema.carRatingsTable.rentalRequestId, requestIds))
      : [];

  const carsById = new Map(cars.map((car) => [car.id, car]));
  const ratingsByRequestId = new Map(
    ratings.map((rating) => [rating.rentalRequestId, rating]),
  );

  return completedRequests.map((request) => ({
    requestId: request.id,
    status: request.status,
    createdAt: request.createdAt,
    startDate: request.startDate,
    returnDate: request.returnDate,
    finalPrice: request.finalPrice ? Number(request.finalPrice) : null,
    car: carsById.get(request.carId)
      ? {
          id: request.carId,
          brand: carsById.get(request.carId)!.brand,
          model: carsById.get(request.carId)!.model,
          mainImageUrl: carsById.get(request.carId)!.mainImageUrl,
        }
      : null,
    existingRating: ratingsByRequestId.get(request.id)
      ? serializeRating(ratingsByRequestId.get(request.id)!)
      : null,
  }));
}

async function fetchPublicRatingsOverview() {
  const rows = await db
    .select({
      rating: schema.carRatingsTable,
      user: schema.usersTable,
      customer: schema.customersTable,
      car: schema.carsTable,
    })
    .from(schema.carRatingsTable)
    .innerJoin(
      schema.customersTable,
      eq(schema.carRatingsTable.customerId, schema.customersTable.id),
    )
    .innerJoin(schema.usersTable, eq(schema.customersTable.userId, schema.usersTable.id))
    .innerJoin(schema.carsTable, eq(schema.carRatingsTable.carId, schema.carsTable.id))
    .orderBy(
      desc(schema.carRatingsTable.updatedAt),
      desc(schema.carRatingsTable.createdAt),
      desc(schema.carRatingsTable.id),
    );

  const customerAggregates = new Map<number, CustomerRatingAggregate>();
  let totalCarScore = 0;
  let totalServiceScore = 0;

  for (const row of rows) {
    const serviceScore = row.rating.serviceScore ?? row.rating.score;
    totalCarScore += row.rating.score;
    totalServiceScore += serviceScore;

    const current = customerAggregates.get(row.customer.id) ?? {
      totalCarScore: 0,
      totalServiceScore: 0,
      totalReviews: 0,
      latestCommentRating: null,
    };

    current.totalCarScore += row.rating.score;
    current.totalServiceScore += serviceScore;
    current.totalReviews += 1;

    if (!current.latestCommentRating && row.rating.comment?.trim()) {
      current.latestCommentRating = row;
    }

    customerAggregates.set(row.customer.id, current);
  }

  const satisfiedClients = Array.from(customerAggregates.values()).filter((aggregate) => {
    if (aggregate.totalReviews === 0) return false;
    const averageServiceScore = aggregate.totalServiceScore / aggregate.totalReviews;
    return Number.isFinite(averageServiceScore) && averageServiceScore >= 4;
  }).length;

  const testimonials = Array.from(customerAggregates.values())
    .filter(
      (aggregate): aggregate is CustomerRatingAggregate & { latestCommentRating: PublicRatingRow } =>
        aggregate.latestCommentRating !== null,
    )
    .sort((left, right) => {
      const leftRating = left.latestCommentRating.rating;
      const rightRating = right.latestCommentRating.rating;

      return (
        rightRating.updatedAt.getTime() - leftRating.updatedAt.getTime() ||
        rightRating.createdAt.getTime() - leftRating.createdAt.getTime() ||
        rightRating.id - leftRating.id
      );
    })
    .slice(0, 6)
    .map((aggregate) => {
      const { rating, user, customer, car } = aggregate.latestCommentRating;
      const averageCarScore = aggregate.totalCarScore / aggregate.totalReviews;
      const averageServiceScore = aggregate.totalServiceScore / aggregate.totalReviews;

      return {
        id: rating.id,
        customerName: user.fullName,
        location: customer.city?.trim() || car.city?.trim() || "Maroc",
        carLabel: `${car.brand} ${car.model}`,
        score: Math.round(averageCarScore * 100) / 100,
        serviceScore: Math.round(averageServiceScore * 100) / 100,
        comment: rating.comment?.trim() || "",
        createdAt: rating.createdAt,
      };
    });

  const averageCarScore = rows.length > 0 ? Math.round((totalCarScore / rows.length) * 100) / 100 : null;
  const averageServiceScore =
    rows.length > 0 ? Math.round((totalServiceScore / rows.length) * 100) / 100 : null;

  return {
    summary: {
      averageCarScore,
      averageServiceScore,
      totalReviews: rows.length,
      satisfiedClients,
    },
    testimonials,
  };
}

router.get("/me/eligible", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
  try {
    const customer = await getCurrentCustomer(req.user!.userId);
    if (!customer) {
      res.status(404).json({ error: "Profil client introuvable" });
      return;
    }

    res.json(await fetchEligibleRatingsForCustomer(customer.id));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/public", async (_req, res) => {
  try {
    res.json(await fetchPublicRatingsOverview());
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
  try {
    const customer = await getCurrentCustomer(req.user!.userId);
    if (!customer) {
      res.status(404).json({ error: "Profil client introuvable" });
      return;
    }

    const rentalRequestId = parseInt(String(req.body.rentalRequestId), 10);
    const score = parseScore(req.body.carScore ?? req.body.score);
    const serviceScore = parseScore(req.body.serviceScore ?? req.body.platformScore ?? req.body.score);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : null;

    if (!Number.isInteger(rentalRequestId)) {
      res.status(400).json({ error: "Reservation invalide" });
      return;
    }

    if (!score || !serviceScore) {
      res.status(400).json({ error: "Les notes doivent etre comprises entre 1 et 5" });
      return;
    }

    const [request] = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(eq(schema.rentalRequestsTable.id, rentalRequestId))
      .limit(1);

    if (!request || request.customerId !== customer.id) {
      res.status(404).json({ error: "Reservation introuvable" });
      return;
    }

    if (
      !COMPLETED_RENTAL_STATUSES.includes(
        request.status as (typeof COMPLETED_RENTAL_STATUSES)[number],
      )
    ) {
      res.status(403).json({ error: "Seuls les clients ayant termine leur location peuvent noter" });
      return;
    }

    const [existing] = await db
      .select()
      .from(schema.carRatingsTable)
      .where(eq(schema.carRatingsTable.rentalRequestId, rentalRequestId))
      .limit(1);

    const [rating] = existing
      ? await db
          .update(schema.carRatingsTable)
          .set({
            score,
            serviceScore,
            comment,
            updatedAt: new Date(),
          })
          .where(eq(schema.carRatingsTable.id, existing.id))
          .returning()
      : await db
          .insert(schema.carRatingsTable)
          .values({
            carId: request.carId,
            customerId: customer.id,
            rentalRequestId,
            score,
            serviceScore,
            comment,
          })
          .returning();

    res.status(existing ? 200 : 201).json(serializeRating(rating));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
