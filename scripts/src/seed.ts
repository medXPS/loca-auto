import { sql } from "drizzle-orm";
import { createDatabase } from "./lib/database.js";
import { ensureSuperAdmin, getDefaultSuperAdmin } from "./lib/super-admin.js";

const { db, pool, schema } = createDatabase();

function shouldResetDatabase() {
  const requestedReset = process.env.SEED_RESET === "true" || process.env.SEED_MODE === "reset";

  if (!requestedReset) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("Ignoring SEED_RESET in production to avoid deleting live data.");
    return false;
  }

  return true;
}

async function resetDatabase() {
  await db.execute(sql`
    truncate table
      ${schema.carAvailabilityBlocksTable},
      ${schema.carImagesTable},
      ${schema.carExpensesTable},
      ${schema.blogPostsTable},
      ${schema.notificationsTable},
      ${schema.auditLogsTable},
      ${schema.documentsTable},
      ${schema.companySettingsTable},
      ${schema.rentalRequestsTable},
      ${schema.carsTable},
      ${schema.agentsTable},
      ${schema.customersTable},
      ${schema.usersTable}
    restart identity cascade;
  `);
}

async function seed() {
  const shouldReset = shouldResetDatabase();

  try {
    if (shouldReset) {
      console.log("Resetting database to admin-only state...");
      await resetDatabase();
    } else {
      console.log("Seeding database without deleting existing data...");
    }

    const admin = await ensureSuperAdmin({ db, schema }, getDefaultSuperAdmin());

    if (shouldReset) {
      console.log("Done. Only the admin account remains.");
    } else {
      console.log("Done. Existing data was preserved.");
    }
    console.log(`Super admin ready: ${admin.email}`);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
