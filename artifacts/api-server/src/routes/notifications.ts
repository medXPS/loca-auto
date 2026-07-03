import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware } from "../lib/auth";
import { syncOperationalNotifications } from "../lib/notify";

const router = Router();

// GET /api/notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role === "ADMIN" || req.user?.role === "AGENT") {
      await syncOperationalNotifications();
    }

    const notifications = await db
      .select()
      .from(schema.notificationsTable)
      .where(eq(schema.notificationsTable.userId, req.user!.userId))
      .orderBy(desc(schema.notificationsTable.createdAt));
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const [notification] = await db.update(schema.notificationsTable)
      .set({ read: true })
      .where(and(eq(schema.notificationsTable.id, parseInt(String(req.params.id), 10)), eq(schema.notificationsTable.userId, req.user!.userId)))
      .returning();
    if (!notification) { res.status(404).json({ error: "Notification non trouvée" }); return; }
    res.json(notification);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    await db.update(schema.notificationsTable).set({ read: true }).where(eq(schema.notificationsTable.userId, req.user!.userId));
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
