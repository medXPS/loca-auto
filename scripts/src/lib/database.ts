import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../../lib/db/src/schema/index.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running scripts");
}

export function createDatabase() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  return { db, pool, schema };
}

export type DatabaseContext = ReturnType<typeof createDatabase>;
