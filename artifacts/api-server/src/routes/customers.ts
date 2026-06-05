import { Router } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();

async function fetchCustomerDetail(id: number) {
  const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, id)).limit(1);
  if (!customer) return null;
  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, customer.userId)).limit(1);
  const requests = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.customerId, customer.id));
  return {
    ...customer,
    user: user ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt } : null,
    rentalRequests: requests.map(r => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
    })),
  };
}

// GET /api/customers
router.get("/", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    // Join with users for search
    let query = db.select({ customer: schema.customersTable, user: schema.usersTable })
      .from(schema.customersTable)
      .leftJoin(schema.usersTable, eq(schema.customersTable.userId, schema.usersTable.id));

    if (search) {
      query = query.where(
        sql`${ilike(schema.usersTable.fullName, `%${search}%`)} OR ${ilike(schema.usersTable.email, `%${search}%`)} OR ${ilike(schema.usersTable.phone, `%${search}%`)}`
      ) as any;
    }

    const allRows = await (query as any);
    const total = allRows.length;
    const paged = allRows.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const customers = paged.map(({ customer, user }: any) => ({
      ...customer,
      user: user ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt } : null,
    }));

    res.json({ customers, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/customers/me/profile
router.get("/me/profile", authMiddleware, async (req, res) => {
  try {
    const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
    if (!customer) { res.status(404).json({ error: "Profil non trouvé" }); return; }
    const result = await fetchCustomerDetail(customer.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/customers/me/profile
router.patch("/me/profile", authMiddleware, async (req, res) => {
  try {
    const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.userId, req.user!.userId)).limit(1);
    if (!customer) { res.status(404).json({ error: "Profil non trouvé" }); return; }
    const { cin, passportNumber, drivingLicenseNumber, address, city } = req.body;
    await db.update(schema.customersTable).set({ cin, passportNumber, drivingLicenseNumber, address, city }).where(eq(schema.customersTable.id, customer.id));
    const result = await fetchCustomerDetail(customer.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/customers/:id
router.get("/:id", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const result = await fetchCustomerDetail(parseInt(req.params.id));
    if (!result) { res.status(404).json({ error: "Client non trouvé" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/customers/:id
router.patch("/:id", authMiddleware, requireRole("SUPER_ADMIN", "AGENT"), async (req, res) => {
  try {
    const { cin, passportNumber, drivingLicenseNumber, address, city } = req.body;
    await db.update(schema.customersTable).set({ cin, passportNumber, drivingLicenseNumber, address, city }).where(eq(schema.customersTable.id, parseInt(req.params.id)));
    const result = await fetchCustomerDetail(parseInt(req.params.id));
    if (!result) { res.status(404).json({ error: "Client non trouvé" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
