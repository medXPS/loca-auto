import { Router } from "express";
import { eq, ilike, sql, desc } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { authMiddleware, requireRole } from "../lib/auth";

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

async function fetchCustomerDetail(id: number) {
  const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, id)).limit(1);
  if (!customer) return null;

  const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, customer.userId)).limit(1);
  const requests = await db.select().from(schema.rentalRequestsTable).where(eq(schema.rentalRequestsTable.customerId, customer.id));
  const documents = await db.select().from(schema.documentsTable)
    .where(eq(schema.documentsTable.customerId, customer.id))
    .orderBy(desc(schema.documentsTable.uploadedAt));

  return {
    ...customer,
    user: user ? publicUser(user) : null,
    rentalRequests: requests.map((r) => ({
      ...r,
      estimatedTotalPrice: Number(r.estimatedTotalPrice),
      finalPrice: r.finalPrice ? Number(r.finalPrice) : null,
    })),
    documents,
  };
}

// GET /api/customers
router.get("/", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));

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
      user: user ? publicUser(user) : null,
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
    if (!customer) {
      res.status(404).json({ error: "Profil non trouve" });
      return;
    }

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
    if (!customer) {
      res.status(404).json({ error: "Profil non trouve" });
      return;
    }

    const { fullName, phone, cin, passportNumber, drivingLicenseNumber, address, city } = req.body;

    if (fullName || phone) {
      await db.update(schema.usersTable)
        .set({ ...(fullName && { fullName }), ...(phone && { phone }) })
        .where(eq(schema.usersTable.id, req.user!.userId));
    }

    await db.update(schema.customersTable)
      .set({
        ...(cin !== undefined && { cin }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(drivingLicenseNumber !== undefined && { drivingLicenseNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      })
      .where(eq(schema.customersTable.id, customer.id));

    const result = await fetchCustomerDetail(customer.id);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/customers/:id
router.get("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const result = await fetchCustomerDetail(parseInt(String(req.params.id), 10));
    if (!result) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/customers/:id
router.patch("/:id", authMiddleware, requireRole("ADMIN", "AGENT"), async (req, res) => {
  try {
    const { fullName, phone, cin, passportNumber, drivingLicenseNumber, address, city } = req.body;
    const customerId = parseInt(String(req.params.id), 10);
    const [customer] = await db.select().from(schema.customersTable).where(eq(schema.customersTable.id, customerId)).limit(1);
    if (!customer) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }

    if (fullName || phone) {
      await db.update(schema.usersTable)
        .set({ ...(fullName && { fullName }), ...(phone && { phone }) })
        .where(eq(schema.usersTable.id, customer.userId));
    }

    await db.update(schema.customersTable)
      .set({
        ...(cin !== undefined && { cin }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(drivingLicenseNumber !== undefined && { drivingLicenseNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
      })
      .where(eq(schema.customersTable.id, customerId));

    const result = await fetchCustomerDetail(customerId);
    if (!result) {
      res.status(404).json({ error: "Client non trouve" });
      return;
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
