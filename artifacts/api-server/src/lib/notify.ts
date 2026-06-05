import { db, schema } from "./db";

export async function createNotification(opts: {
  userId: number;
  title: string;
  message: string;
}): Promise<void> {
  try {
    await db.insert(schema.notificationsTable).values(opts);
  } catch {
    // Non-critical — don't throw
  }
}
