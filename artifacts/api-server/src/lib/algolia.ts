import { schema } from "./db";

type AlgoliaRecord = Record<string, unknown> & { objectID: string };

type AlgoliaSearchResponse<T> = {
  hits: T[];
  nbHits?: number;
  page?: number;
  hitsPerPage?: number;
};

const applicationId = readEnv("ALGOLIA_APPLICATION_ID");
const searchApiKey = readEnv("ALGOLIA_SEARCH_API_KEY");
const adminApiKey = readEnv("ALGOLIA_ADMIN_API_KEY");

export const ALGOLIA_CARS_INDEX = readEnv("ALGOLIA_CARS_INDEX") || "cars";
export const ALGOLIA_BLOG_INDEX = readEnv("ALGOLIA_BLOG_INDEX") || "blog_posts";

const backfillPromises = new Map<string, Promise<boolean>>();
const backfillReady = new Set<string>();

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function hasSearchAccess() {
  return Boolean(applicationId && (searchApiKey || adminApiKey));
}

function hasWriteAccess() {
  return Boolean(applicationId && adminApiKey);
}

function getSearchApiKey() {
  return searchApiKey || adminApiKey;
}

function getWriteApiKey() {
  return adminApiKey;
}

function getBaseUrl(kind: "search" | "write") {
  if (!applicationId) return "";
  return kind === "search"
    ? `https://${applicationId}-dsn.algolia.net`
    : `https://${applicationId}.algolia.net`;
}

function normalizePart(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function stripHtml(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function compactSearchText(...parts: unknown[]) {
  return parts
    .map((part) => normalizePart(part))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function requestJson<T>(
  kind: "search" | "write",
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
) {
  try {
    const apiKey = kind === "search" ? getSearchApiKey() : getWriteApiKey();
    if (!applicationId || !apiKey) return null;

    const response = await fetch(`${getBaseUrl(kind)}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "x-algolia-application-id": applicationId,
        "x-algolia-api-key": apiKey,
        "content-type": "application/json",
      },
      body:
        options.body === undefined
          ? undefined
          : typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.warn(
        `[algolia] ${kind} request failed for ${path}: ${response.status} ${details}`,
      );
      return null;
    }

    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error) {
    console.warn(`[algolia] ${kind} request errored for ${path}:`, error);
    return null;
  }
}

async function waitForTask(indexName: string, taskID: number) {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    const result = await requestJson<{ status?: string }>(
      "write",
      `/1/indexes/${encodeURIComponent(indexName)}/task/${taskID}`,
      { method: "GET" },
    );

    if (!result) return false;
    if (result.status === "published") return true;

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.warn(
    `[algolia] task ${taskID} for ${indexName} did not finish within the timeout`,
  );
  return false;
}

async function batchUpsertRecords(indexName: string, records: AlgoliaRecord[]) {
  if (!hasWriteAccess() || records.length === 0) return false;

  for (const recordsChunk of chunk(records, 100)) {
    const result = await requestJson<{ taskID?: number }>(
      "write",
      `/1/indexes/${encodeURIComponent(indexName)}/batch`,
      {
        method: "POST",
        body: {
          requests: recordsChunk.map((record) => ({
            action: "addObject",
            body: record,
          })),
        },
      },
    );

    if (!result?.taskID) {
      return false;
    }

    await waitForTask(indexName, result.taskID);
  }

  return true;
}

export function isAlgoliaSearchEnabled() {
  return hasSearchAccess();
}

export async function ensureAlgoliaBackfill(
  indexName: string,
  loadRecords: () => Promise<AlgoliaRecord[]>,
) {
  if (!hasWriteAccess()) return false;
  if (backfillReady.has(indexName)) return true;

  const existing = backfillPromises.get(indexName);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const records = await loadRecords();
    if (records.length === 0) {
      backfillReady.add(indexName);
      return true;
    }

    const success = await batchUpsertRecords(indexName, records);
    if (success) {
      backfillReady.add(indexName);
    }
    return success;
  })().catch((error) => {
    console.warn(`[algolia] backfill failed for ${indexName}:`, error);
    return false;
  });

  backfillPromises.set(indexName, promise);

  try {
    return await promise;
  } finally {
    backfillPromises.delete(indexName);
  }
}

export async function searchAlgoliaObjectIds(
  indexName: string,
  query: string,
  loadRecords?: () => Promise<AlgoliaRecord[]>,
) {
  if (!hasSearchAccess()) return null;

  if (loadRecords) {
    await ensureAlgoliaBackfill(indexName, loadRecords);
  }

  const result = await requestJson<AlgoliaSearchResponse<{ objectID: string }>>(
    "search",
    `/1/indexes/${encodeURIComponent(indexName)}/query`,
    {
      method: "POST",
      body: {
        query,
        hitsPerPage: 1000,
      },
    },
  );

  if (!result) return null;

  return [...new Set(
    result.hits
      .map((hit) => Number(hit.objectID))
      .filter((value) => Number.isInteger(value)),
  )];
}

export async function upsertAlgoliaRecord(indexName: string, record: AlgoliaRecord) {
  if (!hasWriteAccess()) return false;

  const result = await requestJson<{ taskID?: number }>(
    "write",
    `/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(record.objectID)}`,
    {
      method: "PUT",
      body: record,
    },
  );

  if (!result?.taskID) return false;

  await waitForTask(indexName, result.taskID);
  return true;
}

export async function deleteAlgoliaRecord(indexName: string, objectID: string) {
  if (!hasWriteAccess()) return false;

  const result = await requestJson<{ taskID?: number }>(
    "write",
    `/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(objectID)}`,
    {
      method: "DELETE",
    },
  );

  if (!result?.taskID) return false;

  await waitForTask(indexName, result.taskID);
  return true;
}

export function buildCarSearchRecord(car: typeof schema.carsTable.$inferSelect) {
  return {
    objectID: String(car.id),
    searchText: compactSearchText(
      car.brand,
      car.model,
      car.category,
      car.city,
      car.description,
      car.seoTitle,
      car.seoDescription,
      car.internalReference,
      car.licensePlate,
      car.requiredDocuments,
      car.fuelType,
      car.transmission,
    ),
    brand: car.brand,
    brandId: car.brandId ?? null,
    model: car.model,
    year: car.year,
    category: car.category,
    fuelType: car.fuelType,
    transmission: car.transmission,
    seats: car.seats,
    city: car.city,
    agencyId: car.agencyId ?? null,
    internalReference: car.internalReference ?? null,
    licensePlate: car.licensePlate ?? null,
    description: car.description ?? null,
    seoTitle: car.seoTitle ?? null,
    seoDescription: car.seoDescription ?? null,
    requiredDocuments: car.requiredDocuments ?? null,
    status: car.status,
    dailyPrice: Number(car.dailyPrice),
    weeklyPrice: car.weeklyPrice ? Number(car.weeklyPrice) : null,
    monthlyPrice: car.monthlyPrice ? Number(car.monthlyPrice) : null,
    depositAmount: car.depositAmount == null ? null : Number(car.depositAmount),
    mainImageUrl: car.mainImageUrl ?? null,
    createdAt: car.createdAt.toISOString(),
    updatedAt: car.updatedAt.toISOString(),
  };
}

export function buildBlogSearchRecord(
  post: typeof schema.blogPostsTable.$inferSelect,
) {
  return {
    objectID: String(post.id),
    searchText: compactSearchText(
      post.title,
      post.slug,
      post.excerpt,
      post.category,
      post.tags,
      post.seoTitle,
      post.seoDescription,
      post.ogTitle,
      post.ogDescription,
      stripHtml(post.content).slice(0, 4000),
    ),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    category: post.category,
    tags: post.tags,
    coverImage: post.coverImage ?? null,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    ogTitle: post.ogTitle ?? null,
    ogDescription: post.ogDescription ?? null,
    ogImage: post.ogImage ?? null,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
