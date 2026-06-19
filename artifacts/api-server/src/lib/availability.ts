import { and, asc, eq, gte, inArray, lte, lt, sql } from "drizzle-orm";
import { db, schema } from "./db";

const blockingTypes = ["TEMPORARY_HOLD", "RESERVED", "RENTED", "MAINTENANCE"] as const;
const documentHoldMinutes = 30;
const paymentDeadlineHours = 24;
const returnBufferMinutes = 60;

export function getDocumentHoldMinutes() {
  const parsed = Number(process.env.DOCUMENT_HOLD_MINUTES ?? documentHoldMinutes);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : documentHoldMinutes;
}

export function getPaymentDeadlineHours(defaultHours = paymentDeadlineHours) {
  const parsed = Number(process.env.PAYMENT_DEADLINE_HOURS ?? defaultHours);
  return Number.isFinite(parsed) && parsed >= paymentDeadlineHours ? parsed : paymentDeadlineHours;
}

export function getReturnBufferMinutes() {
  const parsed = Number(process.env.RETURN_BUFFER_MINUTES ?? returnBufferMinutes);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : returnBufferMinutes;
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function addIsoDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
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

  await db.update(schema.carAvailabilityBlocksTable)
    .set({ status: "COMPLETED", updatedAt: now })
    .where(and(
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
      inArray(schema.carAvailabilityBlocksTable.type, blockingTypes),
      sql`coalesce(${schema.carAvailabilityBlocksTable.endAt}, (${schema.carAvailabilityBlocksTable.endDate}::text || 'T23:59:00')::timestamptz) < ${now}`,
    ));
}

export interface CarAvailabilitySummary {
  hasActiveBlock: boolean;
  isAvailableNow: boolean;
  availableFrom: string | null;
  blockedUntil: string | null;
  blockStartDate: string | null;
  blockType: string | null;
  visualState: string | null;
}

export async function getCarsAvailabilitySummaries(carIds: number[]) {
  const uniqueCarIds = [...new Set(carIds)].filter((id) => Number.isInteger(id));
  const emptySummary: CarAvailabilitySummary = {
    hasActiveBlock: false,
    isAvailableNow: true,
    availableFrom: null,
    blockedUntil: null,
    blockStartDate: null,
    blockType: null,
    visualState: null,
  };

  if (uniqueCarIds.length === 0) {
    return new Map<number, CarAvailabilitySummary>();
  }

  const now = new Date();
  const rows = await db
    .select()
    .from(schema.carAvailabilityBlocksTable)
    .where(and(
      inArray(schema.carAvailabilityBlocksTable.carId, uniqueCarIds),
      eq(schema.carAvailabilityBlocksTable.status, "ACTIVE"),
      inArray(schema.carAvailabilityBlocksTable.type, blockingTypes),
      sql`coalesce(${schema.carAvailabilityBlocksTable.endAt}, (${schema.carAvailabilityBlocksTable.endDate}::text || 'T23:59:00')::timestamptz) >= ${now}`,
      sql`(${schema.carAvailabilityBlocksTable.expiresAt} IS NULL OR ${schema.carAvailabilityBlocksTable.expiresAt} > ${now})`,
    ))
    .orderBy(asc(schema.carAvailabilityBlocksTable.startDate), asc(schema.carAvailabilityBlocksTable.endDate));

  type AvailabilityBlockRow = (typeof rows)[number];
  const blocksByCarId = new Map<number, AvailabilityBlockRow[]>();
  for (const row of rows) {
    const existing = blocksByCarId.get(row.carId) ?? [];
    existing.push(row);
    blocksByCarId.set(row.carId, existing);
  }

  const summaries = new Map<number, CarAvailabilitySummary>();
  for (const carId of uniqueCarIds) {
    const block = blocksByCarId.get(carId)?.reduce<AvailabilityBlockRow | undefined>((current, candidate) => {
      if (!current) return candidate;

      const currentEnd = new Date(current.endAt ?? `${current.endDate}T23:59:59Z`).getTime();
      const candidateEnd = new Date(candidate.endAt ?? `${candidate.endDate}T23:59:59Z`).getTime();

      if (candidateEnd > currentEnd) return candidate;
      if (candidateEnd < currentEnd) return current;

      const currentStart = new Date(current.startAt ?? `${current.startDate}T00:00:00Z`).getTime();
      const candidateStart = new Date(candidate.startAt ?? `${candidate.startDate}T00:00:00Z`).getTime();
      return candidateStart > currentStart ? candidate : current;
    }, undefined);
    if (!block) {
      summaries.set(carId, { ...emptySummary });
      continue;
    }

    summaries.set(carId, {
      hasActiveBlock: true,
      isAvailableNow: false,
      availableFrom: block.endAt?.toISOString() ?? combineDateAndHour(block.endDate, "23:59").toISOString(),
      blockedUntil: block.endDate,
      blockStartDate: block.startDate,
      blockType: block.type,
      visualState: block.visualState,
    });
  }

  return summaries;
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
