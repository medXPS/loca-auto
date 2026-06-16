import { customFetch } from "@workspace/api-client-react";

const STORAGE_KEY = "location-auto:pending-reservation";

export type PendingReservation = {
  carId: number;
  fullName: string;
  phone: string;
  email: string;
  startDate: string;
  returnDate: string;
  startHour: string;
  returnHour: string;
  estimatedTotalPrice: number;
};

export function savePendingReservation(payload: PendingReservation) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readPendingReservation(): PendingReservation | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingReservation;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingReservation() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function createPendingReservation() {
  const pending = readPendingReservation();
  if (!pending) return null;

  const request = await customFetch<any>("/api/rental-requests", {
    method: "POST",
    body: JSON.stringify(pending),
  });
  clearPendingReservation();
  return request;
}
