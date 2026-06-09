import type { AvailabilityBlock } from "./generated/api.schemas";

export interface AvailabilityRange {
  startDate: string;
  endDate: string;
}

export const MONTHS_FR = [
  "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
  "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.",
];

export const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function parseIsoDate(isoDate: string): Date {
  if (!isoDate) return new Date(NaN);
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getIsoYearMonth(isoDate: string): { year: number; month: number } {
  const source = isoDate || todayIso();
  const [year, month] = source.slice(0, 7).split("-").map(Number);
  return {
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    month: Number.isFinite(month) ? month - 1 : new Date().getMonth(),
  };
}

export function calculateRentalDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.ceil((end - start) / 86400000);
}

export function isIsoRangeValid(startDate: string, endDate: string): boolean {
  return calculateRentalDays(startDate, endDate) > 0;
}

export function isIsoDateBlocked(
  isoDate: string,
  blocks: Pick<AvailabilityBlock, "startDate" | "endDate">[],
): boolean {
  return blocks.some((block) => isoDate >= block.startDate && isoDate <= block.endDate);
}

export function doesIsoRangeOverlapBlocked(
  range: AvailabilityRange,
  blocks: Pick<AvailabilityBlock, "startDate" | "endDate">[],
): boolean {
  if (!range.startDate || !range.endDate) return false;
  return blocks.some(
    (block) => range.startDate <= block.endDate && range.endDate >= block.startDate,
  );
}

export function getBlockedIsoDates(
  blocks: Pick<AvailabilityBlock, "startDate" | "endDate">[],
): Set<string> {
  const dates = new Set<string>();

  for (const block of blocks) {
    let current = block.startDate;
    while (current <= block.endDate) {
      dates.add(current);
      current = addIsoDays(current, 1);
    }
  }

  return dates;
}

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
