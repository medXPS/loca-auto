import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";

function normalizeText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeOptionalText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function parseId(value: unknown) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

function parseCoordinate(value: string | null | undefined) {
  if (!value) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function brandNameToFallbackLogo(websiteUrl?: string | null) {
  if (!websiteUrl) return null;

  try {
    const parsed = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    return parsed.hostname ? `https://logo.clearbit.com/${parsed.hostname}` : null;
  } catch {
    return null;
  }
}

export function formatBrand(brand: typeof schema.carBrandsTable.$inferSelect) {
  return {
    ...brand,
    logoUrl: brand.logoUrl || brandNameToFallbackLogo(brand.websiteUrl),
  };
}

export function formatAgency(agency: typeof schema.agenciesTable.$inferSelect) {
  return {
    ...agency,
    latitude: parseCoordinate(agency.latitude),
    longitude: parseCoordinate(agency.longitude),
  };
}

async function findBrandByName(name: string) {
  const [brand] = await db
    .select()
    .from(schema.carBrandsTable)
    .where(sql`lower(${schema.carBrandsTable.name}) = lower(${name})`)
    .limit(1);
  return brand ?? null;
}

async function findAgencyByCity(city: string) {
  const [agency] = await db
    .select()
    .from(schema.agenciesTable)
    .where(sql`lower(${schema.agenciesTable.city}) = lower(${city})`)
    .limit(1);
  return agency ?? null;
}

export async function syncBrandCatalogueFromCars() {
  const rows = await db.selectDistinct({ brand: schema.carsTable.brand }).from(schema.carsTable);

  for (const row of rows) {
    const brandName = normalizeText(row.brand);
    if (!brandName) continue;

    const existing = await findBrandByName(brandName);
    if (!existing) {
      await db.insert(schema.carBrandsTable).values({ name: brandName });
    }
  }
}

export async function syncAgencyCatalogueFromCars() {
  const rows = await db.selectDistinct({ city: schema.carsTable.city }).from(schema.carsTable);

  for (const row of rows) {
    const city = normalizeText(row.city);
    if (!city) continue;

    const existing = await findAgencyByCity(city);
    if (!existing) {
      await db.insert(schema.agenciesTable).values({
        name: `Agence ${city}`,
        city,
      });
    }
  }
}

export async function ensureCatalogueBackfill() {
  await syncBrandCatalogueFromCars();
  await syncAgencyCatalogueFromCars();
}

export async function resolveBrandForCar(input: { brand?: unknown; brandId?: unknown }) {
  const brandId = parseId(input.brandId);
  if (brandId) {
    const [brand] = await db.select().from(schema.carBrandsTable).where(eq(schema.carBrandsTable.id, brandId)).limit(1);
    if (brand) {
      return { brandId: brand.id, brand: brand.name };
    }
  }

  const brandName = normalizeText(input.brand);
  if (!brandName) return {};

  const existing = await findBrandByName(brandName);
  if (existing) {
    return { brandId: existing.id, brand: existing.name };
  }

  const [created] = await db.insert(schema.carBrandsTable).values({ name: brandName }).returning();
  return { brandId: created.id, brand: created.name };
}

export async function resolveAgencyForCar(input: { city?: unknown; agencyId?: unknown }) {
  const agencyId = parseId(input.agencyId);
  if (agencyId) {
    const [agency] = await db.select().from(schema.agenciesTable).where(eq(schema.agenciesTable.id, agencyId)).limit(1);
    if (agency) {
      return { agencyId: agency.id, city: agency.city };
    }
  }

  const city = normalizeText(input.city);
  if (!city) return {};

  const existing = await findAgencyByCity(city);
  if (existing) {
    return { agencyId: existing.id, city: existing.city };
  }

  const [created] = await db.insert(schema.agenciesTable).values({
    name: `Agence ${city}`,
    city,
  }).returning();
  return { agencyId: created.id, city: created.city };
}

export function normalizeBrandPayload(input: {
  name?: unknown;
  logoUrl?: unknown;
  websiteUrl?: unknown;
  description?: unknown;
}) {
  const name = normalizeText(input.name);
  if (!name) {
    throw new Error("Nom de marque requis");
  }

  const websiteUrl = normalizeOptionalText(input.websiteUrl);
  const logoUrl = normalizeOptionalText(input.logoUrl) || brandNameToFallbackLogo(websiteUrl);

  return {
    name,
    logoUrl,
    websiteUrl,
    description: normalizeOptionalText(input.description),
  };
}

export function normalizeAgencyPayload(input: {
  name?: unknown;
  city?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  mapUrl?: unknown;
  isActive?: unknown;
}) {
  const name = normalizeText(input.name);
  const city = normalizeText(input.city);

  if (!name) {
    throw new Error("Nom d'agence requis");
  }

  if (!city) {
    throw new Error("Ville requise");
  }

  return {
    name,
    city,
    address: normalizeOptionalText(input.address),
    phone: normalizeOptionalText(input.phone),
    email: normalizeOptionalText(input.email),
    latitude: normalizeOptionalText(input.latitude),
    longitude: normalizeOptionalText(input.longitude),
    mapUrl: normalizeOptionalText(input.mapUrl),
    isActive: input.isActive === undefined ? true : Boolean(input.isActive),
  };
}

export async function getCarRelations(cars: Array<typeof schema.carsTable.$inferSelect>) {
  const carIds = cars.map((car) => car.id);
  const brandIds = [...new Set(cars.map((car) => car.brandId).filter((value): value is number => Number.isInteger(value)))];
  const agencyIds = [...new Set(cars.map((car) => car.agencyId).filter((value): value is number => Number.isInteger(value)))];
  const fallbackBrandNames = [...new Set(cars.filter((car) => !car.brandId && car.brand).map((car) => car.brand.trim()).filter(Boolean))];
  const fallbackCities = [...new Set(cars.filter((car) => !car.agencyId && car.city).map((car) => car.city.trim()).filter(Boolean))];

  const brands = brandIds.length > 0
    ? await db.select().from(schema.carBrandsTable).where(inArray(schema.carBrandsTable.id, brandIds))
    : [];
  const fallbackBrands = fallbackBrandNames.length > 0
    ? await db.select().from(schema.carBrandsTable).where(inArray(schema.carBrandsTable.name, fallbackBrandNames))
    : [];
  const agencies = agencyIds.length > 0
    ? await db.select().from(schema.agenciesTable).where(inArray(schema.agenciesTable.id, agencyIds))
    : [];
  const fallbackAgencies = fallbackCities.length > 0
    ? await db.select().from(schema.agenciesTable).where(inArray(schema.agenciesTable.city, fallbackCities))
    : [];
  const ratingRows = carIds.length > 0
    ? await db
        .select({
          carId: schema.carRatingsTable.carId,
          average: sql<string>`round(avg(${schema.carRatingsTable.score})::numeric, 1)::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.carRatingsTable)
        .where(inArray(schema.carRatingsTable.carId, carIds))
        .groupBy(schema.carRatingsTable.carId)
    : [];

  return {
    brandsById: new Map(brands.map((brand) => [brand.id, brand])),
    brandsByName: new Map(fallbackBrands.map((brand) => [brand.name.toLowerCase(), brand])),
    agenciesById: new Map(agencies.map((agency) => [agency.id, agency])),
    agenciesByCity: new Map(fallbackAgencies.map((agency) => [agency.city.toLowerCase(), agency])),
    ratingsByCarId: new Map(ratingRows.map((rating) => [rating.carId, rating])),
  };
}
