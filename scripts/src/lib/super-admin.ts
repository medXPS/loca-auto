import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { DatabaseContext } from "./database.js";

export interface SuperAdminCredentials {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  mfaEnabled: boolean;
}

export function getDefaultSuperAdmin(): SuperAdminCredentials {
  return {
    fullName: process.env.SUPER_ADMIN_FULL_NAME ?? "Super Admin Demo",
    email: process.env.SUPER_ADMIN_EMAIL ?? "admin@demo.com",
    password: process.env.SUPER_ADMIN_PASSWORD ?? "demo-admin@$",
    phone: process.env.SUPER_ADMIN_PHONE ?? "+212600000000",
    mfaEnabled: process.env.SUPER_ADMIN_MFA_ENABLED === "true",
  };
}

export async function ensureSuperAdmin(
  context: Pick<DatabaseContext, "db" | "schema">,
  credentials: SuperAdminCredentials,
) {
  const passwordHash = await bcrypt.hash(credentials.password, 10);
  const verifiedAt = new Date();

  const [user] = await context.db.insert(context.schema.usersTable).values({
    fullName: credentials.fullName,
    email: credentials.email,
    phone: credentials.phone,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
    emailVerifiedAt: verifiedAt,
    emailVerificationCodeHash: null,
    emailVerificationExpiresAt: null,
    mfaEnabled: credentials.mfaEnabled,
    mfaCodeHash: null,
    mfaCodeExpiresAt: null,
  }).onConflictDoUpdate({
    target: context.schema.usersTable.email,
    set: {
      fullName: credentials.fullName,
      phone: credentials.phone,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: verifiedAt,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      mfaEnabled: credentials.mfaEnabled,
      mfaCodeHash: null,
      mfaCodeExpiresAt: null,
    },
  }).returning();

  return user;
}
