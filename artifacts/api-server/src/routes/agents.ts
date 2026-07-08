import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole, hashPassword } from "../lib/auth";
import { logAudit } from "../lib/audit";
import {
  isDatabaseUnavailableError,
  isUniqueViolationError,
} from "../lib/db-errors";

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
    createdAt: user.createdAt,
  };
}

function formatAgent(
  agent: typeof schema.agentsTable.$inferSelect,
  user: typeof schema.usersTable.$inferSelect,
) {
  return {
    ...agent,
    user: publicUser(user),
  };
}

// GET /api/agents
router.get("/", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const rows = await db
      .select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(
        schema.usersTable,
        eq(schema.agentsTable.userId, schema.usersTable.id),
      );
    res.json(rows.map(({ agent, user }) => formatAgent(agent, user!)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/agents
router.post("/", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password || !phone) {
      res.status(400).json({ error: "Tous les champs sont requis" });
      return;
    }

    const [existingUser] = await db
      .select({ id: schema.usersTable.id })
      .from(schema.usersTable)
      .where(eq(schema.usersTable.email, email))
      .limit(1);
    if (existingUser) {
      res.status(409).json({ error: "Un compte avec cet email existe deja" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const { user, agent } = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(schema.usersTable)
        .values({
          fullName,
          email,
          phone,
          passwordHash,
          role: "AGENT",
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        })
        .returning();
      if (!createdUser) {
        throw new Error("Impossible de creer l'utilisateur agent");
      }

      const [createdAgent] = await tx
        .insert(schema.agentsTable)
        .values({ userId: createdUser.id, createdBy: req.user!.userId })
        .returning();
      if (!createdAgent) {
        throw new Error("Impossible de creer l'agent");
      }

      return { user: createdUser, agent: createdAgent };
    });
    await logAudit(req, {
      userId: req.user!.userId,
      action: "CREATE_AGENT",
      entityType: "agent",
      entityId: agent.id,
    });
    res.status(201).json(formatAgent(agent, user));
  } catch (err) {
    if (isUniqueViolationError(err)) {
      res.status(409).json({ error: "Un compte avec cet email existe deja" });
      return;
    }

    if (isDatabaseUnavailableError(err)) {
      req.log.warn(err, "Database unavailable while creating agent");
      res.status(503).json({ error: "Service temporairement indisponible" });
      return;
    }

    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/agents/:id
router.get("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const [row] = await db
      .select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(
        schema.usersTable,
        eq(schema.agentsTable.userId, schema.usersTable.id),
      )
      .where(eq(schema.agentsTable.id, parseInt(String(req.params.id), 10)))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Agent non trouve" });
      return;
    }
    res.json(formatAgent(row.agent, row.user!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/agents/:id
router.patch("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    const { fullName, phone, status } = req.body;
    const agentId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(agentId)) {
      res.status(400).json({ error: "Identifiant agent invalide" });
      return;
    }

    if (status && !["ACTIVE", "INACTIVE"].includes(String(status))) {
      res.status(400).json({ error: "Statut agent invalide" });
      return;
    }

    const [existingRow] = await db
      .select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(
        schema.usersTable,
        eq(schema.agentsTable.userId, schema.usersTable.id),
      )
      .where(eq(schema.agentsTable.id, agentId))
      .limit(1);
    if (!existingRow || !existingRow.user) {
      res.status(404).json({ error: "Agent non trouve" });
      return;
    }

    const currentUser = existingRow.user;
    const currentAgent = existingRow.agent;

    await db.transaction(async (tx) => {
      if (fullName || phone || status) {
        await tx
          .update(schema.usersTable)
          .set({
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(status && { status }),
          })
          .where(eq(schema.usersTable.id, currentUser.id));
      }

      if (status) {
        await tx
          .update(schema.agentsTable)
          .set({ status })
          .where(eq(schema.agentsTable.id, currentAgent.id));
      }
    });

    const [updatedRow] = await db
      .select({ agent: schema.agentsTable, user: schema.usersTable })
      .from(schema.agentsTable)
      .leftJoin(
        schema.usersTable,
        eq(schema.agentsTable.userId, schema.usersTable.id),
      )
      .where(eq(schema.agentsTable.id, agentId))
      .limit(1);
    if (!updatedRow || !updatedRow.user) {
      res.status(404).json({ error: "Agent non trouve" });
      return;
    }
    await logAudit(req, {
      userId: req.user!.userId,
      action: "UPDATE_AGENT",
      entityType: "agent",
      entityId: agentId,
    });
    res.json(formatAgent(updatedRow.agent, updatedRow.user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/agents/:id
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const agentId = parseInt(String(req.params.id), 10);
      if (Number.isNaN(agentId)) {
        res.status(400).json({ error: "Identifiant agent invalide" });
        return;
      }

      const [row] = await db
        .select({ agent: schema.agentsTable, user: schema.usersTable })
        .from(schema.agentsTable)
        .leftJoin(
          schema.usersTable,
          eq(schema.agentsTable.userId, schema.usersTable.id),
        )
        .where(eq(schema.agentsTable.id, agentId))
        .limit(1);

      if (!row) {
        res.status(404).json({ error: "Agent non trouve" });
        return;
      }

      await db.transaction(async (tx) => {
        if (row.user) {
          await tx
            .update(schema.usersTable)
            .set({ status: "INACTIVE" })
            .where(eq(schema.usersTable.id, row.user.id));
        }

        await tx
          .delete(schema.agentsTable)
          .where(eq(schema.agentsTable.id, row.agent.id));
      });
      await logAudit(req, {
        userId: req.user!.userId,
        action: "DELETE_AGENT",
        entityType: "agent",
        entityId: agentId,
      });
      res.status(204).send();
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

export default router;
