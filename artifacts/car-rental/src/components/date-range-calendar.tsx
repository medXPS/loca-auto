import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { addMonths, startOfMonth } from "date-fns";
import { CalendarCheck2, CalendarDays, CalendarX, RotateCcw } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { fr } from "date-fns/locale/fr";
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
import { Calendar } from "@/components/ui/calendar";

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

function clampMonth(month: Date, minMonth: Date, maxMonth?: Date) {
  const normalizedMonth = startOfMonth(month);

  if (normalizedMonth.getTime() < minMonth.getTime()) {
    return minMonth;
  }

  if (maxMonth && normalizedMonth.getTime() > maxMonth.getTime()) {
    return maxMonth;
  }

  return normalizedMonth;
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
  const swipeSurfaceRef = useRef<HTMLDivElement>(null);
  const swipeGestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    swiped: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);
  const lastSwipeAtRef = useRef<number | null>(null);
  const isWideCalendar = useMediaQuery("(min-width: 900px)");
  const isCompact = compact || minimal;
  const monthCount = isCompact || !isWideCalendar ? 1 : 2;
  const swipeStep = monthCount > 1 ? monthCount : 1;
  const hasSelection = Boolean(startDate || returnDate);
  const minMonth = useMemo(() => startOfMonth(parseIsoDate(minDate)), [minDate]);
  const maxMonth = useMemo(
    () => (maxDate ? startOfMonth(parseIsoDate(maxDate)) : undefined),
    [maxDate],
  );
  const initialVisibleMonth = useMemo(
    () =>
      clampMonth(
        startOfMonth(parseIsoDate(startDate || minDate)),
        minMonth,
        maxMonth,
      ),
    [maxDate, minDate, minMonth, maxMonth, startDate],
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(initialVisibleMonth);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    if (!startDate) return undefined;

    return {
      from: parseIsoDate(startDate),
      to: returnDate ? parseIsoDate(returnDate) : undefined,
    };
  }, [returnDate, startDate]);

  const disabledDates = useMemo(
    () => [
      { before: parseIsoDate(minDate) },
      ...(maxDate ? [{ after: parseIsoDate(maxDate) }] : []),
      ...blockedRanges.map((block) => ({
        from: parseIsoDate(block.startDate),
        to: parseIsoDate(block.endDate),
      })),
    ],
    [blockedRanges, maxDate, minDate],
  );

  const selectedLabel = formatRangeSummary(startDate, returnDate);

  useEffect(() => {
    setVisibleMonth(initialVisibleMonth);
  }, [initialVisibleMonth]);

  useEffect(() => {
    if (!startDate && !returnDate) {
      setWarningMessage(null);
    }
  }, [returnDate, startDate]);

  const navigateMonth = (direction: 1 | -1) => {
    setVisibleMonth((currentMonth) =>
      clampMonth(addMonths(currentMonth, direction * swipeStep), minMonth, maxMonth),
    );
  };

  const handleSwipeWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
      return;
    }

    if (Math.abs(event.deltaX) < 20) {
      return;
    }

    event.preventDefault();
    navigateMonth(event.deltaX < 0 ? 1 : -1);
  };

  const handleSwipePointerDownCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0 || !event.isPrimary) return;

    swipeGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      swiped: false,
    };
    suppressNextClickRef.current = false;
    lastSwipeAtRef.current = null;

    try {
      swipeSurfaceRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers can throw if capture is unsupported for the target node.
    }
  };

  const handleSwipePointerMoveCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const gesture = swipeGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId || gesture.swiped) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 12) {
      swipeGestureRef.current = null;

      try {
        swipeSurfaceRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release failures.
      }

      return;
    }

    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    gesture.swiped = true;
    suppressNextClickRef.current = true;
    lastSwipeAtRef.current = performance.now();
    event.preventDefault();
    navigateMonth(deltaX < 0 ? 1 : -1);
  };

  const clearSwipeGesture = (pointerId: number) => {
    if (swipeGestureRef.current?.pointerId === pointerId) {
      swipeGestureRef.current = null;
    }

    try {
      swipeSurfaceRef.current?.releasePointerCapture(pointerId);
    } catch {
      // Ignore capture release failures.
    }
  };

  const handleSwipePointerUpCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const gesture = swipeGestureRef.current;

    if (gesture?.pointerId === event.pointerId && gesture.swiped) {
      suppressNextClickRef.current = true;
    }

    clearSwipeGesture(event.pointerId);
  };

  const handleSwipePointerCancelCapture = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    clearSwipeGesture(event.pointerId);
  };

  const handleSwipeClickCapture = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    const lastSwipeAt = lastSwipeAtRef.current;
    const isRecentSwipe =
      suppressNextClickRef.current &&
      lastSwipeAt !== null &&
      performance.now() - lastSwipeAt < 500;

    if (!isRecentSwipe) {
      return;
    }

    suppressNextClickRef.current = false;
    lastSwipeAtRef.current = null;
    event.preventDefault();
    event.stopPropagation();
  };

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
      setWarningMessage("Cette période contient des dates déjà réservées ou une réservation en cours.");
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
            ? "overflow-hidden rounded-[1.3rem] border border-primary/10 bg-card shadow-[0_10px_22px_-18px_hsl(var(--primary)/0.5)]"
            : "overflow-hidden rounded-[1.35rem] border border-primary/10 bg-card shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.55)]"
        }
      >
        <div
          className={
            isCompact
              ? "border-b border-primary/10 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-2 py-2"
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

          <div className={isCompact ? "mt-1.5 grid grid-cols-2 gap-1.5" : "mt-3 grid gap-2 sm:grid-cols-2"}>
            <div
              className={
                isCompact
                  ? "rounded-lg border border-primary/10 bg-background/85 px-2 py-1.5 shadow-sm"
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
                  ? "rounded-lg border border-secondary/10 bg-background/85 px-2 py-1.5 shadow-sm"
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

        <div
          ref={swipeSurfaceRef}
          onPointerDownCapture={handleSwipePointerDownCapture}
          onPointerMoveCapture={handleSwipePointerMoveCapture}
          onPointerUpCapture={handleSwipePointerUpCapture}
          onPointerCancelCapture={handleSwipePointerCancelCapture}
          onClickCapture={handleSwipeClickCapture}
          onWheelCapture={handleSwipeWheel}
          className={
            isCompact
              ? "touch-none select-none p-1.5"
              : "touch-none select-none p-2 sm:p-3"
          }
        >
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
            month={visibleMonth}
            onMonthChange={(month) =>
              setVisibleMonth(clampMonth(month, minMonth, maxMonth))
            }
            startMonth={minMonth}
            endMonth={maxMonth}
            animate
            showOutsideDays
            className={
              isCompact
                ? "bg-transparent p-0 [--cell-size:0.92rem]"
                : "bg-transparent p-1 [--cell-size:2.35rem] sm:[--cell-size:2.55rem]"
            }
            classNames={{
              months: monthCount > 1 ? "flex w-full max-w-none flex-nowrap gap-4" : isCompact ? "grid gap-1" : "grid gap-4",
              month: isCompact ? "flex min-w-0 flex-col gap-1" : "flex min-w-0 flex-col gap-3",
              month_caption: isCompact ? "flex h-7 w-full items-center justify-center px-6" : "flex h-10 w-full items-center justify-center px-10",
              caption_label: isCompact ? "text-[0.74rem] font-semibold text-foreground" : "text-sm font-semibold text-foreground",
              nav: isCompact ? "absolute inset-x-0 top-0.5 flex items-center justify-between" : "absolute inset-x-1 top-1 flex items-center justify-between",
              button_previous:
                isCompact ? "h-5 w-5 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "h-8 w-8 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              button_next:
                isCompact ? "h-5 w-5 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "h-8 w-8 rounded-full border border-primary/10 bg-background/85 p-0 text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              weekdays: isCompact ? "grid grid-cols-7 gap-[0.18rem]" : "grid grid-cols-7 gap-1",
              weekday:
                isCompact ? "flex h-5 items-center justify-center rounded-full text-[0.54rem] font-semibold uppercase text-muted-foreground" : "flex h-8 items-center justify-center rounded-full text-[0.72rem] font-semibold uppercase text-muted-foreground",
              week: isCompact ? "mt-[0.1rem] grid grid-cols-7 gap-[0.18rem]" : "mt-1 grid grid-cols-7 gap-1",
              day: "relative aspect-square min-w-0 select-none p-0 text-center",
              today: "rounded-full border border-primary/20 bg-primary/10 text-primary",
              outside: "text-muted-foreground/45 aria-selected:text-muted-foreground/70",
              disabled: "rounded-full border border-rose-200/60 bg-rose-50 text-rose-300 opacity-100 line-through",
              range_start: "rounded-l-full bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary)/0.8)]",
              range_middle: "rounded-none bg-primary/12",
              range_end: "rounded-r-full bg-primary text-primary-foreground shadow-[0_10px_24px_-14px_hsl(var(--primary)/0.8)]",
            }}
          />
        </div>

        {minimal ? (
          warningMessage && (
            <div className="border-t border-primary/10 bg-muted/20 px-2 py-2">
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
                Indisponible
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
