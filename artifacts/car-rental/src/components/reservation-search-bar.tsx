import { useState } from "react";
import { CalendarDays, MapPin, Search, X } from "lucide-react";
import { formatDisplayDate } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { cn } from "@/lib/utils";

type ReservationSearchBarProps = {
  cities: string[];
  city: string;
  startDate: string;
  returnDate: string;
  onCityChange: (value: string) => void;
  onDatesChange: (range: { startDate: string; returnDate: string }) => void;
  onSubmit: () => void;
  onReset: () => void;
  className?: string;
};

export function ReservationSearchBar({
  cities,
  city,
  startDate,
  returnDate,
  onCityChange,
  onDatesChange,
  onSubmit,
  onReset,
  className,
}: ReservationSearchBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const hasSelection = Boolean(city || startDate || returnDate);

  const selectedDateLabel = startDate ? formatDisplayDate(startDate) : "Choisir vos dates";
  const rangeLabel = startDate && returnDate ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(returnDate)}` : "Arrivée - Départ";

  const handleCityChange = (value: string) => {
    onCityChange(value === "all" ? "" : value);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className={cn("w-full", className)}
    >
      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-[0_28px_70px_-40px_rgba(16,23,34,0.22)]">
        <div className="grid divide-y divide-border/70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] lg:divide-x lg:divide-y-0">
          <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Lieu</p>
              <Select value={city || "all"} onValueChange={handleCityChange}>
                <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-0 text-left text-base font-semibold shadow-none focus:ring-0 [&>svg]:hidden">
                  <SelectValue placeholder="Où souhaitez-vous louer ?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 items-center gap-3 px-4 py-4 text-left transition hover:bg-muted/20 sm:px-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Créneau de date</p>
                  <p className="truncate text-base font-semibold text-foreground">{selectedDateLabel}</p>
                  <p className="text-sm text-muted-foreground">{rangeLabel}</p>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={12}
              className="w-[min(96vw,960px)] overflow-hidden rounded-[1.75rem] border-border/70 bg-background p-0 shadow-[0_30px_80px_-40px_rgba(16,23,34,0.25)]"
            >
              <DateRangeCalendar
                label="Calendrier"
                startDate={startDate}
                returnDate={returnDate}
                onChange={onDatesChange}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full border-border/70 bg-white px-4"
              onClick={onReset}
              disabled={!hasSelection}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Effacer</span>
            </Button>
            <Button
              type="submit"
              className="h-12 w-12 rounded-full bg-primary p-0 text-primary-foreground shadow-[0_18px_35px_-22px_hsl(var(--primary)/0.7)]"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
