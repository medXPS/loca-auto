import { createDatabase } from "./lib/database.js";
import { ensureSuperAdmin, getDefaultSuperAdmin } from "./lib/super-admin.js";

async function main() {
  const { db, pool, schema } = createDatabase();

  try {
    const admin = await ensureSuperAdmin(
      { db, schema },
      getDefaultSuperAdmin(),
    );

    console.log(
      `Super admin ready: ${admin.email} (MFA disabled: ${admin.mfaEnabled === false})`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Super admin bootstrap failed:", error);
  process.exit(1);
});
