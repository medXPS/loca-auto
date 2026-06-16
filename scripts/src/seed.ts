import { sql } from "drizzle-orm";
import { createDatabase } from "./lib/database.js";
import { ensureSuperAdmin, getDefaultSuperAdmin } from "./lib/super-admin.js";

const { db, pool, schema } = createDatabase();

async function seed() {
  console.log("Resetting database to admin-only state...");

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

  await ensureSuperAdmin({ db, schema }, getDefaultSuperAdmin());
  console.log("Done. Only the admin account remains.");
  console.log("Admin: admin@demo.com / demo-admin@$");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
