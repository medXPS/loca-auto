import { pgTable, text, serial, integer, timestamp, numeric, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";
import { usersTable } from "./users";

export const expenseTypeEnum = pgEnum("expense_type", [
  "TAXE", "ASSURANCE", "REPARATION", "VIDANGE", "PNEUS",
  "NETTOYAGE", "MAINTENANCE", "VISITE_TECHNIQUE", "PARKING", "AUTRE"
]);

export const carExpensesTable = pgTable("car_expenses", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  type: expenseTypeEnum("type").notNull().default("AUTRE"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description"),
  invoiceFileUrl: text("invoice_file_url"),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCarExpenseSchema = createInsertSchema(carExpensesTable).omit({ id: true, createdAt: true });
export type InsertCarExpense = z.infer<typeof insertCarExpenseSchema>;
export type CarExpense = typeof carExpensesTable.$inferSelect;
