import { Router } from "express";
import { eq, sql, desc, and, gte, lte, lt } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    // Revenue: sum of finalPrice for COMPLETED requests
    const [revenueRow] = await db.select({ total: sql<number>`COALESCE(SUM(final_price::numeric), 0)::float` })
      .from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.status, "COMPLETED"));

    // Expected: sum for RESERVED + CAR_DELIVERED
    const [expectedRow] = await db.select({ total: sql<number>`COALESCE(SUM(COALESCE(final_price, estimated_total_price)::numeric), 0)::float` })
      .from(schema.rentalRequestsTable)
      .where(sql`status IN ('RESERVED', 'CAR_DELIVERED')`);

    // Pending revenue: WAITING_AGENCY_PAYMENT
    const [pendingRow] = await db.select({ total: sql<number>`COALESCE(SUM(COALESCE(final_price, estimated_total_price)::numeric), 0)::float` })
      .from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.status, "WAITING_AGENCY_PAYMENT"));

    // Expenses
    const [expensesRow] = await db.select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)::float` })
      .from(schema.carExpensesTable);

    // Request counts
    const [totalRequests] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable);
    const [pendingRequests] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.status, "PENDING"));
    const [callConfirmed] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(sql`status IN ('WAITING_AGENCY_PAYMENT')`);
    const [abandoned] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.status, "ABANDONED"));
    const [activeRentals] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.rentalRequestsTable).where(sql`status IN ('CAR_DELIVERED')`);

    // Car counts
    const [availableCars] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.carsTable).where(eq(schema.carsTable.status, "AVAILABLE"));
    const [temporarilyCars] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.carsTable).where(eq(schema.carsTable.status, "TEMPORARILY_HELD"));
    const [reservedCars] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.carsTable).where(eq(schema.carsTable.status, "RESERVED"));
    const [rentedCars] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.carsTable).where(eq(schema.carsTable.status, "RENTED"));
    const [maintenanceCars] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.carsTable).where(eq(schema.carsTable.status, "MAINTENANCE"));

    // People
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.customersTable);
    const [totalAgents] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.agentsTable);

    const totalRevenue = revenueRow.total;
    const totalExpenses = expensesRow.total;

    res.json({
      totalRevenue,
      expectedRevenue: expectedRow.total,
      pendingRevenue: pendingRow.total,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalRequests: totalRequests.count,
      pendingRequests: pendingRequests.count,
      callConfirmedRequests: callConfirmed.count,
      abandonedRequests: abandoned.count,
      activeRentals: activeRentals.count,
      availableCars: availableCars.count,
      temporarilyHeldCars: temporarilyCars.count,
      reservedCars: reservedCars.count,
      rentedCars: rentedCars.count,
      maintenanceCars: maintenanceCars.count,
      totalCustomers: totalCustomers.count,
      totalAgents: totalAgents.count,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/revenue-chart
router.get("/revenue-chart", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const months = parseInt((req.query.months as string) ?? "12");
    const rows = await db.execute(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '${sql.raw(String(months - 1))} months'),
          date_trunc('month', NOW()),
          INTERVAL '1 month'
        ) AS month
      )
      SELECT
        to_char(m.month, 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN rr.status = 'COMPLETED' THEN rr.final_price::numeric ELSE 0 END), 0)::float AS revenue,
        COALESCE(SUM(DISTINCT ce.total_expenses), 0)::float AS expenses
      FROM months m
      LEFT JOIN rental_requests rr ON date_trunc('month', rr.created_at) = m.month
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(amount::numeric), 0) AS total_expenses
        FROM car_expenses
        WHERE date_trunc('month', date::date) = m.month
      ) ce ON true
      GROUP BY m.month
      ORDER BY m.month ASC
    `);

    const data = (rows.rows as any[]).map(row => ({
      month: row.month,
      revenue: Number(row.revenue),
      expenses: Number(row.expenses),
      profit: Number(row.revenue) - Number(row.expenses),
    }));
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/car-performance
router.get("/car-performance", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        c.id AS "carId",
        c.brand,
        c.model,
        c.main_image_url AS "mainImageUrl",
        COALESCE(SUM(CASE WHEN rr.status = 'COMPLETED' THEN rr.final_price::numeric ELSE 0 END), 0)::float AS revenue,
        COALESCE((SELECT SUM(amount::numeric) FROM car_expenses WHERE car_id = c.id), 0)::float AS expenses,
        COUNT(rr.id)::int AS rentals
      FROM cars c
      LEFT JOIN rental_requests rr ON rr.car_id = c.id
      GROUP BY c.id
      ORDER BY revenue DESC
    `);
    const data = (rows.rows as any[]).map(row => ({
      ...row,
      profit: row.revenue - row.expenses,
    }));
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/requests-by-status
router.get("/requests-by-status", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT status, count(*)::int AS count
      FROM rental_requests
      GROUP BY status
    `);
    const LABELS: Record<string, string> = {
      PENDING: "En attente", UNDER_REVIEW: "En vérification", CALL_ATTEMPTED: "Appel effectué",
      CALL_CONFIRMED: "Appel confirmé", WAITING_AGENCY_PAYMENT: "En attente paiement",
      RESERVED: "Réservée", REJECTED: "Refusée", WAITING_DOCUMENTS: "Documents demandés",
      CAR_DELIVERED: "Voiture livrée", CAR_RETURNED: "Voiture retournée",
      CANCELLED: "Annulée", ABANDONED: "Abandonnée", COMPLETED: "Terminée",
    };
    const data = (rows.rows as any[]).map(row => ({ status: row.status, label: LABELS[row.status] ?? row.status, count: row.count }));
    res.json(data);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/recent-requests
router.get("/recent-requests", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "10");
    const requests = await db.select().from(schema.rentalRequestsTable).orderBy(desc(schema.rentalRequestsTable.createdAt)).limit(limit);
    const carIds = [...new Set(requests.map(r => r.carId))];
    const cars = carIds.length > 0
      ? await db.select().from(schema.carsTable).where(sql`${schema.carsTable.id} = ANY(ARRAY[${sql.join(carIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      : [];
    const carsMap = Object.fromEntries(cars.map(c => [c.id, c]));
    const result = requests.map(r => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
      car: carsMap[r.carId] ? { ...carsMap[r.carId], dailyPrice: Number(carsMap[r.carId].dailyPrice) } : null,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/expiring-requests
router.get("/expiring-requests", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const requests = await db.select().from(schema.rentalRequestsTable)
      .where(and(
        eq(schema.rentalRequestsTable.status, "WAITING_AGENCY_PAYMENT"),
        lte(schema.rentalRequestsTable.paymentDeadline, twoHoursFromNow),
        gte(schema.rentalRequestsTable.paymentDeadline, new Date())
      ));
    const result = requests.map(r => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/audit-logs
router.get("/audit-logs", authMiddleware, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.auditLogsTable);
    const logs = await db.select().from(schema.auditLogsTable).orderBy(desc(schema.auditLogsTable.createdAt)).limit(limitNum).offset((pageNum - 1) * limitNum);
    res.json({ logs, total });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
