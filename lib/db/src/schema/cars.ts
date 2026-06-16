import { pgTable, text, serial, integer, timestamp, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { agenciesTable } from "./agencies";
import { carBrandsTable } from "./car-brands";

export const carStatusEnum = pgEnum("car_status", [
  "ACTIVE", "INACTIVE", "AVAILABLE", "TEMPORARILY_HELD", "RESERVED", "RENTED", "MAINTENANCE"
]);
export const fuelTypeEnum = pgEnum("fuel_type", ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL"]);
export const transmissionEnum = pgEnum("transmission", ["MANUELLE", "AUTOMATIQUE"]);
export const carCategoryEnum = pgEnum("car_category", [
  "CITADINE", "BERLINE", "SUV", "MONOSPACE", "UTILITAIRE", "LUXE", "SPORT", "4X4"
]);

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  brandId: integer("brand_id").references(() => carBrandsTable.id, { onDelete: "set null" }),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  category: carCategoryEnum("category").notNull().default("BERLINE"),
  fuelType: fuelTypeEnum("fuel_type").notNull().default("ESSENCE"),
  transmission: transmissionEnum("transmission").notNull().default("MANUELLE"),
  seats: integer("seats").notNull().default(5),
  doors: integer("doors").notNull().default(4),
  airConditioning: boolean("air_conditioning").notNull().default(true),
  dailyPrice: numeric("daily_price", { precision: 10, scale: 2 }).notNull(),
  weeklyPrice: numeric("weekly_price", { precision: 10, scale: 2 }),
  monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  mileageLimit: integer("mileage_limit"),
  city: text("city").notNull().default("Casablanca"),
  agencyId: integer("agency_id").references(() => agenciesTable.id, { onDelete: "set null" }),
  internalReference: text("internal_reference"),
  licensePlate: text("license_plate"),
  description: text("description"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoSlug: text("seo_slug"),
  insuranceIncluded: boolean("insurance_included").notNull().default(false),
  requiredDocuments: text("required_documents"),
  status: carStatusEnum("status").notNull().default("AVAILABLE"),
  mainImageUrl: text("main_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarSchema = createInsertSchema(carsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof carsTable.$inferSelect;
