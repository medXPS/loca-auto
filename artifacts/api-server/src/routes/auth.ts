import { Router } from "express";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db, schema } from "../lib/db";
import {
  authMiddleware,
  comparePassword,
  hashPassword,
  signMfaToken,
  signToken,
  verifyToken,
} from "../lib/auth";
import { logAudit } from "../lib/audit";
import { sendMfaCode, sendVerificationCode } from "../lib/mailer";

const router = Router();

function publicUser(user: typeof schema.usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt,
  };
}

function generateSecurityCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function storeVerificationCode(userId: number, email: string) {
  const code = generateSecurityCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.update(schema.usersTable)
    .set({
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
    })
    .where(eq(schema.usersTable.id, userId));

  await sendVerificationCode(email, code);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
      res.status(400).json({ error: "Tous les champs sont requis" });
      return;
    }

    const existing = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Un compte avec cet email existe deja" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(schema.usersTable).values({
      fullName,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
      status: "ACTIVE",
    }).returning();

    await db.insert(schema.customersTable).values({ userId: user.id });
    await storeVerificationCode(user.id, user.email);
    await logAudit({ userId: user.id, action: "REGISTER", entityType: "user", entityId: user.id });

    res.status(201).json({
      message: "Un code de verification a ete envoye a votre adresse email.",
      verificationRequired: true,
      email: user.email,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email requis" });
      return;
    }

    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, email)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }

    if (user.emailVerifiedAt) {
      res.status(400).json({ error: "Ce compte est deja verifie" });
      return;
    }

    await storeVerificationCode(user.id, user.email);
    res.json({ message: "Un nouveau code de verification a ete envoye." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email et code requis" });
      return;
    }

    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, email)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }

    if (user.emailVerifiedAt) {
      const token = signToken({ userId: user.id, role: user.role, email: user.email, purpose: "auth" });
      res.json({ user: publicUser(user), token });
      return;
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      res.status(401).json({ error: "Le code de verification a expire" });
      return;
    }

    const valid = await comparePassword(String(code), user.emailVerificationCodeHash);
    if (!valid) {
      res.status(401).json({ error: "Code de verification incorrect" });
      return;
    }

    const [updated] = await db.update(schema.usersTable)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
      })
      .where(eq(schema.usersTable.id, user.id))
      .returning();

    const token = signToken({ userId: updated.id, role: updated.role, email: updated.email, purpose: "auth" });
    await logAudit({ userId: updated.id, action: "EMAIL_VERIFIED", entityType: "user", entityId: updated.id });
    res.json({ user: publicUser(updated), token });
  } catch (err) {
    req.log.error(err);
    res.status(401).json({ error: "Code de verification invalide" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }

    if (!user.emailVerifiedAt) {
      res.status(403).json({ error: "Veuillez verifier votre adresse e-mail avant de vous connecter" });
      return;
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      res.status(403).json({ error: "Compte desactive" });
      return;
    }

    const mfaEnabled = process.env.MFA_ENABLED !== "false" && user.mfaEnabled;
    if (mfaEnabled) {
      const code = generateSecurityCode();
      const mfaCodeHash = await hashPassword(code);
      const mfaCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await db.update(schema.usersTable)
        .set({ mfaCodeHash, mfaCodeExpiresAt })
        .where(eq(schema.usersTable.id, user.id));
      await sendMfaCode(user.email, code);
      await logAudit({ userId: user.id, action: "MFA_CODE_SENT", entityType: "user", entityId: user.id });
      res.json({
        mfaRequired: true,
        mfaToken: signMfaToken({ userId: user.id, role: user.role, email: user.email }),
        user: publicUser(user),
      });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email, purpose: "auth" });
    await logAudit({ userId: user.id, action: "LOGIN", entityType: "user", entityId: user.id });
    res.json({ user: publicUser(user), token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/verify-mfa
router.post("/verify-mfa", async (req, res) => {
  try {
    const { mfaToken, code } = req.body;
    if (!mfaToken || !code) {
      res.status(400).json({ error: "Code MFA requis" });
      return;
    }

    const payload = verifyToken(mfaToken);
    if (payload.purpose !== "mfa") {
      res.status(401).json({ error: "Session MFA invalide" });
      return;
    }

    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, payload.userId)).limit(1);
    if (!user?.mfaCodeHash || !user.mfaCodeExpiresAt || user.mfaCodeExpiresAt.getTime() < Date.now()) {
      res.status(401).json({ error: "Code MFA expire" });
      return;
    }

    const valid = await comparePassword(String(code), user.mfaCodeHash);
    if (!valid) {
      res.status(401).json({ error: "Code MFA incorrect" });
      return;
    }

    await db.update(schema.usersTable)
      .set({ mfaCodeHash: null, mfaCodeExpiresAt: null })
      .where(eq(schema.usersTable.id, user.id));

    const token = signToken({ userId: user.id, role: user.role, email: user.email, purpose: "auth" });
    await logAudit({ userId: user.id, action: "LOGIN_MFA", entityType: "user", entityId: user.id });
    res.json({ user: publicUser(user), token });
  } catch (err) {
    req.log.error(err);
    res.status(401).json({ error: "Code MFA invalide" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.json({ message: "Deconnecte avec succes" });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }
    res.json(publicUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/auth/me
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { fullName, phone, mfaEnabled } = req.body;
    const [currentUser] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, req.user!.userId)).limit(1);
    if (!currentUser) {
      res.status(404).json({ error: "Utilisateur non trouve" });
      return;
    }

    const updates: Partial<typeof schema.usersTable.$inferInsert> = {};
    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;
    if (typeof mfaEnabled === "boolean") updates.mfaEnabled = mfaEnabled;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Aucune modification fournie" });
      return;
    }

    const [user] = await db.update(schema.usersTable)
      .set(updates)
      .where(eq(schema.usersTable.id, req.user!.userId))
      .returning();

    if (typeof mfaEnabled === "boolean" && mfaEnabled !== currentUser.mfaEnabled) {
      await logAudit({
        userId: user.id,
        action: mfaEnabled ? "MFA_ENABLED" : "MFA_DISABLED",
        entityType: "user",
        entityId: user.id,
      });
    }

    res.json(publicUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
