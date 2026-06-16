import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { ReservationSearchBar } from "@/components/reservation-search-bar";
import { Seo } from "@/components/seo";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, CarFront, Filter, MessageCircle, Search, ShieldCheck, Sparkles, Star, SlidersHorizontal } from "lucide-react";

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

const transmissionOptions = [
  { value: "all", label: "Toutes" },
  { value: "MANUELLE", label: "Manuelle" },
  { value: "AUTOMATIQUE", label: "Automatique" },
];

const fuelOptions = [
  { value: "all", label: "Tous" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ESSENCE", label: "Essence" },
  { value: "HYBRIDE", label: "Hybride" },
  { value: "ELECTRIQUE", label: "Electrique" },
];

const trustItems = [
  { icon: ShieldCheck, title: "Agence verifiee", description: "Un parcours clair, sans surprise, du premier clic a la remise du vehicule." },
  { icon: BadgeCheck, title: "Prix transparents", description: "Les prix restent visibles et faciles a comparer." },
  { icon: MessageCircle, title: "Support WhatsApp", description: "Un contact direct pour verifier un vehicule ou une disponibilite." },
  { icon: Sparkles, title: "Reservation rapide", description: "Le formulaire va droit au but et garde le parcours fluide." },
];

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
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Cars() {
  const [, setLocation] = useLocation();
  const params = getSearchParams();

  const [brand, setBrand] = useState(params.get("brand") || params.get("search") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [startDate, setStartDate] = useState(params.get("startDate") || "");
  const [returnDate, setReturnDate] = useState(params.get("returnDate") || "");
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "year_desc");
  const [transmission, setTransmission] = useState(params.get("transmission") || "all");
  const [fuelType, setFuelType] = useState(params.get("fuelType") || "all");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const next = getSearchParams();
    setBrand(next.get("brand") || next.get("search") || "");
    setCity(next.get("city") || "");
    setStartDate(next.get("startDate") || "");
    setReturnDate(next.get("returnDate") || "");
    setSortBy(next.get("sortBy") || "year_desc");
    setTransmission(next.get("transmission") || "all");
    setFuelType(next.get("fuelType") || "all");
  }, [location]);

  const { data: cityData } = useListCars({ limit: 200, sortBy: "year_desc" });
  const carQueryParams = {
    brand: brand || undefined,
    city: city || undefined,
    transmission: transmission !== "all" ? transmission : undefined,
    fuelType: fuelType !== "all" ? fuelType : undefined,
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
    for (const car of cityData?.cars ?? []) if (car.city?.trim()) values.add(car.city.trim());
    if (values.size === 0) ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fes"].forEach((item) => values.add(item));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
  }, [cityData]);

  const handleSearch = () => {
    const next = new URLSearchParams();
    if (brand) next.set("brand", brand);
    if (city) next.set("city", city);
    if (startDate) next.set("startDate", startDate);
    if (returnDate) next.set("returnDate", returnDate);
    if (sortBy) next.set("sortBy", sortBy);
    if (transmission !== "all") next.set("transmission", transmission);
    if (fuelType !== "all") next.set("fuelType", fuelType);
    setLocation(`/voitures${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const handleReset = () => {
    setBrand(""); setCity(""); setStartDate(""); setReturnDate(""); setSortBy("year_desc"); setTransmission("all"); setFuelType("all"); setPriceRange([0, 2000]);
    setLocation("/voitures");
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <FilterGroup title="Marque">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/45" />
          <Input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Toyota, Dacia, Renault..." className="h-12 rounded-2xl border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/35" />
        </div>
      </FilterGroup>
      <FilterGroup title="Ville">
        <Select value={city || "all"} onValueChange={(value) => setCity(value === "all" ? "" : value)}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Choisir une ville" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            {cities.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Prix">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Budget</span>
          <span className="font-semibold text-white">{priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]}</span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={2000} step={50} />
      </FilterGroup>
      <FilterGroup title="Transmission">
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"><SelectValue placeholder="Transmission" /></SelectTrigger>
          <SelectContent>{transmissionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Carburant">
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white"><SelectValue placeholder="Carburant" /></SelectTrigger>
          <SelectContent>{fuelOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <Button variant="outline" className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleReset}>Reinitialiser</Button>
    </div>
  );

  const totalLabel = `${data?.total || 0} vehicules`;

  return (
    <div className="flex flex-col">
      <Seo
        title="Vehicules"
        description="Parcourez les vehicules disponibles, comparez les prix et lancez une reservation en quelques clics."
        canonical="https://demo-locationauto.shonenx.shop/voitures"
        image="/opengraph.jpg"
        type="website"
      />

      <section className="container mx-auto px-4 pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_70px_-40px_rgba(16,23,34,0.3)]">
          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80" alt="Voiture sur route" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7)_55%,rgba(15,23,42,0.4))]" />

          <div className="relative z-10 grid gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:px-10 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">Votre voyage, notre passion</p>
              <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-balance md:text-6xl lg:text-7xl">
                Roulez librement
                <span className="block text-primary">vivez le Maroc.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                Des vehicules selectionnes avec soin, des prix clairs et une reservation rapide.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white px-6 text-primary hover:bg-white/95"><Link href="/">Accueil</Link></Button>
                <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"><a href="https://wa.me/212600000000" target="_blank" rel="noreferrer">WhatsApp</a></Button>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-slate-900/60 p-4 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.45)] backdrop-blur">
              <ReservationSearchBar
                cities={cities}
                city={city}
                startDate={startDate}
                returnDate={returnDate}
                onCityChange={setCity}
                onDatesChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
                  setStartDate(nextStartDate);
                  setReturnDate(nextReturnDate);
                }}
                onSubmit={handleSearch}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => <TrustCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 lg:pb-20">
        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[1.6rem] border border-border/70 bg-slate-950 p-5">
              <div className="mb-4 flex items-center gap-2 text-white">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Affiner la recherche</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted-foreground">{totalLabel}</span>
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full border-border/70 bg-white xl:hidden"><Filter className="h-4 w-4" />Filtres</Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100vw,420px)] bg-slate-950 text-white">
                  <SheetHeader><SheetTitle>Filtres</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterContent /></div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-white px-4 py-3 shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Trier par</p>
                <p className="text-sm font-semibold text-foreground">{totalLabel}</p>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="min-w-[220px] rounded-full border-border/70"><SelectValue placeholder="Trier" /></SelectTrigger>
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
                    <EmptyMedia variant="icon"><CarFront /></EmptyMedia>
                    <EmptyTitle>Aucun vehicule pour le moment</EmptyTitle>
                    <EmptyDescription>Le catalogue est vide pour l'instant. Ajoutez des vehicules depuis l'espace admin.</EmptyDescription>
                  </EmptyHeader>
                  <Button className="rounded-full bg-primary text-primary-foreground" onClick={handleReset}>Reinitialiser</Button>
                </Empty>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
