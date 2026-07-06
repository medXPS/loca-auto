import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";

const STAFF_ROLES = ["ADMIN", "AGENT"] as const;
const ACTIVE_OPERATION_STATUSES = [
  "RESERVED",
  "PAID",
  "CAR_DELIVERED",
  "RENTED",
  "ACTIVE_RENTAL",
] as const;
const DEPARTURE_STATUSES = [
  "CALL_CONFIRMED",
  "WAITING_AGENCY_PAYMENT",
  "RESERVED",
  "PAID",
] as const;
const DOCUMENT_STATUSES = [
  "DOCUMENT_SUBMISSION_WINDOW",
  "WAITING_DOCUMENTS",
  "PENDING_CALL_CONFIRMATION",
] as const;
const PAYMENT_STATUSES = [
  "CALL_CONFIRMED",
  "WAITING_AGENCY_PAYMENT",
  "EXTENDED_PAYMENT_DEADLINE",
] as const;
const CUSTOMER_PAYMENT_REMINDER_HOURS = 4;

type OperationalMode = "return" | "departure" | "payment" | "documents";

type OperationalRequest = {
  id: number;
  fullName: string;
  status: string;
  startDate: string;
  returnDate: string;
  startAt: Date | null;
  returnAt: Date | null;
  paymentDeadline: Date | null;
  documentDeadline: Date | null;
  pickupLocation: string | null;
  returnLocation: string | null;
  brand: string | null;
  model: string | null;
};

function startOfLocalDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(date: string | Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatShortTime(date: string | Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function formatRequestLabel(request: OperationalRequest) {
  const carLabel = [request.brand, request.model].filter(Boolean).join(" ").trim() || "Vehicule";
  return `#${request.id} ${carLabel} - ${request.fullName}`;
}

function formatOperationalSummary(
  requests: OperationalRequest[],
  mode: OperationalMode,
) {
  const lines = requests.slice(0, 3).map((request) => {
    const parts = [formatRequestLabel(request)];

    if (mode === "return") {
      const date = formatShortDate(request.returnAt ?? request.returnDate);
      const time = formatShortTime(request.returnAt);
      parts.push(`retour${date ? ` ${date}` : ""}${time ? ` ${time}` : ""}`);
      if (request.returnLocation) parts.push(request.returnLocation);
    } else if (mode === "departure") {
      const date = formatShortDate(request.startAt ?? request.startDate);
      const time = formatShortTime(request.startAt);
      parts.push(`depart${date ? ` ${date}` : ""}${time ? ` ${time}` : ""}`);
      if (request.pickupLocation) parts.push(request.pickupLocation);
    } else if (mode === "payment") {
      const date = formatShortDate(request.paymentDeadline);
      const time = formatShortTime(request.paymentDeadline);
      parts.push(`paiement${date ? ` avant ${date}` : ""}${time ? ` ${time}` : ""}`);
    } else if (mode === "documents") {
      const date = formatShortDate(request.documentDeadline);
      const time = formatShortTime(request.documentDeadline);
      parts.push(`documents${date ? ` avant ${date}` : ""}${time ? ` ${time}` : ""}`);
    }

    return parts.join(" - ");
  });

  const remaining = requests.length - lines.length;
  return `${lines.join(" | ")}${remaining > 0 ? ` | +${remaining} autres` : ""}`;
}

async function upsertNotification(userId: number, title: string, message: string) {
  const today = startOfLocalDay();
  const [existing] = await db
    .select({
      id: schema.notificationsTable.id,
      message: schema.notificationsTable.message,
    })
    .from(schema.notificationsTable)
    .where(
      and(
        eq(schema.notificationsTable.userId, userId),
        eq(schema.notificationsTable.title, title),
        gte(schema.notificationsTable.createdAt, today),
      ),
    )
    .orderBy(desc(schema.notificationsTable.createdAt))
    .limit(1);

  if (existing) {
    if (existing.message !== message) {
      await db
        .update(schema.notificationsTable)
        .set({ message, read: false })
        .where(eq(schema.notificationsTable.id, existing.id));
    }
    return;
  }

  await db.insert(schema.notificationsTable).values({
    userId,
    title,
    message,
  });
}

async function notifyStaff(title: string, message: string) {
  const staffUsers = await db
    .select({ id: schema.usersTable.id })
    .from(schema.usersTable)
    .where(
      and(
        inArray(schema.usersTable.role, STAFF_ROLES),
        eq(schema.usersTable.status, "ACTIVE"),
      ),
    );

  await Promise.all(
    staffUsers.map(async ({ id }) => {
      try {
        await upsertNotification(id, title, message);
      } catch {
        // Non-critical, never block business flows.
      }
    }),
  );
}

async function loadOperationalRequests(): Promise<OperationalRequest[]> {
  const rows = await db
    .select({
      id: schema.rentalRequestsTable.id,
      fullName: schema.rentalRequestsTable.fullName,
      status: schema.rentalRequestsTable.status,
      startDate: schema.rentalRequestsTable.startDate,
      returnDate: schema.rentalRequestsTable.returnDate,
      startAt: schema.rentalRequestsTable.startAt,
      returnAt: schema.rentalRequestsTable.returnAt,
      paymentDeadline: schema.rentalRequestsTable.paymentDeadline,
      documentDeadline: schema.rentalRequestsTable.documentDeadline,
      pickupLocation: schema.rentalRequestsTable.pickupLocation,
      returnLocation: schema.rentalRequestsTable.returnLocation,
      brand: schema.carsTable.brand,
      model: schema.carsTable.model,
    })
    .from(schema.rentalRequestsTable)
    .leftJoin(
      schema.carsTable,
      eq(schema.rentalRequestsTable.carId, schema.carsTable.id),
    )
    .where(
      sql.raw(
        "status NOT IN ('CANCELLED', 'ABANDONED', 'REJECTED', 'RETURNED', 'CAR_RETURNED', 'COMPLETED')",
      ),
    )
    .orderBy(
      asc(schema.rentalRequestsTable.returnDate),
      asc(schema.rentalRequestsTable.startDate),
      asc(schema.rentalRequestsTable.id),
    );

  return rows;
}

async function loadCustomerOperationalRequests(
  customerUserId: number,
): Promise<OperationalRequest[]> {
  const rows = await db
    .select({
      id: schema.rentalRequestsTable.id,
      fullName: schema.rentalRequestsTable.fullName,
      status: schema.rentalRequestsTable.status,
      startDate: schema.rentalRequestsTable.startDate,
      returnDate: schema.rentalRequestsTable.returnDate,
      startAt: schema.rentalRequestsTable.startAt,
      returnAt: schema.rentalRequestsTable.returnAt,
      paymentDeadline: schema.rentalRequestsTable.paymentDeadline,
      documentDeadline: schema.rentalRequestsTable.documentDeadline,
      pickupLocation: schema.rentalRequestsTable.pickupLocation,
      returnLocation: schema.rentalRequestsTable.returnLocation,
      brand: schema.carsTable.brand,
      model: schema.carsTable.model,
    })
    .from(schema.rentalRequestsTable)
    .innerJoin(
      schema.customersTable,
      eq(schema.rentalRequestsTable.customerId, schema.customersTable.id),
    )
    .leftJoin(
      schema.carsTable,
      eq(schema.rentalRequestsTable.carId, schema.carsTable.id),
    )
    .where(eq(schema.customersTable.userId, customerUserId))
    .orderBy(
      asc(schema.rentalRequestsTable.returnDate),
      asc(schema.rentalRequestsTable.startDate),
      asc(schema.rentalRequestsTable.id),
    );

  return rows;
}

function isInStatusSet(status: string, statuses: readonly string[]) {
  return statuses.includes(status);
}

function sortByDateKey(
  a: OperationalRequest,
  b: OperationalRequest,
  key: "startAt" | "returnAt" | "paymentDeadline" | "documentDeadline",
) {
  const aDate = a[key]?.getTime() ?? 0;
  const bDate = b[key]?.getTime() ?? 0;
  return aDate - bDate;
}

export async function createNotification(opts: {
  userId: number;
  title: string;
  message: string;
}): Promise<void> {
  try {
    await upsertNotification(opts.userId, opts.title, opts.message);
  } catch {
    // Non-critical, don't throw.
  }
}

export async function syncCustomerNotifications(
  customerUserId: number,
): Promise<void> {
  try {
    const now = new Date();
    const tomorrow = localDateKey(addDays(now, 1));
    const paymentCutoff = new Date(
      now.getTime() + CUSTOMER_PAYMENT_REMINDER_HOURS * 60 * 60 * 1000,
    );

    const requests = await loadCustomerOperationalRequests(customerUserId);

    const returnsSoon = requests
      .filter((request) => isInStatusSet(request.status, ACTIVE_OPERATION_STATUSES))
      .filter((request) => request.returnDate === tomorrow)
      .sort((a, b) => sortByDateKey(a, b, "returnAt"));

    const paymentsSoon = requests
      .filter((request) => isInStatusSet(request.status, PAYMENT_STATUSES))
      .filter(
        (request) =>
          !!request.paymentDeadline &&
          request.paymentDeadline >= now &&
          request.paymentDeadline <= paymentCutoff,
      )
      .sort((a, b) => sortByDateKey(a, b, "paymentDeadline"));

    await Promise.all([
      ...returnsSoon.map((request) => {
        const carLabel = [request.brand, request.model].filter(Boolean).join(" ").trim() || "véhicule";
        const returnTime = formatShortTime(request.returnAt);

        return upsertNotification(
          customerUserId,
          `Retour demain - Demande #${request.id}`,
          `Votre ${carLabel} doit être restitué demain${returnTime ? ` à ${returnTime}` : ""}.`,
        );
      }),
      ...paymentsSoon.map((request) => {
        const carLabel = [request.brand, request.model].filter(Boolean).join(" ").trim() || "véhicule";
        const deadlineDate = formatShortDate(request.paymentDeadline);
        const deadlineTime = formatShortTime(request.paymentDeadline);

        return upsertNotification(
          customerUserId,
          `Paiement à l'agence - 4h restantes - Demande #${request.id}`,
          `Il vous reste 4h pour régler ${carLabel} à l'agence${deadlineDate ? ` avant le ${deadlineDate}` : ""}${deadlineTime ? ` à ${deadlineTime}` : ""}.`,
        );
      }),
    ]);
  } catch {
    // Never block customer reads if the sync fails.
  }
}

export async function syncOperationalNotifications(): Promise<void> {
  try {
    const now = new Date();
    const today = localDateKey(now);
    const tomorrow = localDateKey(addDays(now, 1));
    const paymentCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const requests = await loadOperationalRequests();

    const returnsLate = requests
      .filter((request) => isInStatusSet(request.status, ACTIVE_OPERATION_STATUSES))
      .filter((request) => request.returnDate < today)
      .sort((a, b) => sortByDateKey(a, b, "returnAt"));

    const returnsToday = requests
      .filter((request) => isInStatusSet(request.status, ACTIVE_OPERATION_STATUSES))
      .filter((request) => request.returnDate === today)
      .sort((a, b) => sortByDateKey(a, b, "returnAt"));

    const departuresSoon = requests
      .filter((request) => isInStatusSet(request.status, DEPARTURE_STATUSES))
      .filter(
        (request) => request.startDate === today || request.startDate === tomorrow,
      )
      .sort((a, b) => sortByDateKey(a, b, "startAt"));

    const paymentsLate = requests
      .filter((request) => isInStatusSet(request.status, PAYMENT_STATUSES))
      .filter((request) => !!request.paymentDeadline && request.paymentDeadline < now)
      .sort((a, b) => sortByDateKey(a, b, "paymentDeadline"));

    const paymentsSoon = requests
      .filter((request) => isInStatusSet(request.status, PAYMENT_STATUSES))
      .filter(
        (request) =>
          !!request.paymentDeadline &&
          request.paymentDeadline >= now &&
          request.paymentDeadline <= paymentCutoff,
      )
      .sort((a, b) => sortByDateKey(a, b, "paymentDeadline"));

    const documentsLate = requests
      .filter((request) => isInStatusSet(request.status, DOCUMENT_STATUSES))
      .filter((request) => !!request.documentDeadline && request.documentDeadline < now)
      .sort((a, b) => sortByDateKey(a, b, "documentDeadline"));

    const documentsSoon = requests
      .filter((request) => isInStatusSet(request.status, DOCUMENT_STATUSES))
      .filter(
        (request) =>
          !!request.documentDeadline &&
          request.documentDeadline >= now &&
          request.documentDeadline <= paymentCutoff,
      )
      .sort((a, b) => sortByDateKey(a, b, "documentDeadline"));

    if (returnsLate.length > 0) {
      await notifyStaff(
        "Retards de retour",
        formatOperationalSummary(returnsLate, "return"),
      );
    }

    if (returnsToday.length > 0) {
      await notifyStaff(
        "Retours du jour",
        formatOperationalSummary(returnsToday, "return"),
      );
    }

    if (departuresSoon.length > 0) {
      await notifyStaff(
        "Departs a preparer",
        formatOperationalSummary(departuresSoon, "departure"),
      );
    }

    if (paymentsLate.length > 0) {
      await notifyStaff(
        "Paiements en retard",
        formatOperationalSummary(paymentsLate, "payment"),
      );
    }

    if (paymentsSoon.length > 0) {
      await notifyStaff(
        "Paiements a encaisser",
        formatOperationalSummary(paymentsSoon, "payment"),
      );
    }

    if (documentsLate.length > 0) {
      await notifyStaff(
        "Documents en retard",
        formatOperationalSummary(documentsLate, "documents"),
      );
    }

    if (documentsSoon.length > 0) {
      await notifyStaff(
        "Documents a finaliser",
        formatOperationalSummary(documentsSoon, "documents"),
      );
    }
  } catch {
    // Never block notification reads if the sync fails.
  }
}
