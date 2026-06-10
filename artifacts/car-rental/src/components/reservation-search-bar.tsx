import { useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
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
  className?: string;
};

function formatRangeLabel(startDate: string, returnDate: string) {
  if (startDate && returnDate) {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(returnDate)}`;
  }

  if (startDate) {
    return `Départ ${formatDisplayDate(startDate)}`;
  }

  return "Choisir vos dates";
}

export function ReservationSearchBar({
  cities,
  city,
  startDate,
  returnDate,
  onCityChange,
  onDatesChange,
  onSubmit,
  className,
}: ReservationSearchBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDateLabel = formatRangeLabel(startDate, returnDate);

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
      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_20px_55px_-34px_rgba(15,23,42,0.18)]">
        <div className="grid divide-y divide-border/70 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] lg:divide-x lg:divide-y-0">
          <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ville</p>
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
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dates</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Date début</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {startDate ? formatDisplayDate(startDate) : "Choisir"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Date fin</p>
                      <p className="truncate text-sm font-semibold text-foreground">
                        {returnDate ? formatDisplayDate(returnDate) : "Choisir"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{selectedDateLabel}</p>
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
                minimal
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center px-4 py-4 lg:justify-end">
            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-primary px-6 text-primary-foreground shadow-[0_18px_35px_-22px_hsl(var(--primary)/0.55)] lg:w-auto"
            >
              <Search className="h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
