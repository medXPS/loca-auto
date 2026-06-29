import { useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { formatDisplayDate } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { cn } from "@/lib/utils";

type ReservationSearchBarProps = {
  title?: string;
  cities: string[];
  city: string;
  startDate: string;
  returnDate: string;
  onCityChange: (value: string) => void;
  onDatesChange: (range: { startDate: string; returnDate: string }) => void;
  onSubmit: () => void;
  className?: string;
  variant?: "default" | "compact";
};

export function ReservationSearchBar({
  title,
  cities,
  city,
  startDate,
  returnDate,
  onCityChange,
  onDatesChange,
  onSubmit,
  className,
  variant = "default",
}: ReservationSearchBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isCompact = variant === "compact";

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
      <div
        className={cn(
          "overflow-hidden border border-white/12 bg-[linear-gradient(180deg,rgba(20,27,39,0.88),rgba(15,23,35,0.82))] shadow-[0_28px_80px_-36px_rgba(0,0,0,0.58)] backdrop-blur-xl",
          isCompact ? "rounded-[1.65rem]" : "rounded-[1.9rem]",
        )}
      >
        <div className={cn("grid gap-3", isCompact ? "p-3.5" : "p-4")}>
          {title && (
            <div className="px-1 pt-1">
              <p className="text-lg font-semibold uppercase tracking-[0.08em] text-white">{title}</p>
            </div>
          )}

          <div className={cn("border border-white/10 bg-white/8", isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4")}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Ville de depart</p>
            <Select value={city || "all"} onValueChange={handleCityChange}>
              <SelectTrigger
                className={cn(
                  "h-auto border-0 bg-transparent px-0 py-1 text-left font-semibold text-white shadow-none focus:ring-0",
                  isCompact ? "text-base" : "text-lg",
                )}
              >
                <MapPin className="mr-2 h-4 w-4 text-white/65" />
                <SelectValue placeholder="Casablanca" />
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "border border-white/10 bg-white/8 text-left transition hover:bg-white/12",
                    isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4",
                  )}
                >
                  <CalendarDays className="h-4 w-4 text-white/55" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Date de depart</p>
                  <p className={cn("mt-1 font-semibold text-white", isCompact ? "text-[0.9rem]" : "text-sm")}>
                    {startDate ? formatDisplayDate(startDate) : "Choisir"}
                  </p>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={12}
                className={cn(
                  "overflow-hidden rounded-[1.75rem] border-border/70 bg-background p-0 shadow-[0_30px_80px_-40px_rgba(16,23,34,0.25)]",
                  isCompact ? "w-[min(92vw,430px)]" : "w-[min(96vw,960px)]",
                )}
              >
                <DateRangeCalendar
                  label="Calendrier"
                  startDate={startDate}
                  returnDate={returnDate}
                  onChange={onDatesChange}
                  minimal
                  compact={isCompact}
                />
              </PopoverContent>
            </Popover>

            <button
              type="button"
              className={cn(
                "border border-white/10 bg-white/8 text-left transition hover:bg-white/12",
                isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4",
              )}
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarDays className="h-4 w-4 text-white/55" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Date de retour</p>
              <p className={cn("mt-1 font-semibold text-white", isCompact ? "text-[0.9rem]" : "text-sm")}>
                {returnDate ? formatDisplayDate(returnDate) : "Choisir"}
              </p>
            </button>
          </div>

          <Button
            type="submit"
            className={cn(
              "rounded-full bg-[#F04B45] px-6 font-medium text-white shadow-[0_18px_35px_-22px_rgba(240,75,69,0.65)] hover:bg-[#e63f39]",
              isCompact ? "h-12 text-[0.95rem]" : "h-14 text-base",
            )}
          >
            <Search className="h-4 w-4" />
            Rechercher
          </Button>
        </div>
      </div>
    </form>
  );
}
