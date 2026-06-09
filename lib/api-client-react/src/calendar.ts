import { calculateRentalDays } from "./availability";

export const MONTHS_FR = [
  "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.",
];

export const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDayOfMonth(year, month); i++) cells.push(null);
  for (let day = 1; day <= daysInMonth(year, month); day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTHS_FR[month]} ${year}`;
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "Choisir une date";
  const [year, month, day] = iso.split("-");
  return `${day} ${MONTHS_FR[Number(month) - 1]} ${year}`;
}

export function formatRangeSummary(startDate: string, returnDate: string): string {
  if (!startDate) return "Choisissez vos dates";
  if (!returnDate) return "Choisissez la date de retour";

  const days = calculateRentalDays(startDate, returnDate);
  return days <= 1 ? `${days} jour sélectionné` : `${days} jours sélectionnés`;
}
