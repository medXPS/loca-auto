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

export const companySettingsMigrations = [
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS brand_name text DEFAULT 'Location Auto Maroc'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS slogan text DEFAULT 'Louez votre voiture facilement au Maroc'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS logo_url text",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS phone text DEFAULT '+212600000000'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '+212600000000'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS email text DEFAULT 'contact@locationauto.ma'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS address text DEFAULT 'Casablanca, Maroc'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS city text DEFAULT 'Casablanca'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS facebook text",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS instagram text",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#B45309'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#0F172A'",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS tax_rate_percent integer NOT NULL DEFAULT 0",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_1_min_days integer NOT NULL DEFAULT 7",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_1_percent integer NOT NULL DEFAULT 10",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_2_min_days integer NOT NULL DEFAULT 30",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_2_percent integer NOT NULL DEFAULT 30",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_3_min_days integer NOT NULL DEFAULT 60",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS discount_tier_3_percent integer NOT NULL DEFAULT 40",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS payment_deadline_hours integer NOT NULL DEFAULT 24",
  "ALTER TABLE IF EXISTS company_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()",
] as const;

export const insertCompanySettingsSchema = createInsertSchema(companySettingsTable).omit({ id: true, updatedAt: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettingsTable.$inferSelect;
