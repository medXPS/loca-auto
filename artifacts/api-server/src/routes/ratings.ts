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

async function getCurrentCustomer(userId: number) {
  const [customer] = await db
    .select()
    .from(schema.customersTable)
    .where(eq(schema.customersTable.userId, userId))
    .limit(1);
  return customer ?? null;
}

router.get("/me/eligible", authMiddleware, requireRole("CUSTOMER"), async (req, res) => {
  try {
    const customer = await getCurrentCustomer(req.user!.userId);
    if (!customer) {
      res.status(404).json({ error: "Profil client introuvable" });
      return;
    }

    const requests = await db
      .select()
      .from(schema.rentalRequestsTable)
      .where(eq(schema.rentalRequestsTable.customerId, customer.id))
      .orderBy(desc(schema.rentalRequestsTable.createdAt));

    const completedRequests = requests.filter((request) =>
      COMPLETED_RENTAL_STATUSES.includes(request.status as (typeof COMPLETED_RENTAL_STATUSES)[number]),
    );

    const carIds = [...new Set(completedRequests.map((request) => request.carId))];
    const requestIds = completedRequests.map((request) => request.id);

    const cars = carIds.length > 0
      ? await db.select().from(schema.carsTable).where(inArray(schema.carsTable.id, carIds))
      : [];
    const ratings = requestIds.length > 0
      ? await db.select().from(schema.carRatingsTable).where(inArray(schema.carRatingsTable.rentalRequestId, requestIds))
      : [];

    const carsById = new Map(cars.map((car) => [car.id, car]));
    const ratingsByRequestId = new Map(ratings.map((rating) => [rating.rentalRequestId, rating]));

    res.json(completedRequests.map((request) => ({
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
      existingRating: ratingsByRequestId.get(request.id) ?? null,
    })));
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
    const score = Number(req.body.score);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : null;

    if (!Number.isInteger(rentalRequestId)) {
      res.status(400).json({ error: "Reservation invalide" });
      return;
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      res.status(400).json({ error: "La note doit etre comprise entre 1 et 5" });
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

    if (!COMPLETED_RENTAL_STATUSES.includes(request.status as (typeof COMPLETED_RENTAL_STATUSES)[number])) {
      res.status(403).json({ error: "Seuls les clients ayant termine leur location peuvent noter" });
      return;
    }

    const [existing] = await db
      .select()
      .from(schema.carRatingsTable)
      .where(eq(schema.carRatingsTable.rentalRequestId, rentalRequestId))
      .limit(1);

    const [rating] = existing
      ? await db.update(schema.carRatingsTable).set({
          score,
          comment,
          updatedAt: new Date(),
        }).where(eq(schema.carRatingsTable.id, existing.id)).returning()
      : await db.insert(schema.carRatingsTable).values({
          carId: request.carId,
          customerId: customer.id,
          rentalRequestId,
          score,
          comment,
        }).returning();

    res.status(existing ? 200 : 201).json(rating);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
