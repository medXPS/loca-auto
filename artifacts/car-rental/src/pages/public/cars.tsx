import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CarFront,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

const sortOptions = [
  { value: "year_desc", label: "Recommandé" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "newest", label: "Les plus récentes" },
];

const categoryOptions = [
  { value: "all", label: "Tout" },
  { value: "CITADINE", label: "Citadine" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
  { value: "LUXE", label: "Luxe" },
  { value: "UTILITAIRE", label: "Utilitaire" },
];

const categoryChips = [
  { value: "all", label: "Toutes" },
  { value: "CITADINE", label: "Petite voiture" },
  { value: "BERLINE", label: "Voiture moyenne" },
  { value: "SUV", label: "SUV" },
  { value: "LUXE", label: "Luxe" },
  { value: "UTILITAIRE", label: "Utilitaire" },
];

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-black/8 bg-white/86 p-4 shadow-[0_16px_30px_-24px_rgba(16,23,34,0.15)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export default function Cars() {
  const params = getSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [city, setCity] = useState(params.get("city") || params.get("ville") || "");
  const [category, setCategory] = useState<string>(params.get("categorie") || "all");
  const [transmission, setTransmission] = useState<string>(params.get("transmission") || "all");
  const [fuelType, setFuelType] = useState<string>(params.get("fuelType") || "all");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "year_desc");
  const [availableOnly, setAvailableOnly] = useState(params.get("available") === "true");
  const [startDate, setStartDate] = useState(params.get("startDate") || "");
  const [returnDate, setReturnDate] = useState(params.get("returnDate") || "");

  const { data: citiesSource } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });

  useEffect(() => {
    const p = getSearchParams();
    setSearch(p.get("search") || "");
    setCity(p.get("city") || p.get("ville") || "");
    setCategory(p.get("categorie") || "all");
    setTransmission(p.get("transmission") || "all");
    setFuelType(p.get("fuelType") || "all");
    setSortBy(p.get("sortBy") || "year_desc");
    setAvailableOnly(p.get("available") === "true");
    setStartDate(p.get("startDate") || "");
    setReturnDate(p.get("returnDate") || "");
  }, []);

  const agencyCities = useMemo(() => {
    const cities = new Set<string>();
    for (const car of citiesSource?.cars ?? []) {
      if (car.city?.trim()) {
        cities.add(car.city.trim());
      }
    }

    if (cities.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fès"].forEach((item) => cities.add(item));
    }

    return Array.from(cities).sort((a, b) => a.localeCompare(b, "fr"));
  }, [citiesSource]);

  const { data, isLoading } = useListCars({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    transmission: transmission !== "all" ? transmission : undefined,
    fuelType: fuelType !== "all" ? fuelType : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
    city: city || undefined,
    available: availableOnly || undefined,
    sortBy,
    limit: 50,
  } as any);

  const selectedCity = city || "Toutes les villes";
  const dateLabel =
    startDate && returnDate
      ? `${startDate} → ${returnDate}`
      : startDate
        ? `${startDate} → retour à choisir`
        : "Aucune période sélectionnée";

  const handleReset = () => {
    setSearch("");
    setCity("");
    setCategory("all");
    setTransmission("all");
    setFuelType("all");
    setPriceRange([0, 2000]);
    setSortBy("year_desc");
    setAvailableOnly(false);
    setStartDate("");
    setReturnDate("");
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <FilterGroup title="Recherche">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Marque, modèle ou ville"
            className="rounded-2xl border-black/8 bg-white/92 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Ville">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="rounded-2xl border-black/8 bg-white/92">
            <SelectValue placeholder="Choisir une ville" />
          </SelectTrigger>
          <SelectContent>
            {agencyCities.map((agencyCity) => (
              <SelectItem key={agencyCity} value={agencyCity}>
                {agencyCity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Période">
        <DateRangeCalendar
          label="Dates de location"
          startDate={startDate}
          returnDate={returnDate}
          onChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
            setStartDate(nextStartDate);
            setReturnDate(nextReturnDate);
          }}
          compact
        />
      </FilterGroup>

      <FilterGroup title="Catégorie">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-2xl border-black/8 bg-white/92">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Boîte">
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="rounded-2xl border-black/8 bg-white/92">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="MANUELLE">Manuelle</SelectItem>
            <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Carburant">
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="rounded-2xl border-black/8 bg-white/92">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="DIESEL">Diesel</SelectItem>
            <SelectItem value="ESSENCE">Essence</SelectItem>
            <SelectItem value="HYBRIDE">Hybride</SelectItem>
            <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Prix par jour">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-muted-foreground">Budget</span>
          <span className="font-semibold text-foreground">
            {priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]}
          </span>
        </div>
        <Slider defaultValue={[0, 2000]} max={2000} step={50} value={priceRange} onValueChange={setPriceRange} />
      </FilterGroup>

      <FilterGroup title="Disponibilité">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/8 bg-[#faf7f2] px-4 py-3 text-sm font-medium">
          <Checkbox checked={availableOnly} onCheckedChange={(checked) => setAvailableOnly(checked === true)} />
          Disponible seulement
        </label>
      </FilterGroup>

      <Button variant="outline" className="w-full rounded-2xl border-black/8 bg-white/86" onClick={handleReset}>
        Réinitialiser les filtres
      </Button>
    </div>
  );

  const resultCount = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-6 py-8 text-white md:px-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
              <CarFront className="h-3.5 w-3.5 text-primary" />
              Catalogue commercial
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">Voitures disponibles</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              Comparez les véhicules selon la ville, la période et le budget avec une présentation plus nette et plus convaincante.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
              <p className="text-[11px] text-white/56 marketing-kicker">Ville</p>
              <p className="mt-2 text-sm font-semibold text-white">{selectedCity}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
              <p className="text-[11px] text-white/56 marketing-kicker">Période</p>
              <p className="mt-2 text-sm font-semibold text-white">{dateLabel}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
              <p className="text-[11px] text-white/56 marketing-kicker">Résultats</p>
              <p className="mt-2 text-sm font-semibold text-white">{resultCount} véhicules</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {categoryChips.map((chip) => {
          const active = category === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setCategory(chip.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                active
                  ? "border-transparent bg-[#101722] text-white shadow-[0_18px_35px_-24px_rgba(16,23,34,0.75)]"
                  : "border-black/8 bg-white/82 text-muted-foreground hover:border-primary/20 hover:text-primary",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Card className="overflow-hidden marketing-dark-panel text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-white/56 marketing-kicker">Accélérer la décision</p>
                    <p className="text-lg font-semibold text-white">Un catalogue plus lisible</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-sm leading-7 text-white/72">
                    Les prix, la disponibilité et la réservation restent visibles sur chaque carte pour éviter les frictions.
                  </p>
                </div>

                <div className="mt-5 grid gap-2 text-sm text-white/72">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Tarifs plus lisibles
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Recherche locale rapide
                  </div>
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full rounded-full marketing-accent-button"
                  onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Voir les résultats
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="marketing-soft-panel">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2 px-1">
                  <Filter className="h-4 w-4" />
                  <h2 className="text-lg font-semibold text-foreground">Filtres</h2>
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4 xl:hidden">
            <span className="text-sm font-medium text-muted-foreground">{resultCount} véhicules trouvés</span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full border-black/8 bg-white/86">
                  <Filter className="h-4 w-4" />
                  Filtrer
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw,420px)]">
                <SheetHeader>
                  <SheetTitle>Filtres de recherche</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-black/8 bg-white/88 px-4 py-3 shadow-[0_16px_30px_-24px_rgba(16,23,34,0.15)]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tri</p>
              <p className="text-sm font-semibold text-foreground">{resultCount} offres disponibles</p>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="min-w-[220px] rounded-full border-black/8 bg-white">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div id="results" className="grid grid-cols-1 gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)_245px]">
                    <Skeleton className="h-[240px] w-full rounded-none lg:h-full" />
                    <div className="space-y-4 p-5">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="space-y-3 border-t border-black/8 p-5 lg:border-l lg:border-t-0">
                      <Skeleton className="h-8 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : data?.cars && data.cars.length > 0 ? (
              data.cars.map((car) => <CarCard key={car.id} car={car} variant="compact" />)
            ) : (
              <Empty className="border border-dashed border-black/10 bg-white/88 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CarFront />
                  </EmptyMedia>
                  <EmptyTitle>Aucune voiture trouvée</EmptyTitle>
                  <EmptyDescription>Modifiez vos critères pour afficher plus d'offres.</EmptyDescription>
                </EmptyHeader>
                <Button className="rounded-full marketing-accent-button" onClick={handleReset}>
                  Réinitialiser les filtres
                </Button>
              </Empty>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
