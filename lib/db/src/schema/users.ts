import { boolean, pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "AGENT", "CUSTOMER"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE", "SUSPENDED"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  status: userStatusEnum("status").notNull().default("ACTIVE"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  emailVerificationCodeHash: text("email_verification_code_hash"),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at", { withTimezone: true }),
  mfaEnabled: boolean("mfa_enabled").notNull().default(true),
  mfaCodeHash: text("mfa_code_hash"),
  mfaCodeExpiresAt: timestamp("mfa_code_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
