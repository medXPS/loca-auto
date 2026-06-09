import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

const sortOptions = [
  { value: "year_desc", label: "Option recommandée" },
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
    <section className="space-y-3 rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
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
            className="rounded-2xl pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Lieu">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="rounded-2xl">
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
          <SelectTrigger className="rounded-2xl">
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

      <FilterGroup title="Boîte de vitesses">
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="rounded-2xl">
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
          <SelectTrigger className="rounded-2xl">
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
        <Slider
          defaultValue={[0, 2000]}
          max={2000}
          step={50}
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </FilterGroup>

      <FilterGroup title="Options">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 text-sm font-medium">
          <Checkbox checked={availableOnly} onCheckedChange={(checked) => setAvailableOnly(checked === true)} />
          Disponible seulement
        </label>
      </FilterGroup>

      <Button variant="outline" className="w-full rounded-2xl border-border/70 bg-white" onClick={handleReset}>
        Réinitialiser les filtres
      </Button>
    </div>
  );

  const resultCount = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <CarFront className="h-3.5 w-3.5" />
          Résultats de recherche
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Voitures disponibles</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Comparez les véhicules disponibles selon votre ville, votre période, votre budget et vos critères de confort.
            </p>
          </div>

          <Card className="surface-panel">
            <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Lieu</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{selectedCity}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Période</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{dateLabel}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Résultats</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{resultCount} véhicules</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
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
                    ? "border-primary/20 bg-primary text-white shadow-[0_16px_30px_-18px_hsl(var(--primary)/0.75)]"
                    : "border-border/70 bg-white text-muted-foreground hover:border-primary/20 hover:text-primary",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Card className="overflow-hidden border-border/70 bg-[linear-gradient(180deg,hsl(214_90%_48%),hsl(223_45%_18%))] text-white shadow-[0_28px_70px_-34px_hsl(var(--primary)/0.7)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/65">Carte rapide</p>
                    <p className="text-lg font-extrabold">Explorez les offres</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <MapPin className="h-6 w-6" />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full rounded-full bg-white text-primary hover:bg-white/95"
                  onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Voir les résultats
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="surface-panel">
              <CardContent className="p-0">
                <div className="border-b border-border/70 px-5 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </h2>
                </div>
                <div className="p-4">
                  <FilterContent />
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4 xl:hidden">
            <span className="text-sm font-medium text-muted-foreground">{resultCount} véhicules trouvés</span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/70 bg-white">
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

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-border/70 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trier par</p>
              <p className="text-sm font-semibold text-foreground">{resultCount} offres disponibles</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="min-w-[220px] rounded-full">
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
          </div>

          <div id="results" className="grid grid-cols-1 gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[250px_minmax(0,1fr)_230px]">
                    <Skeleton className="h-[240px] w-full rounded-none lg:h-full" />
                    <div className="space-y-4 p-5">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="space-y-3 border-t border-border/70 p-5 lg:border-l lg:border-t-0">
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
              <Empty className="border border-dashed border-border/70 bg-white py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CarFront />
                  </EmptyMedia>
                  <EmptyTitle>Aucune voiture trouvée</EmptyTitle>
                  <EmptyDescription>Modifiez vos critères pour voir plus d’offres.</EmptyDescription>
                </EmptyHeader>
                <Button className="rounded-full" onClick={handleReset}>
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
