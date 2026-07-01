import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Seo } from "@/components/seo";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Filter,
  Grid3X3,
  Heart,
  Rows3,
  Settings2,
  SlidersHorizontal,
  Users,
  Wind,
} from "lucide-react";
import { CATEGORY_TRANSLATIONS, cn, FUEL_TRANSLATIONS, formatPrice } from "@/lib/utils";
import { fetchAgencies } from "@/lib/fleet-catalog";
import { formatAvailabilityDate, getAvailabilityCopy } from "@/lib/car-availability";

const ALL_VALUE = "all";

const categoryOptions = [
  { value: "CITADINE", label: "Citadine" },
  { value: "SUV", label: "SUV" },
  { value: "BERLINE", label: "Berline" },
  { value: "LUXE", label: "Luxe" },
];

const transmissionOptions = [
  { value: "MANUELLE", label: "Manuelle" },
  { value: "AUTOMATIQUE", label: "Automatique" },
];

const fuelOptions = [
  { value: "ESSENCE", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRIDE", label: "Hybride" },
  { value: "ELECTRIQUE", label: "Electrique" },
];

function getSearchParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

function buildVehicleKey(brand: string, model: string) {
  return `${brand}::${model}`;
}

function parseVehicleKey(value: string) {
  const [brand = "", model = ""] = value.split("::");
  return { brand, model };
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function FilterCheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-600">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
      <span>{label}</span>
    </label>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={cn(centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl")}>
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#FF4B43]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">{description}</p>
    </div>
  );
}

function CatalogueCarRow({ car }: { car: any }) {
  const transmissionLabel = car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle";
  const fuelLabel = FUEL_TRANSLATIONS[car.fuelType] || car.fuelType;
  const agency = car.agency;
  const ratingSummary = car.ratingSummary;
  const availabilityCopy = getAvailabilityCopy(car);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_42px_-32px_rgba(15,23,42,0.14)]">
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <Link href={`/voitures/${car.id}`} className="block overflow-hidden bg-slate-100">
          {car.mainImageUrl ? (
            <img src={car.mainImageUrl} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-slate-400">
              <CarFront className="h-10 w-10" />
            </div>
          )}
        </Link>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7C8CB5]">
                {CATEGORY_TRANSLATIONS[car.category] || car.category}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {car.brand} {car.model}
              </h3>
              {ratingSummary?.count > 0 && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  {ratingSummary.average}/5 - {ratingSummary.count} avis
                </p>
              )}
            </div>
            <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:text-[#FF4B43]">
              <Heart className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-400" />
              {transmissionLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-slate-400" />
              {fuelLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              {car.seats} places
            </span>
            <span className="inline-flex items-center gap-2">
              <Wind className="h-4 w-4 text-slate-400" />
              Climatisation
            </span>
          </div>

          <div className="inline-flex rounded-full bg-[#F4F7FF] px-3 py-1 text-xs font-medium text-[#7C8CB5]">
            {agency?.name || car.city || "Casablanca"}
          </div>
        </div>

          <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
            <div className="text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">À partir de</p>
              <p className="mt-1 text-2xl font-semibold text-[#FF4B43] sm:text-3xl">{formatPrice(car.dailyPrice)}</p>
              <p className="text-xs text-slate-400">/ jour</p>
              <div
                className={`mt-3 inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold ${
                  availabilityCopy.isBlocked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {availabilityCopy.isBlocked && availabilityCopy.availableFrom
                  ? `Disponible à partir du ${formatAvailabilityDate(availabilityCopy.availableFrom)}`
                  : availabilityCopy.label}
              </div>
            </div>

          <Button asChild className="w-full rounded-full bg-[#FF4B43] text-white hover:bg-[#f03b33]">
            <Link href={`/voitures/${car.id}?reserve=1`}>Réserver maintenant</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Cars() {
  const [location, setLocation] = useLocation();
  const initialParams = getSearchParams();
  const initialBrand = initialParams.get("brand") || "";
  const initialModel = initialParams.get("model") || "";
  const initialAgencyId = initialParams.get("agencyId") || ALL_VALUE;

  const [vehicleKey, setVehicleKey] = useState(
    initialBrand || initialModel ? buildVehicleKey(initialBrand, initialModel) : ALL_VALUE,
  );
  const [agencyId, setAgencyId] = useState(initialAgencyId);
  const [category, setCategory] = useState(initialParams.get("category") || ALL_VALUE);
  const [city, setCity] = useState(initialParams.get("city") || "");
  const [startDate, setStartDate] = useState(initialParams.get("startDate") || "");
  const [returnDate, setReturnDate] = useState(initialParams.get("returnDate") || "");
  const [sortBy, setSortBy] = useState(initialParams.get("sortBy") || "year_desc");
  const [transmission, setTransmission] = useState(initialParams.get("transmission") || ALL_VALUE);
  const [fuelType, setFuelType] = useState(initialParams.get("fuelType") || ALL_VALUE);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const next = getSearchParams();
    const nextBrand = next.get("brand") || "";
    const nextModel = next.get("model") || "";

    setVehicleKey(nextBrand || nextModel ? buildVehicleKey(nextBrand, nextModel) : ALL_VALUE);
    setAgencyId(next.get("agencyId") || ALL_VALUE);
    setCategory(next.get("category") || ALL_VALUE);
    setCity(next.get("city") || "");
    setStartDate(next.get("startDate") || "");
    setReturnDate(next.get("returnDate") || "");
    setSortBy(next.get("sortBy") || "year_desc");
    setTransmission(next.get("transmission") || ALL_VALUE);
    setFuelType(next.get("fuelType") || ALL_VALUE);
  }, [location]);

  const { data: allCarsData } = useListCars({ limit: 200, sortBy: "year_desc" });
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: fetchAgencies,
  });

  useEffect(() => {
    if (agencyId !== ALL_VALUE || !city || agencies.length === 0) return;
    const matchedAgency = agencies.find((agency) => agency.city.toLowerCase() === city.toLowerCase());
    if (matchedAgency) {
      setAgencyId(String(matchedAgency.id));
    }
  }, [agencies, agencyId, city]);

  const vehicleOptions = useMemo(() => {
    const seen = new Set<string>();

    return (allCarsData?.cars ?? [])
      .map((car) => ({
        key: buildVehicleKey(car.brand, car.model),
        label: `${car.brand} ${car.model}`,
        brand: car.brand,
        model: car.model,
      }))
      .filter((item) => {
        if (seen.has(item.key)) return false;
        seen.add(item.key);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [allCarsData]);

  const selectedVehicle = useMemo(
    () => vehicleOptions.find((item) => item.key === vehicleKey) ?? null,
    [vehicleKey, vehicleOptions],
  );

  const carQueryParams = {
    brand: selectedVehicle?.brand || undefined,
    model: selectedVehicle?.model || undefined,
    agencyId: agencyId !== ALL_VALUE ? agencyId : undefined,
    category: category !== ALL_VALUE ? category : undefined,
    city: city || undefined,
    transmission: transmission !== ALL_VALUE ? transmission : undefined,
    fuelType: fuelType !== ALL_VALUE ? fuelType : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
    sortBy,
    limit: 50,
    startDate: startDate || undefined,
    returnDate: returnDate || undefined,
  } as any;

  const { data, isLoading } = useListCars(carQueryParams);

  const applyFilters = (overrides?: Partial<{
    vehicleKey: string;
    agencyId: string;
    category: string;
    city: string;
    startDate: string;
    returnDate: string;
    sortBy: string;
    transmission: string;
    fuelType: string;
  }>) => {
    const nextVehicleKey = overrides?.vehicleKey ?? vehicleKey;
    const nextAgencyId = overrides?.agencyId ?? agencyId;
    const nextCategory = overrides?.category ?? category;
    const nextCity = overrides?.city ?? city;
    const nextStartDate = overrides?.startDate ?? startDate;
    const nextReturnDate = overrides?.returnDate ?? returnDate;
    const nextSortBy = overrides?.sortBy ?? sortBy;
    const nextTransmission = overrides?.transmission ?? transmission;
    const nextFuelType = overrides?.fuelType ?? fuelType;

    const next = new URLSearchParams();
    const nextVehicle = nextVehicleKey !== ALL_VALUE ? parseVehicleKey(nextVehicleKey) : { brand: "", model: "" };
    const nextAgency = nextAgencyId !== ALL_VALUE ? agencies.find((agency) => String(agency.id) === String(nextAgencyId)) : null;

    if (nextVehicle.brand) next.set("brand", nextVehicle.brand);
    if (nextVehicle.model) next.set("model", nextVehicle.model);
    if (nextAgencyId !== ALL_VALUE) next.set("agencyId", nextAgencyId);
    if (nextCategory !== ALL_VALUE) next.set("category", nextCategory);
    if (nextAgency?.city) next.set("city", nextAgency.city);
    else if (nextCity) next.set("city", nextCity);
    if (nextStartDate) next.set("startDate", nextStartDate);
    if (nextReturnDate) next.set("returnDate", nextReturnDate);
    if (nextSortBy) next.set("sortBy", nextSortBy);
    if (nextTransmission !== ALL_VALUE) next.set("transmission", nextTransmission);
    if (nextFuelType !== ALL_VALUE) next.set("fuelType", nextFuelType);

    setIsFilterOpen(false);
    setLocation(`/voitures${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const handleReset = () => {
    setVehicleKey(ALL_VALUE);
    setAgencyId(ALL_VALUE);
    setCategory(ALL_VALUE);
    setCity("");
    setStartDate("");
    setReturnDate("");
    setSortBy("year_desc");
    setTransmission(ALL_VALUE);
    setFuelType(ALL_VALUE);
    setPriceRange([0, 2000]);
    setIsFilterOpen(false);
    setLocation("/voitures");
  };

  const FilterPanel = () => (
    <div className="space-y-5 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.14)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#FF4B43]" />
          <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
        </div>
        <button type="button" onClick={handleReset} className="text-xs font-medium text-[#FF4B43]">
          Effacer tout
        </button>
      </div>

      <FilterSection title="Agence">
        <Select
          value={agencyId}
          onValueChange={(value) => {
            setAgencyId(value);
            const selectedAgency = agencies.find((agency) => String(agency.id) === value);
            setCity(value === ALL_VALUE ? "" : selectedAgency?.city || "");
          }}
        >
          <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white">
            <SelectValue placeholder="Choisir une agence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Toutes les agences</SelectItem>
            {agencies.length > 0 ? agencies.map((agency) => (
              <SelectItem key={agency.id} value={String(agency.id)}>
                {agency.name} - {agency.city}
              </SelectItem>
            )) : (
              <SelectItem value="no-agency" disabled>
                Aucune agence disponible
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Intervalle">
        <DateRangeCalendar
          label="Disponibilité"
          startDate={startDate}
          returnDate={returnDate}
          onChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
            setStartDate(nextStartDate);
            setReturnDate(nextReturnDate);
          }}
          minimal
          compact
        />
      </FilterSection>

      <FilterSection title="Modèle de voiture">
        <Select value={vehicleKey} onValueChange={setVehicleKey}>
          <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white">
            <SelectValue placeholder="Choisir un modèle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les modèles</SelectItem>
            {vehicleOptions.map((item) => (
              <SelectItem key={item.key} value={item.key}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Catégorie">
        <div className="grid gap-3">
          {categoryOptions.map((item) => (
            <FilterCheckRow
              key={item.value}
              checked={category === item.value}
              label={item.label}
              onChange={(checked) => setCategory(checked ? item.value : ALL_VALUE)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Boîte de vitesse">
        <div className="grid gap-3">
          {transmissionOptions.map((item) => (
            <FilterCheckRow
              key={item.value}
              checked={transmission === item.value}
              label={item.label}
              onChange={(checked) => setTransmission(checked ? item.value : ALL_VALUE)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Carburant">
        <div className="grid gap-3">
          {fuelOptions.map((item) => (
            <FilterCheckRow
              key={item.value}
              checked={fuelType === item.value}
              label={item.label}
              onChange={(checked) => setFuelType(checked ? item.value : ALL_VALUE)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget par jour">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{priceRange[0]} MAD</span>
          <span>{priceRange[1] >= 2000 ? "2000+ MAD" : `${priceRange[1]} MAD`}</span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={2000} step={50} />
      </FilterSection>

      <div className="grid gap-3">
        <Button className="w-full rounded-full bg-[#FF4B43] text-white hover:bg-[#f03b33]" onClick={() => applyFilters()}>
          Appliquer les filtres
        </Button>
        <Button variant="outline" className="w-full rounded-full border-slate-200 bg-white" onClick={handleReset}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[radial-gradient(circle_at_top,rgba(255,248,246,0.95),rgba(255,255,255,1)_42%)]">
      <Seo
        title="Véhicules"
        description="Parcourez les véhicules disponibles, comparez les prix et lancez une réservation en quelques clics."
        canonical="https://demo-locationauto.shonenx.shop/voitures"
        image="/opengraph.jpg"
        type="website"
      />

      <section className="container mx-auto px-4 py-10 lg:py-14" id="catalogue-list">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Catalogue"
            title="Tous nos véhicules disponibles"
            description="Affinez les résultats avec les bons filtres, sans saisie libre pour le modèle."
          />

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:w-auto">
            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value);
              applyFilters({ sortBy: value });
            }}>
              <SelectTrigger className="w-full rounded-full border-slate-200 bg-white sm:min-w-[240px]">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year_desc">Prix : du plus bas au plus eleve</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix decroissant</SelectItem>
                <SelectItem value="newest">Les plus recentes</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 md:flex">
              <button type="button" className="rounded-full bg-[#FFF0EF] p-2 text-[#FF4B43]">
                <Rows3 className="h-4 w-4" />
              </button>
              <button type="button" className="rounded-full p-2 text-slate-400">
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full rounded-full border-slate-200 bg-white xl:hidden sm:w-auto">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw,420px)] overflow-y-auto bg-[#FAFBFF]">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
                    <Skeleton className="h-[220px] w-full rounded-none" />
                    <div className="space-y-4 p-5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-7 w-48" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="mt-6 h-11 w-full rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : data?.cars && data.cars.length > 0 ? (
              data.cars.map((car) => <CatalogueCarRow key={car.id} car={car} />)
            ) : (
              <Empty className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CarFront />
                  </EmptyMedia>
                  <EmptyTitle>Aucun véhicule pour ces filtres</EmptyTitle>
                  <EmptyDescription>
                    Changez l'agence, l'intervalle, le modèle ou les options du catalogue pour retrouver des disponibilités.
                  </EmptyDescription>
                </EmptyHeader>
                <Button className="rounded-full bg-[#FF4B43] text-white hover:bg-[#f03b33]" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </Empty>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
