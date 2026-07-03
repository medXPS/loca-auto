import { sql } from "drizzle-orm";
import { companySettingsMigrations } from "@workspace/db/schema";
import { db } from "./db";

let companySettingsSchemaReady: Promise<void> | null = null;

export function ensureCompanySettingsSchema() {
  if (!companySettingsSchemaReady) {
    companySettingsSchemaReady = (async () => {
      for (const statement of companySettingsMigrations) {
        await db.execute(sql.raw(statement));
      }
    })().catch((error) => {
      companySettingsSchemaReady = null;
      throw error;
    });
  }

  return companySettingsSchemaReady;
}
