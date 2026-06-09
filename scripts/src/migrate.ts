import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running migrations");
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query(`
      alter table if exists users
        add column if not exists email_verified_at timestamptz,
        add column if not exists email_verification_code_hash text,
        add column if not exists email_verification_expires_at timestamptz;
    `);

    const tableCheck = await client.query(`
      select to_regclass('public.users') as users_table;
    `);

    if (!tableCheck.rows[0]?.users_table) {
      console.log("Users table does not exist yet; skipping legacy backfill.");
      return;
    }

    const backfill = await client.query(`
      update users
      set email_verified_at = coalesce(email_verified_at, now())
      where email_verified_at is null
    `);

    console.log(
      `Migration complete. Backfilled ${backfill.rowCount ?? 0} legacy users.`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
