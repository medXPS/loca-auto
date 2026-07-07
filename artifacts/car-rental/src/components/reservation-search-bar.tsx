import { useState } from "react";
import { CalendarDays, CarFront, MapPin, Plane, Search, Star } from "lucide-react";
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

const summaryAvatars = [
  { initials: "AM", bg: "from-[#ff8b82] to-[#ff4d43]" },
  { initials: "SK", bg: "from-[#3aa0ff] to-[#1371de]" },
  { initials: "YR", bg: "from-[#f8c15d] to-[#ef8b2f]" },
  { initials: "NA", bg: "from-[#2fd0b2] to-[#177f72]" },
];

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
          "overflow-hidden border border-slate-200 bg-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl",
          isCompact ? "rounded-[1.55rem]" : "rounded-[2rem]",
        )}
      >
        <div className="border-b border-slate-200/80 bg-white/95">
          <div className="grid grid-cols-2">
            <button
              type="button"
              className="flex h-14 items-center justify-center gap-2 border-b-2 border-[#ff4d43] text-sm font-semibold text-[#ff4d43]"
            >
              <CarFront className="h-4 w-4" />
              Location voiture
            </button>
            <button
              type="button"
              className="flex h-14 items-center justify-center gap-2 border-b-2 border-transparent text-sm font-semibold text-slate-500"
            >
              <Plane className="h-4 w-4" />
              Transfert aéroport
            </button>
          </div>
        </div>

        <div className={cn("grid gap-4", isCompact ? "p-4" : "p-5 lg:p-6")}>
          {title && (
            <div className="space-y-1 px-1 pt-0.5">
              <p className="text-[1.02rem] font-extrabold tracking-tight text-slate-950 sm:text-[1.08rem]">
                {title}
              </p>
              {subtitle && <p className="text-sm leading-6 text-slate-500">{subtitle}</p>}
            </div>
          )}

          <div
            className={cn(
              "border border-slate-200 bg-slate-50/80 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.2)]",
              isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-[1.5rem] px-4 py-4",
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
                    "min-h-[4.8rem] border border-slate-200 bg-slate-50/80 text-left transition hover:border-slate-300 hover:bg-white",
                    isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-[1.5rem] px-4 py-4",
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
                  "max-h-[85vh] overflow-hidden rounded-[1.75rem] border-slate-200 bg-background p-0 shadow-[0_30px_80px_-40px_rgba(16,23,34,0.25)]",
                  isCompact ? "w-[min(92vw,360px)]" : "w-[min(92vw,440px)]",
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
                "min-h-[4.8rem] border border-slate-200 bg-slate-50/80 text-left transition hover:border-slate-300 hover:bg-white",
                isCompact ? "rounded-[1.15rem] px-3.5 py-3.5" : "rounded-[1.5rem] px-4 py-4",
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
              "rounded-[1.4rem] bg-[#F04B45] px-6 font-medium text-white shadow-[0_18px_35px_-22px_rgba(240,75,69,0.65)] hover:bg-[#e63f39]",
              isCompact ? "h-12 text-[0.95rem]" : "h-14 text-base",
            )}
          >
            <Search className="h-4 w-4" />
            Rechercher
          </Button>

          <p className="text-center text-[11px] font-medium text-slate-500">
            Annulation gratuite jusqu&apos;à 48h avant
          </p>

          {!isCompact && (
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex -space-x-2">
                    {summaryAvatars.map((avatar) => (
                      <div
                        key={avatar.initials}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${avatar.bg} text-[10px] font-extrabold text-white shadow-sm`}
                      >
                        {avatar.initials}
                      </div>
                    ))}
                  </div>

                  <p className="min-w-0 text-sm text-slate-700">
                    <span className="font-semibold text-slate-950">+1200</span> clients satisfaits
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-slate-950">4,8/5</span>
                  <span className="flex items-center gap-0.5 text-amber-400" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
