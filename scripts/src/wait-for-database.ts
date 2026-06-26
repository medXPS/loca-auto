import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before waiting for the database");
}

const maxAttempts = Number(process.env.DATABASE_WAIT_MAX_ATTEMPTS ?? "90");
const delayMs = Number(process.env.DATABASE_WAIT_DELAY_MS ?? "2000");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let client;
      try {
        client = await pool.connect();
        await client.query("select 1");
        console.log(`Database is ready after ${attempt} attempt(s).`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(
          `Waiting for database (${attempt}/${maxAttempts}): ${message}`,
        );

        if (attempt >= maxAttempts) {
          throw error;
        }

        await sleep(delayMs);
      } finally {
        client?.release();
      }
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Database wait failed:", error);
  process.exit(1);
});
