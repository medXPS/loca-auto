import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { hashPassword, comparePassword, signToken, authMiddleware } from "../lib/auth";
import { logAudit } from "../lib/audit";

const router = Router();

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
      res.status(409).json({ error: "Un compte avec cet email existe déjà" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(schema.usersTable).values({ fullName, email, phone, passwordHash, role: "CUSTOMER" }).returning();
    await db.insert(schema.customersTable).values({ userId: user.id });
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    await logAudit({ userId: user.id, action: "REGISTER", entityType: "user", entityId: user.id });
    res.status(201).json({ user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
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
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      res.status(403).json({ error: "Compte désactivé" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    await logAudit({ userId: user.id, action: "LOGIN", entityType: "user", entityId: user.id });
    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt }, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "Déconnecté avec succès" });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Utilisateur non trouvé" });
      return;
    }
    res.json({ id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/auth/me
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const [user] = await db.update(schema.usersTable)
      .set({ ...(fullName && { fullName }), ...(phone && { phone }) })
      .where(eq(schema.usersTable.id, req.user!.userId))
      .returning();
    res.json({ id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
