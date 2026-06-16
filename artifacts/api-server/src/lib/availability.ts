import { and, eq, gt, gte, inArray, lte, lt, sql } from "drizzle-orm";
import { db, schema } from "./db";

const blockingTypes = ["TEMPORARY_HOLD", "RESERVED", "RENTED", "MAINTENANCE"] as const;

export function getDocumentHoldMinutes() {
  return Number(process.env.DOCUMENT_HOLD_MINUTES ?? 60);
}

export function getPaymentDeadlineHours(defaultHours = 12) {
  const parsed = Number(process.env.PAYMENT_DEADLINE_HOURS ?? defaultHours);
  return Number.isFinite(parsed) && parsed >= defaultHours ? parsed : defaultHours;
}

export function getReturnBufferMinutes() {
  return Number(process.env.RETURN_BUFFER_MINUTES ?? 30);
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function combineDateAndHour(date: string, hour?: string | null) {
  const normalizedHour = hour && /^\d{2}:\d{2}$/.test(hour) ? hour : "09:00";
  return new Date(`${date}T${normalizedHour}:00`);
}

export function getRequestStartAt(request: Pick<typeof schema.rentalRequestsTable.$inferSelect, "startDate" | "startAt">) {
  return request.startAt ?? combineDateAndHour(request.startDate, "09:00");
}

export function getRequestReturnAt(request: Pick<typeof schema.rentalRequestsTable.$inferSelect, "returnDate" | "returnAt">) {
  return request.returnAt ?? combineDateAndHour(request.returnDate, "18:00");
}

export function addReturnBuffer(value: Date) {
  return new Date(value.getTime() + getReturnBufferMinutes() * 60 * 1000);
}

export function getRequestAvailabilityEndAt(request: Pick<typeof schema.rentalRequestsTable.$inferSelect, "returnDate" | "returnAt">) {
  return addReturnBuffer(getRequestReturnAt(request));
}

function getBlockStartAt(block: Pick<typeof schema.carAvailabilityBlocksTable.$inferSelect, "startDate" | "startAt">) {
  return block.startAt ?? combineDateAndHour(block.startDate, "00:00");
}

function getBlockEndAt(block: Pick<typeof schema.carAvailabilityBlocksTable.$inferSelect, "endDate" | "endAt">) {
  return block.endAt ?? combineDateAndHour(block.endDate, "23:59");
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
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
        .set({ status: "ABANDONED", abandonedAt: now, updatedAt: now })
        .where(and(
          eq(schema.rentalRequestsTable.id, hold.rentalRequestId),
          sql`${schema.rentalRequestsTable.status} IN ('DOCUMENT_SUBMISSION_WINDOW', 'WAITING_DOCUMENTS', 'PENDING')`,
        ));
    }
  }

  const expiredPaymentRequests = await db.select().from(schema.rentalRequestsTable).where(
    and(
      sql`${schema.rentalRequestsTable.status} IN ('CALL_CONFIRMED', 'EXTENDED_PAYMENT_DEADLINE', 'WAITING_AGENCY_PAYMENT')`,
      lt(schema.rentalRequestsTable.paymentDeadline, now),
    ),
  );

  for (const request of expiredPaymentRequests) {
    await db.update(schema.rentalRequestsTable)
      .set({ status: "ABANDONED", abandonedAt: now, updatedAt: now })
      .where(eq(schema.rentalRequestsTable.id, request.id));
    await releaseRequestAvailabilityBlocks(request.id, "EXPIRED");
  }
}

export async function hasActiveAvailabilityOverlap(
  carId: number,
  startDate: string,
  endDate: string,
  ignoreRentalRequestId?: number,
  startAt?: Date,
  endAt?: Date,
) {
  await expireStaleAvailabilityLocks();
  const now = new Date();
  const rows = await db.select()
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
    ));

  const requestedStart = startAt ?? combineDateAndHour(startDate, "00:00");
  const requestedEnd = endAt ?? combineDateAndHour(endDate, "23:59");
  return rows.some((row) => rangesOverlap(requestedStart, requestedEnd, getBlockStartAt(row), getBlockEndAt(row)));
}

export async function createTemporaryHold(request: typeof schema.rentalRequestsTable.$inferSelect) {
  const expiresAt = new Date(Date.now() + getDocumentHoldMinutes() * 60 * 1000);
  const startAt = getRequestStartAt(request);
  const endAt = getRequestAvailabilityEndAt(request);
  await db.update(schema.rentalRequestsTable)
    .set({ documentDeadline: expiresAt, updatedAt: new Date() })
    .where(eq(schema.rentalRequestsTable.id, request.id));

  const [block] = await db.insert(schema.carAvailabilityBlocksTable).values({
    carId: request.carId,
    rentalRequestId: request.id,
    startDate: request.startDate,
    endDate: toDateOnly(endAt),
    startAt,
    endAt,
    type: "TEMPORARY_HOLD",
    status: "ACTIVE",
    visualState: "DOCUMENT_SUBMISSION_WINDOW",
    expiresAt,
    notes: "Client must upload CIN or passport and driving licence before hold expires.",
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

  const startAt = getRequestStartAt(request);
  const endAt = getRequestAvailabilityEndAt(request);

  await db.insert(schema.carAvailabilityBlocksTable).values({
    carId: request.carId,
    rentalRequestId: request.id,
    startDate: request.startDate,
    endDate: toDateOnly(endAt),
    startAt,
    endAt,
    type: "RENTED",
    status: "ACTIVE",
    visualState: "ACTIVE_RENTAL",
  });
}

export async function markRequestPendingCallConfirmation(request: typeof schema.rentalRequestsTable.$inferSelect) {
  await db.update(schema.carAvailabilityBlocksTable)
    .set({
      type: "RESERVED",
      visualState: "PENDING_CALL_CONFIRMATION",
      expiresAt: null,
      notes: "Documents received. Waiting for agency call confirmation.",
    })
    .where(and(
      eq(schema.carAvailabilityBlocksTable.rentalRequestId, request.id),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
    ));
}

export async function markRequestCallConfirmed(request: typeof schema.rentalRequestsTable.$inferSelect, extended = false) {
  await db.update(schema.carAvailabilityBlocksTable)
    .set({
      type: "RESERVED",
      visualState: extended ? "EXTENDED_PAYMENT_DEADLINE" : "CALL_CONFIRMED",
      expiresAt: request.paymentDeadline ?? null,
      notes: extended ? "Payment deadline extended by admin or agent." : "Call confirmed. Waiting for agency payment.",
    })
    .where(and(
      eq(schema.carAvailabilityBlocksTable.rentalRequestId, request.id),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
    ));
}
