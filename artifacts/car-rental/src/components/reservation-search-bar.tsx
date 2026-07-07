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
  subtitle?: string;
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
  subtitle,
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
          "overflow-hidden border border-slate-200 bg-white shadow-[0_26px_70px_-34px_rgba(15,23,42,0.18)] backdrop-blur-xl",
          isCompact ? "rounded-[1.65rem]" : "rounded-[1.9rem]",
        )}
      >
        <div className={cn("grid gap-3", isCompact ? "p-3.5" : "p-4")}>
          {title && (
            <div className="space-y-1 px-1 pt-1">
              <p className="text-[1.02rem] font-extrabold tracking-tight text-slate-950 sm:text-[1.08rem]">
                {title}
              </p>
              {subtitle && <p className="text-sm leading-6 text-slate-500">{subtitle}</p>}
            </div>
          )}

          <div
            className={cn(
              "border border-slate-200 bg-slate-50/80",
              isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4",
            )}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Ville de départ</p>
            <Select value={city || "all"} onValueChange={handleCityChange}>
              <SelectTrigger
                className={cn(
                  "h-auto border-0 bg-transparent px-0 py-1 text-left font-semibold text-slate-950 shadow-none focus:ring-0",
                  isCompact ? "text-[0.95rem]" : "text-[1.02rem]",
                )}
              >
                <MapPin className="mr-2 h-4 w-4 text-[#ff4d43]" />
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
                    "border border-slate-200 bg-slate-50/80 text-left transition hover:bg-white",
                    isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4",
                  )}
                >
                  <CalendarDays className="h-4 w-4 text-[#ff4d43]" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Date de départ</p>
                  <p className={cn("mt-1 font-semibold text-slate-950", isCompact ? "text-[0.9rem]" : "text-sm")}>
                    {startDate ? formatDisplayDate(startDate) : "Choisir"}
                  </p>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={12}
                className={cn(
                  "overflow-hidden rounded-[1.75rem] border-slate-200 bg-background p-0 shadow-[0_30px_80px_-40px_rgba(16,23,34,0.25)]",
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
                "border border-slate-200 bg-slate-50/80 text-left transition hover:bg-white",
                isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-2xl px-4 py-4",
              )}
              onClick={() => setCalendarOpen(true)}
            >
              <CalendarDays className="h-4 w-4 text-[#ff4d43]" />
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Date de retour</p>
              <p className={cn("mt-1 font-semibold text-slate-950", isCompact ? "text-[0.9rem]" : "text-sm")}>
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
