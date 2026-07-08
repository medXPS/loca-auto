import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";
import { customersTable } from "./customers";
import { rentalRequestsTable } from "./rental-requests";

export const carRatingsTable = pgTable("car_ratings", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  rentalRequestId: integer("rental_request_id").notNull().references(() => rentalRequestsTable.id, { onDelete: "cascade" }).unique(),
  score: integer("score").notNull(),
  serviceScore: integer("service_score"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarRatingSchema = createInsertSchema(carRatingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarRating = z.infer<typeof insertCarRatingSchema>;
export type CarRating = typeof carRatingsTable.$inferSelect;
