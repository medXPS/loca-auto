import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carBrandsTable = pgTable("car_brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarBrandSchema = createInsertSchema(carBrandsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarBrand = z.infer<typeof insertCarBrandSchema>;
export type CarBrand = typeof carBrandsTable.$inferSelect;
