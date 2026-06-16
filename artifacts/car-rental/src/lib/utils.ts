import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + " MAD";
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export const STATUS_TRANSLATIONS: Record<string, string> = {
  PENDING: "En attente",
  DOCUMENT_SUBMISSION_WINDOW: "Documents requis",
  PENDING_CALL_CONFIRMATION: "Appel a confirmer",
  EXTENDED_PAYMENT_DEADLINE: "Delai prolonge",
  PAID: "Payee",
  ACTIVE_RENTAL: "Location active",
  UNDER_REVIEW: "En attente",
  CALL_ATTEMPTED: "En attente",
  CALL_CONFIRMED: "Appel confirmé",
  WAITING_AGENCY_PAYMENT: "Appel confirmé",
  RESERVED: "Réservé",
  CAR_DELIVERED: "En cours de location",
  RENTED: "En cours de location",
  CAR_RETURNED: "Retourné",
  RETURNED: "Retourné",
  COMPLETED: "Retourné",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  ABANDONED: "Abandonné",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  DOCUMENT_SUBMISSION_WINDOW: "bg-amber-100 text-amber-800",
  PENDING_CALL_CONFIRMATION: "bg-sky-100 text-sky-800",
  EXTENDED_PAYMENT_DEADLINE: "bg-indigo-100 text-indigo-800",
  PAID: "bg-emerald-100 text-emerald-800",
  ACTIVE_RENTAL: "bg-emerald-100 text-emerald-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  CALL_ATTEMPTED: "bg-yellow-100 text-yellow-800",
  CALL_CONFIRMED: "bg-sky-100 text-sky-800",
  WAITING_AGENCY_PAYMENT: "bg-sky-100 text-sky-800",
  RESERVED: "bg-blue-100 text-blue-800",
  CAR_DELIVERED: "bg-emerald-100 text-emerald-800",
  RENTED: "bg-emerald-100 text-emerald-800",
  CAR_RETURNED: "bg-emerald-100 text-emerald-800",
  RETURNED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-red-100 text-red-800",
  ABANDONED: "bg-red-100 text-red-800",
};

export const RENTAL_ACTIVE_STATUSES = new Set([
  "PENDING",
  "DOCUMENT_SUBMISSION_WINDOW",
  "PENDING_CALL_CONFIRMATION",
  "UNDER_REVIEW",
  "CALL_ATTEMPTED",
  "CALL_CONFIRMED",
  "EXTENDED_PAYMENT_DEADLINE",
  "WAITING_AGENCY_PAYMENT",
  "RESERVED",
  "PAID",
  "ACTIVE_RENTAL",
  "CAR_DELIVERED",
  "RENTED",
]);

export const RENTAL_TERMINAL_STATUSES = new Set([
  "CAR_RETURNED",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
  "ABANDONED",
  "REJECTED",
]);

export function isActiveRentalStatus(status?: string | null) {
  if (!status) return false;
  return RENTAL_ACTIVE_STATUSES.has(status);
}

export function isTerminalRentalStatus(status?: string | null) {
  if (!status) return false;
  return RENTAL_TERMINAL_STATUSES.has(status);
}

export const CAR_STATUS_TRANSLATIONS: Record<string, string> = {
  AVAILABLE: "Disponible",
  TEMPORARILY_HELD: "Réservée temporairement",
  RESERVED: "Réservée",
  RENTED: "Louée",
  MAINTENANCE: "En entretien",
  INACTIVE: "Inactive",
};

export const CAR_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  TEMPORARILY_HELD: "bg-yellow-100 text-yellow-800",
  RESERVED: "bg-blue-100 text-blue-800",
  RENTED: "bg-sky-100 text-sky-800",
  MAINTENANCE: "bg-rose-100 text-rose-800",
  INACTIVE: "bg-slate-100 text-slate-800",
};

export const CATEGORY_TRANSLATIONS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  MONOSPACE: "Monospace",
  UTILITAIRE: "Utilitaire",
  LUXE: "Luxe",
  SPORT: "Sport",
  "4X4": "4x4",
};

export const FUEL_TRANSLATIONS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
};

export const EXPENSE_CATEGORY_TRANSLATIONS: Record<string, string> = {
  CARBURANT: "Carburant",
  ENTRETIEN: "Entretien",
  ASSURANCE: "Assurance",
  REPARATION: "Réparation",
  TAXE: "Taxe",
  SALAIRE: "Salaire",
  LOYER: "Loyer",
  AUTRE: "Autre",
};
