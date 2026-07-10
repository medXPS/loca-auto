import { Router } from "express";
import { eq, ilike, and, desc, sql, or, inArray } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import {
  ALGOLIA_BLOG_INDEX,
  buildBlogSearchRecord,
  deleteAlgoliaRecord,
  searchAlgoliaObjectIds,
  upsertAlgoliaRecord,
} from "../lib/algolia";

const router = Router();
const blogPostsTable = schema.blogPostsTable;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildExcerpt(excerpt: unknown, content: unknown) {
  if (typeof excerpt === "string" && excerpt.trim()) return excerpt.trim();
  if (typeof content === "string" && content.trim()) {
    const text = stripHtml(content);
    return text.length > 220 ? `${text.slice(0, 217)}...` : text;
  }
  return "";
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean).join(", ");
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function normalizePostPayload(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? slugify(body.slug)
      : slugify(title);
  const excerpt = buildExcerpt(body.excerpt, body.content);
  const seoTitle =
    typeof body.seoTitle === "string" && body.seoTitle.trim()
      ? body.seoTitle.trim()
      : title;
  const seoDescription =
    typeof body.seoDescription === "string" && body.seoDescription.trim()
      ? body.seoDescription.trim()
      : excerpt;
  const ogTitle =
    typeof body.ogTitle === "string" && body.ogTitle.trim()
      ? body.ogTitle.trim()
      : seoTitle;
  const ogDescription =
    typeof body.ogDescription === "string" && body.ogDescription.trim()
      ? body.ogDescription.trim()
      : seoDescription;

  return {
    title,
    slug,
    excerpt,
    content: typeof body.content === "string" ? body.content : "",
    coverImage:
      typeof body.coverImage === "string" && body.coverImage.trim()
        ? body.coverImage.trim()
        : null,
    category:
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Conseils",
    tags: normalizeTags(body.tags),
    seoTitle,
    seoDescription,
    ogTitle,
    ogDescription,
    ogImage:
      typeof body.ogImage === "string" && body.ogImage.trim()
        ? body.ogImage.trim()
        : typeof body.coverImage === "string" && body.coverImage.trim()
          ? body.coverImage.trim()
          : null,
    status:
      body.status === "ARCHIVED" || body.status === "PUBLISHED"
        ? body.status
        : "DRAFT",
  };
}

function normalizePost(post: any) {
  return {
    ...post,
    tags: post.tags ?? "",
    category: post.category ?? "Conseils",
    coverImage: post.coverImage ?? null,
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt ?? "",
    ogTitle: post.ogTitle ?? post.seoTitle ?? post.title,
    ogDescription: post.ogDescription ?? post.seoDescription ?? post.excerpt ?? "",
    ogImage: post.ogImage ?? post.coverImage ?? null,
  };
}

async function syncBlogSearchIndex(post: typeof schema.blogPostsTable.$inferSelect) {
  await upsertAlgoliaRecord(ALGOLIA_BLOG_INDEX, buildBlogSearchRecord(post));
}

async function removeBlogSearchIndex(postId: number) {
  await deleteAlgoliaRecord(ALGOLIA_BLOG_INDEX, String(postId));
}

async function loadBlogSearchRecords() {
  const posts = await db.select().from(blogPostsTable);
  return posts.map((post) => buildBlogSearchRecord(post));
}

// GET /api/blog
router.get("/", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      category,
      tag,
      search,
    } = req.query as Record<string, string>;
    const normalizedSearch = search?.trim() || "";
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const filters = [eq(schema.blogPostsTable.status, "PUBLISHED")];
    if (category) {
      filters.push(ilike(blogPostsTable.category, `%${category}%`));
    }
    if (tag) {
      filters.push(ilike(blogPostsTable.tags, `%${tag}%`));
    }
    if (normalizedSearch) {
      const searchBlogIds = await searchAlgoliaObjectIds(
        ALGOLIA_BLOG_INDEX,
        normalizedSearch,
        loadBlogSearchRecords,
      );
      if (searchBlogIds && searchBlogIds.length > 0) {
        filters.push(inArray(blogPostsTable.id, searchBlogIds));
      } else {
        const searchCondition = or(
            ilike(blogPostsTable.title, `%${normalizedSearch}%`),
            ilike(blogPostsTable.slug, `%${normalizedSearch}%`),
            ilike(blogPostsTable.excerpt, `%${normalizedSearch}%`),
            ilike(blogPostsTable.category, `%${normalizedSearch}%`),
            ilike(blogPostsTable.tags, `%${normalizedSearch}%`),
            ilike(blogPostsTable.content, `%${normalizedSearch}%`),
        );
        if (searchCondition) {
          filters.push(searchCondition);
        }
      }
    }

    const where = filters.length > 0 ? and(...filters) : undefined;
    const whereClause = where ?? sql`true`;
    const totalQuery = db
      .select({ total: sql<number>`count(*)::int` })
      .from(blogPostsTable)
      .where(whereClause);
    const [{ total }] = await totalQuery;
    const postsQuery = db.select().from(blogPostsTable).where(whereClause);
    const posts = await postsQuery
      .orderBy(desc(schema.blogPostsTable.createdAt))
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);
    res.json({ posts: posts.map(normalizePost), total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/blog/manage
router.get(
  "/manage",
  authMiddleware,
  requireRole("ADMIN", "AGENT"),
  async (req, res) => {
    try {
      const { page = "1", limit = "50", status, category, search } =
        req.query as Record<string, string>;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const filters: any[] = [];

      if (status) filters.push(eq(schema.blogPostsTable.status, status as any));
      if (category) filters.push(ilike(blogPostsTable.category, `%${category}%`));
      const normalizedSearch = search?.trim() || "";
      if (normalizedSearch) {
        const searchBlogIds = await searchAlgoliaObjectIds(
          ALGOLIA_BLOG_INDEX,
          normalizedSearch,
          loadBlogSearchRecords,
        );
        if (searchBlogIds && searchBlogIds.length > 0) {
          filters.push(inArray(blogPostsTable.id, searchBlogIds));
        } else {
          const pattern = `%${normalizedSearch}%`;
          const searchCondition = or(
              ilike(blogPostsTable.title, pattern),
              ilike(blogPostsTable.slug, pattern),
              ilike(blogPostsTable.excerpt, pattern),
              ilike(blogPostsTable.tags, pattern),
              ilike(blogPostsTable.content, pattern),
          );
          if (searchCondition) {
            filters.push(searchCondition);
          }
        }
      }

      const where = filters.length > 0 ? and(...filters) : undefined;
      const whereClause = where ?? sql`true`;
      const totalQuery = db
        .select({ total: sql<number>`count(*)::int` })
        .from(blogPostsTable)
        .where(whereClause);
      const [{ total }] = await totalQuery;
      const postsQuery = db.select().from(blogPostsTable).where(whereClause);
      const posts = await postsQuery
        .orderBy(desc(schema.blogPostsTable.createdAt))
        .limit(limitNum)
        .offset((pageNum - 1) * limitNum);

      res.json({ posts: posts.map(normalizePost), total, page: pageNum, limit: limitNum });
    } catch (err) {
      req.log.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// POST /api/blog
router.post("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const payload = normalizePostPayload(req.body ?? {});
    const [post] = await db.insert(schema.blogPostsTable).values(payload as any).returning();
    await syncBlogSearchIndex(post).catch((error) => {
      req.log.warn({ err: error, postId: post.id }, "Algolia blog sync failed");
    });
    res.status(201).json(normalizePost(post));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/blog/:slug
router.get("/:slug", async (req, res) => {
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, req.params.slug))
      .limit(1);
    if (!post) {
      res.status(404).json({ error: "Article non trouvé" });
      return;
    }
    if (post.status !== "PUBLISHED") {
      res.status(404).json({ error: "Article non trouvé" });
      return;
    }
    res.json(normalizePost(post));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/blog/:id/edit
router.patch("/:id/edit", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const payload = normalizePostPayload(req.body ?? {});
    const [post] = await db
      .update(blogPostsTable)
      .set(payload as any)
      .where(eq(blogPostsTable.id, parseInt(String(req.params.id), 10)))
      .returning();
    if (!post) {
      res.status(404).json({ error: "Article non trouvé" });
      return;
    }
    await syncBlogSearchIndex(post).catch((error) => {
      req.log.warn({ err: error, postId: post.id }, "Algolia blog sync failed");
    });
    res.json(normalizePost(post));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/blog/:id/edit
router.delete("/:id/edit", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const postId = parseInt(String(req.params.id), 10);
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, postId));
    await removeBlogSearchIndex(postId).catch((error) => {
      req.log.warn({ err: error, postId }, "Algolia blog delete sync failed");
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
