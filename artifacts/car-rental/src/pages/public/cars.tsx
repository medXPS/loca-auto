import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { formatDisplayDate } from "@workspace/api-client-react/availability";
import { CarCard } from "@/components/car-card";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Seo } from "@/components/seo";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CircleCheckBig,
  Filter,
  MapPin,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { CATEGORY_TRANSLATIONS, cn } from "@/lib/utils";

const ALL_VALUE = "all";

const transmissionOptions = [
  { value: ALL_VALUE, label: "Toutes" },
  { value: "MANUELLE", label: "Manuelle" },
  { value: "AUTOMATIQUE", label: "Automatique" },
];

const fuelOptions = [
  { value: ALL_VALUE, label: "Tous" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ESSENCE", label: "Essence" },
  { value: "HYBRIDE", label: "Hybride" },
  { value: "ELECTRIQUE", label: "Electrique" },
];

const trustItems = [
  { icon: ShieldCheck, title: "Assurance incluse", description: "Couverture complete des la prise en charge." },
  { icon: BadgeCheck, title: "Prix transparents", description: "Aucun frais cache, prix clairs et justes." },
  { icon: MessageCircle, title: "Support WhatsApp", description: "Reponse rapide pour toutes vos questions." },
  { icon: Sparkles, title: "Reservation rapide", description: "Processus simple et 100% en ligne." },
  { icon: CircleCheckBig, title: "Agence verifiee", description: "Agence locale fiable et certifiee." },
  { icon: Star, title: "Avis clients", description: "4,8/5 sur +1200 clients satisfaits." },
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

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-[1.25rem] border border-white/10 bg-slate-950/80 p-4 text-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.5)]">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{title}</h3>
      {children}
    </section>
  );
}

function TrustCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-[0_16px_35px_-28px_rgba(16,23,34,0.12)]">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function HeroPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/55">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-slate-900 md:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p>
    </div>
  );
}

export default function Cars() {
  const [location, setLocation] = useLocation();
  const initialParams = getSearchParams();
  const initialBrand = initialParams.get("brand") || "";
  const initialModel = initialParams.get("model") || "";

  const [vehicleKey, setVehicleKey] = useState(
    initialBrand || initialModel ? buildVehicleKey(initialBrand, initialModel) : ALL_VALUE,
  );
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
    setCategory(next.get("category") || ALL_VALUE);
    setCity(next.get("city") || "");
    setStartDate(next.get("startDate") || "");
    setReturnDate(next.get("returnDate") || "");
    setSortBy(next.get("sortBy") || "year_desc");
    setTransmission(next.get("transmission") || ALL_VALUE);
    setFuelType(next.get("fuelType") || ALL_VALUE);
  }, [location]);

  const { data: allCarsData } = useListCars({ limit: 200, sortBy: "year_desc" });

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

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of allCarsData?.cars ?? []) {
      if (car.city?.trim()) {
        values.add(car.city.trim());
      }
    }

    if (values.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fes"].forEach((item) => values.add(item));
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
  }, [allCarsData]);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();

    for (const car of allCarsData?.cars ?? []) {
      const value = car.category?.trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    return ["all", "CITADINE", "BERLINE", "SUV", "LUXE"].map((value) => ({
      value,
      label: value === "all" ? "Tous" : CATEGORY_TRANSLATIONS[value] || value,
      count: value === "all" ? allCarsData?.total || 0 : counts.get(value) || 0,
    }));
  }, [allCarsData]);

  const featuredCars = (allCarsData?.cars ?? []).slice(0, 3);
  const totalLabel = `${data?.total || 0} vehicules`;

  const intervalLabel =
    startDate && returnDate
      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(returnDate)}`
      : startDate
        ? `Depart ${formatDisplayDate(startDate)}`
        : "Dates flexibles";

  const activeFilterPills = [
    city ? { label: "Agence", value: city } : null,
    selectedVehicle ? { label: "Modele", value: selectedVehicle.label } : null,
    (startDate || returnDate) ? { label: "Intervalle", value: intervalLabel } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const applyFilters = (overrides?: Partial<{
    vehicleKey: string;
    category: string;
    city: string;
    startDate: string;
    returnDate: string;
    sortBy: string;
    transmission: string;
    fuelType: string;
  }>) => {
    const nextVehicleKey = overrides?.vehicleKey ?? vehicleKey;
    const nextCategory = overrides?.category ?? category;
    const nextCity = overrides?.city ?? city;
    const nextStartDate = overrides?.startDate ?? startDate;
    const nextReturnDate = overrides?.returnDate ?? returnDate;
    const nextSortBy = overrides?.sortBy ?? sortBy;
    const nextTransmission = overrides?.transmission ?? transmission;
    const nextFuelType = overrides?.fuelType ?? fuelType;

    const next = new URLSearchParams();
    const nextVehicle = nextVehicleKey !== ALL_VALUE ? parseVehicleKey(nextVehicleKey) : { brand: "", model: "" };

    if (nextVehicle.brand) next.set("brand", nextVehicle.brand);
    if (nextVehicle.model) next.set("model", nextVehicle.model);
    if (nextCategory !== ALL_VALUE) next.set("category", nextCategory);
    if (nextCity) next.set("city", nextCity);
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

  const FilterContent = () => (
    <div className="space-y-4">
      <FilterGroup title="Agence">
        <Select value={city || ALL_VALUE} onValueChange={(value) => setCity(value === ALL_VALUE ? "" : value)}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Choisir une agence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Toutes les agences</SelectItem>
            {cities.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Modele de voiture">
        <Select value={vehicleKey} onValueChange={setVehicleKey}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Choisir un modele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les modeles</SelectItem>
            {vehicleOptions.map((item) => (
              <SelectItem key={item.key} value={item.key}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Intervalle">
        <DateRangeCalendar
          label="Disponibilite"
          startDate={startDate}
          returnDate={returnDate}
          onChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
            setStartDate(nextStartDate);
            setReturnDate(nextReturnDate);
          }}
          compact
        />
      </FilterGroup>

      <FilterGroup title="Prix">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Budget</span>
          <span className="font-semibold text-white">
            {priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]} MAD
          </span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={2000} step={50} />
      </FilterGroup>

      <FilterGroup title="Transmission">
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Transmission" />
          </SelectTrigger>
          <SelectContent>
            {transmissionOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Carburant">
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Carburant" />
          </SelectTrigger>
          <SelectContent>
            {fuelOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <div className="grid gap-3">
        <Button className="w-full rounded-2xl bg-[#F04B45] text-white hover:bg-[#e63f39]" onClick={() => applyFilters()}>
          Appliquer les filtres
        </Button>
        <Button variant="outline" className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleReset}>
          Reinitialiser
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.5rem] border-0 bg-[linear-gradient(180deg,rgba(246,190,140,0.42),rgba(16,23,34,0.88))] text-white shadow-[0_22px_60px_-36px_rgba(16,23,34,0.45)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xl font-semibold">Roulez en toute serenite au Maroc</h4>
            <p className="mt-2 text-sm leading-6 text-white/78">Assurance, assistance 24/7 et vehicules verifies.</p>
          </div>
          <Button asChild className="w-full rounded-full bg-[#F04B45] text-white hover:bg-[#e63f39]">
            <Link href="/contact">
              En savoir plus
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col bg-[radial-gradient(circle_at_top,rgba(244,244,245,0.9),rgba(255,255,255,1)_42%)]">
      <Seo
        title="Vehicules"
        description="Parcourez les vehicules disponibles, comparez les prix et lancez une reservation en quelques clics."
        canonical="https://demo-locationauto.shonenx.shop/voitures"
        image="/opengraph.jpg"
        type="website"
      />

      <section className="container mx-auto px-4 pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-slate-950 text-white shadow-[0_28px_70px_-40px_rgba(16,23,34,0.38)]">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80"
            alt="Voiture premium sur route"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,15,28,0.92),rgba(8,15,28,0.72)_54%,rgba(8,15,28,0.32))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,75,69,0.26),transparent_26%)]" />

          <div className="relative z-10 px-6 py-10 md:px-8 lg:px-10 lg:py-14">
            <div className="max-w-4xl">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/56">Votre voyage, notre passion</p>
              <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-balance md:text-6xl lg:text-7xl">
                Trouvez la bonne voiture
                <span className="block text-[#F04B45]">sans formulaire geant.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
                Cette page reste un vrai catalogue. Les dates, l'agence et le modele se choisissent proprement
                dans les filtres, avec un petit calendrier d'intervalle au lieu d'un gros bloc de reservation.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white px-6 text-slate-950 hover:bg-white/95">
                  <a href="#catalogue-filters">
                    Voir les filtres
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white">
                  <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroPill icon={MapPin} label="Agence" value={city || "Toutes les villes"} />
                <HeroPill icon={CalendarDays} label="Intervalle" value={intervalLabel} />
                <HeroPill icon={CarFront} label="Modele" value={selectedVehicle?.label || "Tous les modeles"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trustItems.map((item) => (
            <TrustCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {featuredCars.length > 0 && (
        <section className="container mx-auto px-4 pb-10 lg:pb-14">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Selection populaire"
              title="Nos voitures les plus demandees"
              description="Une selection plus claire, avec un parcours catalogue qui laisse les filtres a leur vraie place."
            />
            <Link href="/voitures" className="hidden items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 md:inline-flex">
              Voir toutes les offres
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-16 lg:pb-20" id="catalogue-filters">
        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[1.8rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.35)]">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#F04B45]" />
                <h2 className="text-lg font-semibold">Filtres du catalogue</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500">{totalLabel}</span>
                {activeFilterPills.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>

              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full border-border/70 bg-white xl:hidden">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100vw,420px)] overflow-y-auto bg-slate-950 text-white">
                  <SheetHeader>
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-border/70 bg-white px-4 py-3 shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
              <div className="flex flex-wrap gap-2">
                {categoryTabs.map((item) => {
                  const active = category === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setCategory(item.value);
                        applyFilters({ category: item.value });
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        active
                          ? "border-[#F04B45] bg-[#F04B45] text-white"
                          : "border-border/70 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white",
                      )}
                    >
                      {item.label}
                      <span className={cn("ml-2 text-xs", active ? "text-white/82" : "text-slate-400")}>({item.count})</span>
                    </button>
                  );
                })}
              </div>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  applyFilters({ sortBy: value });
                }}
              >
                <SelectTrigger className="min-w-[220px] rounded-full border-border/70">
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year_desc">Recommande</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix decroissant</SelectItem>
                  <SelectItem value="newest">Les plus recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)_230px]">
                      <Skeleton className="h-[240px] w-full rounded-none" />
                      <div className="space-y-4 p-5">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                      <div className="border-t border-border/70 p-5 lg:border-l lg:border-t-0">
                        <Skeleton className="h-8 w-2/3" />
                        <Skeleton className="mt-3 h-11 w-full rounded-full" />
                        <Skeleton className="mt-2 h-11 w-full rounded-full" />
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
                    <EmptyTitle>Aucun vehicule pour le moment</EmptyTitle>
                    <EmptyDescription>
                      Aucun resultat pour ces filtres. Changez l'agence, l'intervalle ou le modele, puis relancez.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button className="rounded-full bg-primary text-primary-foreground" onClick={handleReset}>
                    Reinitialiser
                  </Button>
                </Empty>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
