import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";

export const carMediaTypeEnum = pgEnum("car_media_type", ["IMAGE", "VIDEO", "IMAGE_360"]);
export const carMediaSourceTypeEnum = pgEnum("car_media_source_type", ["URL", "UPLOAD"]);

export const carImagesTable = pgTable("car_images", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  mediaType: carMediaTypeEnum("media_type").notNull().default("IMAGE"),
  sourceType: carMediaSourceTypeEnum("source_type").notNull().default("URL"),
  altText: text("alt_text"),
  isMain: boolean("is_main").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCarImageSchema = createInsertSchema(carImagesTable).omit({ id: true, createdAt: true });
export type InsertCarImage = z.infer<typeof insertCarImageSchema>;
export type CarImage = typeof carImagesTable.$inferSelect;
