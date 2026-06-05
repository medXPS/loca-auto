import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
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
  CONFIRMED_CALL: "Appel confirmé",
  WAITING_AGENCY_PAYMENT: "Attente paiement",
  ACTIVE: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  ABANDONED: "Abandonnée",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED_CALL: "bg-blue-100 text-blue-800",
  WAITING_AGENCY_PAYMENT: "bg-orange-100 text-orange-800",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-slate-100 text-slate-800",
  CANCELLED: "bg-red-100 text-red-800",
  ABANDONED: "bg-red-100 text-red-800",
};

export const CAR_STATUS_TRANSLATIONS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RENTED: "Louée",
  MAINTENANCE: "En entretien",
  INACTIVE: "Inactive",
};

export const CAR_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  RENTED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-yellow-100 text-yellow-800",
  INACTIVE: "bg-red-100 text-red-800",
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
