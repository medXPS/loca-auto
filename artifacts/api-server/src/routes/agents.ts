import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole, hashPassword } from "../lib/auth";
import { logAudit } from "../lib/audit";

const router = Router();

function formatAgent(agent: typeof schema.agentsTable.$inferSelect, user: typeof schema.usersTable.$inferSelect) {
  return {
    ...agent,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt },
  };
}

// GET /api/agents
router.get("/", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const rows = await db.select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(schema.usersTable, eq(schema.agentsTable.userId, schema.usersTable.id));
    res.json(rows.map(({ agent, user }) => formatAgent(agent, user!)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/agents
router.post("/", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(schema.usersTable).values({ fullName, email, phone, passwordHash, role: "AGENT" }).returning();
    const [agent] = await db.insert(schema.agentsTable).values({ userId: user.id, createdBy: req.user!.userId }).returning();
    await logAudit({ userId: req.user!.userId, action: "CREATE_AGENT", entityType: "agent", entityId: agent.id });
    res.status(201).json(formatAgent(agent, user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/agents/:id
router.get("/:id", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const [row] = await db.select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(schema.usersTable, eq(schema.agentsTable.userId, schema.usersTable.id))
      .where(eq(schema.agentsTable.id, parseInt(req.params.id)))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Agent non trouvé" }); return; }
    res.json(formatAgent(row.agent, row.user!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/agents/:id
router.patch("/:id", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { fullName, phone, status } = req.body;
    const [agent] = await db.select().from(schema.agentsTable).where(eq(schema.agentsTable.id, parseInt(req.params.id))).limit(1);
    if (!agent) { res.status(404).json({ error: "Agent non trouvé" }); return; }
    if (fullName || phone) {
      await db.update(schema.usersTable).set({ ...(fullName && { fullName }), ...(phone && { phone }) }).where(eq(schema.usersTable.id, agent.userId));
    }
    if (status) {
      await db.update(schema.agentsTable).set({ status }).where(eq(schema.agentsTable.id, agent.id));
    }
    const [row] = await db.select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable).leftJoin(schema.usersTable, eq(schema.agentsTable.userId, schema.usersTable.id))
      .where(eq(schema.agentsTable.id, agent.id)).limit(1);
    res.json(formatAgent(row!.agent, row!.user!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/agents/:id
router.delete("/:id", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    await db.delete(schema.agentsTable).where(eq(schema.agentsTable.id, parseInt(req.params.id)));
    await logAudit({ userId: req.user!.userId, action: "DELETE_AGENT", entityType: "agent", entityId: parseInt(req.params.id) });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
