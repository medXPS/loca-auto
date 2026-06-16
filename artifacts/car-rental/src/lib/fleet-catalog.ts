import { customFetch } from "@workspace/api-client-react";

export type BrandRecord = {
  id: number;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  carsCount?: number;
};

export type AgencyRecord = {
  id: number;
  name: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
  isActive: boolean;
  carsCount?: number;
};

export type EligibleRatingRecord = {
  requestId: number;
  status: string;
  createdAt: string;
  startDate: string;
  returnDate: string;
  finalPrice?: number | null;
  car?: {
    id: number;
    brand: string;
    model: string;
    mainImageUrl?: string | null;
  } | null;
  existingRating?: {
    id: number;
    score: number;
    comment?: string | null;
  } | null;
};

export async function fetchBrands() {
  return customFetch<BrandRecord[]>("/api/brands");
}

export async function fetchAgencies() {
  return customFetch<AgencyRecord[]>("/api/agencies");
}

export async function saveBrand(data: Partial<BrandRecord> & { name: string }) {
  if (data.id) {
    return customFetch<BrandRecord>(`/api/brands/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  return customFetch<BrandRecord>("/api/brands", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function saveAgency(data: Partial<AgencyRecord> & { name: string; city: string }) {
  if (data.id) {
    return customFetch<AgencyRecord>(`/api/agencies/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  return customFetch<AgencyRecord>("/api/agencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchEligibleRatings() {
  return customFetch<EligibleRatingRecord[]>("/api/ratings/me/eligible");
}

export async function submitRating(data: { rentalRequestId: number; score: number; comment?: string }) {
  return customFetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
