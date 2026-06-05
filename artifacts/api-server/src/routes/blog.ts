import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();

// GET /api/blog
router.get("/", async (req, res) => {
  try {
    const { page = "1", limit = "10" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.blogPostsTable).where(eq(schema.blogPostsTable.status, "PUBLISHED"));
    const posts = await db.select().from(schema.blogPostsTable).where(eq(schema.blogPostsTable.status, "PUBLISHED")).orderBy(desc(schema.blogPostsTable.createdAt)).limit(limitNum).offset((pageNum - 1) * limitNum);
    res.json({ posts, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/blog
router.post("/", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const [post] = await db.insert(schema.blogPostsTable).values(req.body).returning();
    res.status(201).json(post);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/blog/:slug
router.get("/:slug", async (req, res) => {
  try {
    const [post] = await db.select().from(schema.blogPostsTable).where(eq(schema.blogPostsTable.slug, req.params.slug)).limit(1);
    if (!post) { res.status(404).json({ error: "Article non trouvé" }); return; }
    res.json(post);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/blog/:id/edit
router.patch("/:id/edit", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const [post] = await db.update(schema.blogPostsTable).set(req.body).where(eq(schema.blogPostsTable.id, parseInt(req.params.id))).returning();
    if (!post) { res.status(404).json({ error: "Article non trouvé" }); return; }
    res.json(post);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/blog/:id/edit
router.delete("/:id/edit", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    await db.delete(schema.blogPostsTable).where(eq(schema.blogPostsTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
