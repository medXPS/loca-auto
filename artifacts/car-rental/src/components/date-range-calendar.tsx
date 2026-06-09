import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck2, CalendarDays, CalendarX, RotateCcw } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { fr } from "date-fns/locale/fr";
import { Calendar } from "@/components/ui/calendar";
import type { AvailabilityBlock } from "@workspace/api-client-react";
import {
  doesIsoRangeOverlapBlocked,
  formatDisplayDate,
  formatRangeSummary,
  isIsoRangeValid,
  parseIsoDate,
  todayIso,
  toIsoDate,
} from "@workspace/api-client-react/availability";

interface DateRangeCalendarProps {
  label?: string;
  startDate: string;
  returnDate: string;
  onChange: (range: { startDate: string; returnDate: string }) => void;
  blockedRanges?: AvailabilityBlock[];
  minDate?: string;
  maxDate?: string;
  compact?: boolean;
  minimal?: boolean;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function DateRangeCalendar({
  label = "Calendrier",
  startDate,
  returnDate,
  onChange,
  blockedRanges = [],
  minDate = todayIso(),
  maxDate,
  compact = false,
  minimal = false,
}: DateRangeCalendarProps) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const lastClickedIsoRef = useRef<string | null>(null);
  const isWideCalendar = useMediaQuery("(min-width: 900px)");
  const isCompact = compact || minimal;
  const monthCount = isCompact || !isWideCalendar ? 1 : 2;
  const hasSelection = Boolean(startDate || returnDate);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined;

    return {
      from: parseIsoDate(startDate),
      to: returnDate ? parseIsoDate(returnDate) : undefined,
    };
  }, [startDate, returnDate]);

  const disabledDates = useMemo(
    () => [
      { before: parseIsoDate(minDate) },
      ...(maxDate ? [{ after: parseIsoDate(maxDate) }] : []),
      ...blockedRanges.map((block) => ({
        from: parseIsoDate(block.startDate),
        to: parseIsoDate(block.endDate),
      })),
    ],
    [blockedRanges, minDate, maxDate],
  );

  const selectedLabel = formatRangeSummary(startDate, returnDate);

  useEffect(() => {
    if (!startDate && !returnDate) {
      setWarningMessage(null);
    }
  }, [startDate, returnDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      setWarningMessage(null);
      onChange({ startDate: "", returnDate: "" });
      return;
    }

    const nextStartDate = toIsoDate(range.from);
    const nextReturnDate = range.to ? toIsoDate(range.to) : "";

    if (!nextReturnDate) {
      setWarningMessage(null);
      onChange({ startDate: nextStartDate, returnDate: "" });
      return;
    }

    if (!isIsoRangeValid(nextStartDate, nextReturnDate)) {
      setWarningMessage("La date de retour doit être après la date de départ.");
      onChange({ startDate: nextReturnDate, returnDate: "" });
      return;
    }

    if (doesIsoRangeOverlapBlocked({ startDate: nextStartDate, endDate: nextReturnDate }, blockedRanges)) {
      setWarningMessage("Cette période traverse des dates réservées. Choisissez une autre plage.");
      onChange({ startDate: lastClickedIsoRef.current ?? nextReturnDate, returnDate: "" });
      return;
    }

    setWarningMessage(null);
    onChange({ startDate: nextStartDate, returnDate: nextReturnDate });
  };

  return (
    <div className={isCompact ? "space-y-2" : "space-y-4"}>
      <div
        className={
          isCompact
            ? "overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-[0_10px_22px_-18px_hsl(var(--primary)/0.5)]"
            : "overflow-hidden rounded-[1.35rem] border border-primary/10 bg-card shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.55)]"
        }
      >
        <div
          className={
            isCompact
              ? "border-b border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-2.5 py-2.5"
              : "border-b border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-3 py-3 sm:px-4"
          }
        >
          <div
            className={
              isCompact
                ? "flex items-center justify-between gap-2"
                : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            }
          >
            <div className={isCompact ? "flex items-center gap-2 text-xs font-semibold" : "flex items-center gap-2 text-sm font-semibold"}>
              <span
                className={
                  isCompact
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                }
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <span>{label}</span>
            </div>

            {hasSelection && (
              <button
                type="button"
                onClick={() => {
                  setWarningMessage(null);
                  onChange({ startDate: "", returnDate: "" });
                }}
                aria-label="Réinitialiser la période"
                title="Réinitialiser"
                className={
                  isCompact
                    ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-muted-foreground shadow-sm transition-colors hover:bg-background hover:text-foreground"
                    : "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-background hover:text-foreground"
                }
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {!isCompact && "Réinitialiser"}
              </button>
            )}
          </div>

          <div className={isCompact ? "mt-2 grid grid-cols-2 gap-1.5" : "mt-3 grid gap-2 sm:grid-cols-2"}>
            <div
              className={
                isCompact
                  ? "rounded-xl border border-primary/10 bg-background/85 px-2 py-1.5 shadow-sm"
                  : "rounded-2xl border border-primary/10 bg-background/85 px-3 py-2 shadow-sm"
              }
            >
              <div className="text-[10px] font-medium uppercase text-muted-foreground">Départ</div>
              <div
                className={
                  isCompact
                    ? "mt-0.5 min-h-4 text-[11px] font-semibold leading-snug text-foreground"
                    : "mt-1 min-h-5 text-sm font-semibold text-foreground"
                }
              >
                {startDate ? formatDisplayDate(startDate) : "À choisir"}
              </div>
            </div>

            <div
              className={
                isCompact
                  ? "rounded-xl border border-secondary/10 bg-background/85 px-2 py-1.5 shadow-sm"
                  : "rounded-2xl border border-secondary/10 bg-background/85 px-3 py-2 shadow-sm"
              }
            >
              <div className="text-[10px] font-medium uppercase text-muted-foreground">Retour</div>
              <div
                className={
                  isCompact
                    ? "mt-0.5 min-h-4 text-[11px] font-semibold leading-snug text-foreground"
                    : "mt-1 min-h-5 text-sm font-semibold text-foreground"
                }
              >
                {returnDate ? formatDisplayDate(returnDate) : "À choisir"}
              </div>
            </div>
          </div>
        </div>

        <div className={isCompact ? "p-1.5" : "p-2 sm:p-3"}>
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            onDayClick={(day) => {
              lastClickedIsoRef.current = toIsoDate(day);
            }}
            disabled={disabledDates}
            locale={fr}
            weekStartsOn={1}
            numberOfMonths={monthCount}
            showOutsideDays
            className={isCompact ? "bg-transparent p-0 [--cell-size:1.38rem]" : "bg-transparent p-1 [--cell-size:2.35rem] sm:[--cell-size:2.55rem]"}
            classNames={{
              months: monthCount > 1 ? "grid gap-4 lg:grid-cols-2" : isCompact ? "grid gap-1.5" : "grid gap-4",
              month: isCompact ? "flex min-w-0 flex-col gap-1.5" : "flex min-w-0 flex-col gap-3",
              month_caption: isCompact ? "flex h-8 w-full items-center justify-center px-7" : "flex h-10 w-full items-center justify-center px-10",
              caption_label: isCompact ? "text-[0.78rem] font-semibold text-foreground" : "text-sm font-semibold text-foreground",
              nav: isCompact ? "absolute inset-x-0 top-0.5 flex items-center justify-between" : "absolute inset-x-1 top-1 flex items-center justify-between",
              button_previous:
                isCompact ? "h-6 w-6 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "h-8 w-8 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              button_next:
                isCompact ? "h-6 w-6 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "h-8 w-8 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              weekdays: isCompact ? "grid grid-cols-7 gap-[0.25rem]" : "grid grid-cols-7 gap-1",
              weekday:
                isCompact ? "flex h-6 items-center justify-center rounded-full text-[0.6rem] font-semibold uppercase text-muted-foreground" : "flex h-8 items-center justify-center rounded-full text-[0.72rem] font-semibold uppercase text-muted-foreground",
              week: isCompact ? "mt-[0.125rem] grid grid-cols-7 gap-[0.25rem]" : "mt-1 grid grid-cols-7 gap-1",
              day: "relative aspect-square min-w-0 select-none p-0 text-center",
              today: "rounded-full border border-primary/20 bg-secondary/10 text-secondary",
              outside: "text-muted-foreground/45 aria-selected:text-muted-foreground/70",
              disabled: "rounded-full bg-muted/40 text-muted-foreground/50 opacity-100 line-through",
              range_start: "rounded-l-full bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary)/0.8)]",
              range_middle: "rounded-none bg-primary/12",
              range_end: "rounded-r-full bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary)/0.8)]",
            }}
          />
        </div>

        {minimal ? (
          warningMessage && (
            <div className="border-t border-primary/10 bg-muted/20 px-2.5 py-2.5">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px] font-medium text-destructive">
                {warningMessage}
              </div>
            </div>
          )
        ) : (
          <div className={isCompact ? "space-y-2.5 border-t border-primary/10 bg-muted/20 px-2.5 py-2.5" : "space-y-3 border-t border-primary/10 bg-muted/20 px-3 py-3 sm:px-4"}>
            {warningMessage && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                {warningMessage}
              </div>
            )}

            <div className={isCompact ? "grid gap-1.5 text-[11px] font-medium text-muted-foreground" : "flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground"}>
              <span className="inline-flex items-center gap-2">
                <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
                Période sélectionnée
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarX className="h-3.5 w-3.5" />
                Réservé
              </span>
            </div>

            <div className={isCompact ? "rounded-xl border border-primary/10 bg-background px-2.5 py-2 text-[11px] shadow-sm" : "rounded-2xl border border-primary/10 bg-background px-3 py-2 text-sm shadow-sm"}>
              <div className={isCompact ? "space-y-1" : "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"}>
                <span className="text-muted-foreground">{selectedLabel}</span>
                <span className={isCompact ? "block text-xs font-semibold leading-snug text-foreground" : "font-semibold text-foreground"}>
                  {startDate ? formatDisplayDate(startDate) : "Départ"}
                  {returnDate ? ` - ${formatDisplayDate(returnDate)}` : ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
