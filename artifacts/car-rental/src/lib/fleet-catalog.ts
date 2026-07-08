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
    serviceScore?: number | null;
    comment?: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

export type PublicRatingsSummary = {
  averageCarScore: number | null;
  averageServiceScore: number | null;
  totalReviews: number;
  satisfiedClients: number;
};

export type PublicRatingsTestimonial = {
  id: number;
  customerName: string;
  location: string;
  carLabel: string;
  score: number;
  serviceScore: number;
  comment: string;
  createdAt: string;
};

export type PublicRatingsOverview = {
  summary: PublicRatingsSummary;
  testimonials: PublicRatingsTestimonial[];
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

export async function deleteAgency(id: number) {
  return customFetch<void>(`/api/agencies/${id}`, {
    method: "DELETE",
  });
}

export async function fetchEligibleRatings() {
  return customFetch<EligibleRatingRecord[]>("/api/ratings/me/eligible");
}

export async function fetchPublicRatings() {
  return customFetch<PublicRatingsOverview>("/api/ratings/public");
}

export async function submitRating(data: {
  rentalRequestId: number;
  score: number;
  serviceScore: number;
  comment?: string;
}) {
  return customFetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
