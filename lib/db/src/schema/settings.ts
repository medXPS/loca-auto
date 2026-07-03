import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companySettingsTable = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").default("Location Auto Maroc"),
  slogan: text("slogan").default("Louez votre voiture facilement au Maroc"),
  logoUrl: text("logo_url"),
  phone: text("phone").default("+212600000000"),
  whatsapp: text("whatsapp").default("+212600000000"),
  email: text("email").default("contact@locationauto.ma"),
  address: text("address").default("Casablanca, Maroc"),
  city: text("city").default("Casablanca"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  primaryColor: text("primary_color").default("#B45309"),
  secondaryColor: text("secondary_color").default("#0F172A"),
  taxRatePercent: integer("tax_rate_percent").notNull().default(0),
  discountTier1MinDays: integer("discount_tier_1_min_days").notNull().default(7),
  discountTier1Percent: integer("discount_tier_1_percent").notNull().default(10),
  discountTier2MinDays: integer("discount_tier_2_min_days").notNull().default(30),
  discountTier2Percent: integer("discount_tier_2_percent").notNull().default(30),
  discountTier3MinDays: integer("discount_tier_3_min_days").notNull().default(60),
  discountTier3Percent: integer("discount_tier_3_percent").notNull().default(40),
  paymentDeadlineHours: integer("payment_deadline_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettingsTable).omit({ id: true, updatedAt: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettingsTable.$inferSelect;
