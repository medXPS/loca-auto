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
  paymentDeadlineHours: integer("payment_deadline_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettingsTable).omit({ id: true, updatedAt: true });
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettingsTable.$inferSelect;
