import { pgTable, serial, integer, timestamp, text, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";
import { rentalRequestsTable } from "./rental-requests";

export const availabilityBlockTypeEnum = pgEnum("availability_block_type", [
  "TEMPORARY_HOLD", "RESERVED", "RENTED", "MAINTENANCE"
]);
export const availabilityBlockStatusEnum = pgEnum("availability_block_status", [
  "ACTIVE", "EXPIRED", "RELEASED", "COMPLETED"
]);

export const carAvailabilityBlocksTable = pgTable("car_availability_blocks", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  rentalRequestId: integer("rental_request_id").references(() => rentalRequestsTable.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  type: availabilityBlockTypeEnum("type").notNull(),
  status: availabilityBlockStatusEnum("status").notNull().default("ACTIVE"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarAvailabilityBlockSchema = createInsertSchema(carAvailabilityBlocksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarAvailabilityBlock = z.infer<typeof insertCarAvailabilityBlockSchema>;
export type CarAvailabilityBlock = typeof carAvailabilityBlocksTable.$inferSelect;
