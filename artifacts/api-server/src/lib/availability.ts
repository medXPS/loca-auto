import { and, eq, gte, inArray, lte, lt, sql } from "drizzle-orm";
import { db, schema } from "./db";

const blockingTypes = ["TEMPORARY_HOLD", "RESERVED", "RENTED", "MAINTENANCE"] as const;

export function getDocumentHoldMinutes() {
  return Number(process.env.DOCUMENT_HOLD_MINUTES ?? 30);
}

export function getPaymentDeadlineHours(defaultHours = 24) {
  return Number(process.env.PAYMENT_DEADLINE_HOURS ?? defaultHours);
}

export async function expireStaleAvailabilityLocks() {
  const now = new Date();

  const expiredHolds = await db.select().from(schema.carAvailabilityBlocksTable).where(
    and(
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
      eq(schema.carAvailabilityBlocksTable.type, "TEMPORARY_HOLD"),
      lt(schema.carAvailabilityBlocksTable.expiresAt, now),
    ),
  );

  for (const hold of expiredHolds) {
    await db.update(schema.carAvailabilityBlocksTable)
      .set({ status: "EXPIRED" })
      .where(eq(schema.carAvailabilityBlocksTable.id, hold.id));

    if (hold.rentalRequestId) {
      await db.update(schema.rentalRequestsTable)
        .set({ status: "ABANDONED", abandonedAt: now })
        .where(and(
          eq(schema.rentalRequestsTable.id, hold.rentalRequestId),
          eq(schema.rentalRequestsTable.status, "WAITING_DOCUMENTS"),
        ));
    }
  }
}

export async function hasActiveAvailabilityOverlap(carId: number, startDate: string, endDate: string, ignoreRentalRequestId?: number) {
  await expireStaleAvailabilityLocks();
  const now = new Date();
  const rows = await db.select({ id: schema.carAvailabilityBlocksTable.id })
    .from(schema.carAvailabilityBlocksTable)
    .where(and(
      eq(schema.carAvailabilityBlocksTable.carId, carId),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
      inArray(schema.carAvailabilityBlocksTable.type, blockingTypes),
      lte(schema.carAvailabilityBlocksTable.startDate, endDate),
      gte(schema.carAvailabilityBlocksTable.endDate, startDate),
      sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${now})`,
      ignoreRentalRequestId
        ? sql`(${schema.carAvailabilityBlocksTable.rentalRequestId} IS NULL OR ${schema.carAvailabilityBlocksTable.rentalRequestId} <> ${ignoreRentalRequestId})`
        : sql`true`,
    ))
    .limit(1);
  return rows.length > 0;
}

export async function createTemporaryHold(request: typeof schema.rentalRequestsTable.$inferSelect) {
  const expiresAt = new Date(Date.now() + getDocumentHoldMinutes() * 60 * 1000);
  const [block] = await db.insert(schema.carAvailabilityBlocksTable).values({
    carId: request.carId,
    rentalRequestId: request.id,
    startDate: request.startDate,
    endDate: request.returnDate,
    type: "TEMPORARY_HOLD",
    status: "ACTIVE",
    expiresAt,
    notes: "Client must upload CIN and driving licence before hold expires.",
  }).returning();
  return block;
}

export async function releaseRequestAvailabilityBlocks(rentalRequestId: number, status: "RELEASED" | "EXPIRED" = "RELEASED") {
  await db.update(schema.carAvailabilityBlocksTable)
    .set({ status })
    .where(and(
      eq(schema.carAvailabilityBlocksTable.rentalRequestId, rentalRequestId),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
    ));
}

export async function markRequestReserved(request: typeof schema.rentalRequestsTable.$inferSelect) {
  await db.update(schema.carAvailabilityBlocksTable)
    .set({ status: "RELEASED" })
    .where(and(
      eq(schema.carAvailabilityBlocksTable.rentalRequestId, request.id),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
    ));

  await db.insert(schema.carAvailabilityBlocksTable).values({
    carId: request.carId,
    rentalRequestId: request.id,
    startDate: request.startDate,
    endDate: request.returnDate,
    type: "RESERVED",
    status: "ACTIVE",
  });
}
