import { db, schema } from "./db";

export async function logAudit(opts: {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
}): Promise<void> {
  try {
    await db.insert(schema.auditLogsTable).values(opts);
  } catch {
    // Non-critical — don't throw
  }
}
