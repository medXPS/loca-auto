import { Router } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";
import { logAudit } from "../lib/audit";

const router = Router();

// GET /api/expenses
router.get("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { carId, type, from, to, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const conditions = [];
    if (carId) conditions.push(eq(schema.carExpensesTable.carId, parseInt(carId)));
    if (type) conditions.push(eq(schema.carExpensesTable.type, type as any));
    if (from) conditions.push(gte(schema.carExpensesTable.date, from));
    if (to) conditions.push(lte(schema.carExpensesTable.date, to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ total, totalAmount }] = await db.select({
      total: sql<number>`count(*)::int`,
      totalAmount: sql<number>`COALESCE(SUM(amount::numeric), 0)::float`,
    }).from(schema.carExpensesTable).where(where);

    const expenses = await db.select().from(schema.carExpensesTable).where(where)
      .orderBy(desc(schema.carExpensesTable.date)).limit(limitNum).offset((pageNum - 1) * limitNum);

    res.json({
      expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
      total,
      totalAmount,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/expenses
router.post("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { carId, type, amount, date, description, invoiceFileUrl } = req.body;
    const [expense] = await db.insert(schema.carExpensesTable).values({
      carId, type, amount: String(amount), date, description, invoiceFileUrl, createdBy: req.user!.userId,
    }).returning();
    await logAudit({ userId: req.user!.userId, action: "CREATE_EXPENSE", entityType: "expense", entityId: expense.id });
    res.status(201).json({ ...expense, amount: Number(expense.amount) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  try {
    await db.delete(schema.carExpensesTable).where(eq(schema.carExpensesTable.id, parseInt(String(req.params.id), 10)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
