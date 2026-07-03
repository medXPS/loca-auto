import pg from "pg";
import { companySettingsMigrations } from "../../lib/db/src/schema/index.js";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running migrations");
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    for (const statement of companySettingsMigrations) {
      await client.query(statement);
    }

    await client.query(`
      alter type rental_status add value if not exists 'DOCUMENT_SUBMISSION_WINDOW';
      alter type rental_status add value if not exists 'PENDING_CALL_CONFIRMATION';
      alter type rental_status add value if not exists 'EXTENDED_PAYMENT_DEADLINE';
      alter type rental_status add value if not exists 'PAID';
      alter type rental_status add value if not exists 'ACTIVE_RENTAL';
    `);

    await client.query(`
      alter table if exists users
        add column if not exists email_verified_at timestamptz,
        add column if not exists email_verification_code_hash text,
        add column if not exists email_verification_expires_at timestamptz;
    `);

    await client.query(`
      alter table if exists rental_requests
        add column if not exists start_at timestamptz,
        add column if not exists return_at timestamptz,
        add column if not exists document_deadline timestamptz,
        add column if not exists payment_deadline_extended_at timestamptz,
        add column if not exists payment_deadline_extended_by integer references users(id),
        add column if not exists payment_deadline_extension_hours integer;

      alter table if exists car_availability_blocks
        add column if not exists start_at timestamptz,
        add column if not exists end_at timestamptz,
        add column if not exists visual_state text;
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
