import { useState } from "react";
import { CalendarDays, MapPin, Search, Route, ArrowLeftRight } from "lucide-react";
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
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
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
      <div className="overflow-hidden rounded-[1.9rem] border border-white/12 bg-white/8 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 pt-4">
          <button
            type="button"
            onClick={() => setTripType("oneway")}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition",
              tripType === "oneway" ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
            )}
          >
            <Route className="h-4 w-4" />
            Aller simple
          </button>
          <button
            type="button"
            onClick={() => setTripType("roundtrip")}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-medium transition",
              tripType === "roundtrip" ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Aller-retour
          </button>
        </div>

        <div className="grid gap-3 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Ville de depart</p>
            <Select value={city || "all"} onValueChange={handleCityChange}>
              <SelectTrigger className="h-auto border-0 bg-transparent px-0 py-1 text-left text-lg font-semibold text-white shadow-none focus:ring-0 [&>svg]:hidden">
                <SelectValue placeholder="Casablanca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-left transition hover:bg-white/12">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Date de depart</p>
                  <p className="mt-1 text-sm font-semibold text-white">{startDate ? formatDisplayDate(startDate) : "Choisir"}</p>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={12} className="w-[min(96vw,960px)] overflow-hidden rounded-[1.75rem] border-border/70 bg-background p-0 shadow-[0_30px_80px_-40px_rgba(16,23,34,0.25)]">
                <DateRangeCalendar label="Calendrier" startDate={startDate} returnDate={returnDate} onChange={onDatesChange} minimal />
              </PopoverContent>
            </Popover>

            <button type="button" className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-left transition hover:bg-white/12" onClick={() => setCalendarOpen(true)}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Date de retour</p>
              <p className="mt-1 text-sm font-semibold text-white">{returnDate ? formatDisplayDate(returnDate) : "Choisir"}</p>
            </button>
          </div>

          <Button type="submit" className="h-14 rounded-full bg-[#F04B45] px-6 text-base font-medium text-white shadow-[0_18px_35px_-22px_rgba(240,75,69,0.65)] hover:bg-[#e63f39]">
            <Search className="h-4 w-4" />
            Rechercher
          </Button>

          <p className="text-center text-xs text-white/55">Reservation en 2 minutes · Aucune carte requise</p>
        </div>
      </div>
    </form>
  );
}
