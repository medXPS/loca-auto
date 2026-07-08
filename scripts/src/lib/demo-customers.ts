import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import type { DatabaseContext } from "./database.js";

type CustomerSeedBase = {
  fullName: string;
  city: string;
  district: string;
};

const defaultCustomerPassword = "demo-customer@$";

const customerSeeds: CustomerSeedBase[] = [
  { fullName: "Amine Benali", city: "Casablanca", district: "Maarif" },
  { fullName: "Youssef El Fassi", city: "Rabat", district: "Agdal" },
  { fullName: "Salma Ait Lahcen", city: "Marrakech", district: "Gueliz" },
  { fullName: "Sara Berrada", city: "Tanger", district: "Malabata" },
  { fullName: "Mehdi Amrani", city: "Fes", district: "Jnan Sbil" },
  { fullName: "Ines Chafik", city: "Agadir", district: "Talborjt" },
  { fullName: "Omar Raji", city: "Casablanca", district: "Bourgogne" },
  { fullName: "Aya El Idrissi", city: "Rabat", district: "Hay Riad" },
  { fullName: "Hamza Bennis", city: "Marrakech", district: "Hivernage" },
  { fullName: "Kawtar Alaoui", city: "Fes", district: "Nouvelle Ville" },
  { fullName: "Rachid Ouhammou", city: "Tanger", district: "Iberia" },
  { fullName: "Meryem Bennani", city: "Casablanca", district: "Californie" },
  { fullName: "Nabil El Mansouri", city: "Agadir", district: "Founty" },
  { fullName: "Imane Zahir", city: "Rabat", district: "Souissi" },
  { fullName: "Reda Chraibi", city: "Marrakech", district: "Semlalia" },
  { fullName: "Soukaina El Azzouzi", city: "Fes", district: "Atlas" },
  { fullName: "Walid Najjar", city: "Casablanca", district: "Sidi Maarouf" },
  { fullName: "Fatima Zahra El Amrani", city: "Tanger", district: "Marshan" },
  { fullName: "Anas Moutaouakil", city: "Agadir", district: "Centre Ville" },
  { fullName: "Ilham Kabbaj", city: "Rabat", district: "Hassan" },
  { fullName: "Mourad Serghini", city: "Marrakech", district: "Mhamid" },
  { fullName: "Hanane Ouazzani", city: "Fes", district: "Batha" },
  { fullName: "Aymen El Hamri", city: "Casablanca", district: "Ain Diab" },
  { fullName: "Khadija Rmili", city: "Rabat", district: "Yacoub El Mansour" },
  { fullName: "Hicham Benslimane", city: "Tanger", district: "Dradeb" },
  { fullName: "Nada Idrissi", city: "Agadir", district: "Anza" },
  { fullName: "Ismail Barakat", city: "Casablanca", district: "Sidi Moumen" },
  { fullName: "Lina El Khadir", city: "Marrakech", district: "Palmeraie" },
  { fullName: "Yassine Benjelloun", city: "Fes", district: "Saiss" },
  { fullName: "Rania Ait Ali", city: "Tetouan", district: "Martil" },
];

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function makeCustomerEmail(fullName: string, index: number) {
  return `${normalizeSlug(fullName)}.${String(index + 1).padStart(2, "0")}@demo.locationauto.ma`;
}

function makePhone(index: number) {
  return `+2126${String(50000000 + index).padStart(8, "0")}`;
}

function makeCin(index: number) {
  return `MA${String(100000 + index).padStart(6, "0")}`;
}

function makeLicense(index: number) {
  return `DL${String(200000 + index).padStart(6, "0")}`;
}

function makePassport(index: number) {
  return index % 4 === 0 ? `P${String(300000 + index).padStart(6, "0")}` : null;
}

export async function ensureDemoCustomers(context: Pick<DatabaseContext, "db" | "schema">) {
  const passwordHash = await bcrypt.hash(defaultCustomerPassword, 10);
  const verifiedAt = new Date();

  const emails = customerSeeds.map((seed, index) => makeCustomerEmail(seed.fullName, index));
  const existingUsers = emails.length > 0
    ? await context.db
        .select()
        .from(context.schema.usersTable)
        .where(inArray(context.schema.usersTable.email, emails))
    : [];

  const existingCustomers = existingUsers.length > 0
    ? await context.db
        .select()
        .from(context.schema.customersTable)
        .where(inArray(context.schema.customersTable.userId, existingUsers.map((user) => user.id)))
    : [];

  const userByEmail = new Map(existingUsers.map((user) => [user.email.toLowerCase(), user]));
  const customerByUserId = new Map(existingCustomers.map((customer) => [customer.userId, customer]));

  let inserted = 0;

  for (const [index, seed] of customerSeeds.entries()) {
    const email = makeCustomerEmail(seed.fullName, index);
    const phone = makePhone(index);
    const cin = makeCin(index);
    const drivingLicenseNumber = makeLicense(index);
    const passportNumber = makePassport(index);
    const address = `Quartier ${seed.district}, ${seed.city}`;

    const userValues = {
      fullName: seed.fullName,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER" as const,
      status: "ACTIVE" as const,
      emailVerifiedAt: verifiedAt,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      mfaEnabled: false,
      mfaCodeHash: null,
      mfaCodeExpiresAt: null,
    };

    let user = userByEmail.get(email.toLowerCase());
    if (user) {
      await context.db
        .update(context.schema.usersTable)
        .set(userValues)
        .where(eq(context.schema.usersTable.id, user.id));
    } else {
      const [createdUser] = await context.db
        .insert(context.schema.usersTable)
        .values(userValues)
        .returning();

      if (!createdUser) {
        throw new Error(`Impossible de creer le compte client ${email}`);
      }

      user = createdUser;
      inserted += 1;
    }

    const customerValues = {
      userId: user.id,
      cin,
      passportNumber,
      drivingLicenseNumber,
      address,
      city: seed.city,
    };

    const existingCustomer = customerByUserId.get(user.id);
    if (existingCustomer) {
      await context.db
        .update(context.schema.customersTable)
        .set(customerValues)
        .where(eq(context.schema.customersTable.id, existingCustomer.id));
    } else {
      await context.db.insert(context.schema.customersTable).values(customerValues);
    }
  }

  return { inserted, expected: customerSeeds.length };
}
