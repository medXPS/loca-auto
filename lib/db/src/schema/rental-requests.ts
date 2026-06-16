import { pgTable, text, serial, integer, timestamp, numeric, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { carsTable } from "./cars";
import { customersTable } from "./customers";

export const rentalStatusEnum = pgEnum("rental_status", [
  "PENDING", "UNDER_REVIEW", "CALL_ATTEMPTED", "CALL_CONFIRMED",
  "WAITING_AGENCY_PAYMENT", "RESERVED", "REJECTED", "WAITING_DOCUMENTS",
  "CAR_DELIVERED", "CAR_RETURNED", "CANCELLED", "ABANDONED", "COMPLETED",
  "DOCUMENT_SUBMISSION_WINDOW", "PENDING_CALL_CONFIRMATION",
  "EXTENDED_PAYMENT_DEADLINE", "PAID", "ACTIVE_RENTAL"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID", "WAITING_AGENCY_PAYMENT", "PAID_AT_AGENCY", "CANCELLED", "REFUNDED"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH_AT_AGENCY", "CARD_AT_AGENCY", "BANK_TRANSFER"
]);

export const rentalRequestsTable = pgTable("rental_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customersTable.id),
  carId: integer("car_id").notNull().references(() => carsTable.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  cinOrPassport: text("cin_or_passport"),
  drivingLicenseNumber: text("driving_license_number"),
  startDate: date("start_date", { mode: "string" }).notNull(),
  returnDate: date("return_date", { mode: "string" }).notNull(),
  startAt: timestamp("start_at", { withTimezone: true }),
  returnAt: timestamp("return_at", { withTimezone: true }),
  pickupLocation: text("pickup_location"),
  returnLocation: text("return_location"),
  estimatedTotalPrice: numeric("estimated_total_price", { precision: 10, scale: 2 }).notNull(),
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: rentalStatusEnum("status").notNull().default("PENDING"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("CASH_AT_AGENCY"),
  documentDeadline: timestamp("document_deadline", { withTimezone: true }),
  paymentDeadline: timestamp("payment_deadline", { withTimezone: true }),
  paymentDeadlineExtendedAt: timestamp("payment_deadline_extended_at", { withTimezone: true }),
  paymentDeadlineExtendedBy: integer("payment_deadline_extended_by").references(() => usersTable.id),
  paymentDeadlineExtensionHours: integer("payment_deadline_extension_hours"),
  callConfirmedAt: timestamp("call_confirmed_at", { withTimezone: true }),
  callConfirmedBy: integer("call_confirmed_by").references(() => usersTable.id),
  paidAtAgencyAt: timestamp("paid_at_agency_at", { withTimezone: true }),
  paymentConfirmedBy: integer("payment_confirmed_by").references(() => usersTable.id),
  abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRentalRequestSchema = createInsertSchema(rentalRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRentalRequest = z.infer<typeof insertRentalRequestSchema>;
export type RentalRequest = typeof rentalRequestsTable.$inferSelect;
