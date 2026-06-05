import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { rentalRequestsTable } from "./rental-requests";
import { customersTable } from "./customers";

export const documentStatusEnum = pgEnum("document_status", ["PENDING", "APPROVED", "REJECTED"]);
export const documentTypeEnum = pgEnum("document_type", ["CIN", "PASSPORT", "PERMIS_CONDUIRE", "AUTRE"]);

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customersTable.id, { onDelete: "cascade" }),
  rentalRequestId: integer("rental_request_id").references(() => rentalRequestsTable.id),
  type: documentTypeEnum("type").notNull().default("AUTRE"),
  fileUrl: text("file_url").notNull(),
  status: documentStatusEnum("status").notNull().default("PENDING"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, uploadedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
