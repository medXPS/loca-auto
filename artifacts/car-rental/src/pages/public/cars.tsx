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
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CircleCheckBig,
  Filter,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { CATEGORY_TRANSLATIONS, cn } from "@/lib/utils";

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
  { icon: ShieldCheck, title: "Assurance incluse", description: "Couverture complete des la prise en charge." },
  { icon: BadgeCheck, title: "Prix transparents", description: "Aucun frais cache, prix clairs et justes." },
  { icon: MessageCircle, title: "Support WhatsApp", description: "Reponse rapide pour toutes vos questions." },
  { icon: Sparkles, title: "Reservation rapide", description: "Processus simple et 100% en ligne." },
  { icon: CircleCheckBig, title: "Agence verifiee", description: "Agence locale fiable et certifiee." },
  { icon: Star, title: "Avis clients", description: "4,8/5 sur +1200 clients satisfaits." },
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
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
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
  const [, setLocation] = useLocation();
  const params = getSearchParams();

  const [brand, setBrand] = useState(params.get("brand") || params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "all");
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
    setCategory(next.get("category") || "all");
    setCity(next.get("city") || "");
    setStartDate(next.get("startDate") || "");
    setReturnDate(next.get("returnDate") || "");
    setSortBy(next.get("sortBy") || "year_desc");
    setTransmission(next.get("transmission") || "all");
    setFuelType(next.get("fuelType") || "all");
  }, [location]);

  const { data: allCarsData } = useListCars({ limit: 200, sortBy: "year_desc" });
  const carQueryParams = {
    brand: brand || undefined,
    category: category !== "all" ? category : undefined,
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
    for (const car of allCarsData?.cars ?? []) if (car.city?.trim()) values.add(car.city.trim());
    if (values.size === 0) ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fes"].forEach((item) => values.add(item));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
  }, [allCarsData]);

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const car of allCarsData?.cars ?? []) {
      const value = car.category?.trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    const visible = ["all", "CITADINE", "BERLINE", "SUV", "LUXE"].map((value) => ({
      value,
      label: value === "all" ? "Tous" : CATEGORY_TRANSLATIONS[value] || value,
      count: value === "all" ? allCarsData?.total || 0 : counts.get(value) || 0,
    }));

    return visible;
  }, [allCarsData]);

  const featuredCars = (data?.cars ?? []).slice(0, 3);
  const totalLabel = `${data?.total || 0} véhicules`;

  const handleSearch = () => {
    const next = new URLSearchParams();
    if (brand) next.set("brand", brand);
    if (category !== "all") next.set("category", category);
    if (city) next.set("city", city);
    if (startDate) next.set("startDate", startDate);
    if (returnDate) next.set("returnDate", returnDate);
    if (sortBy) next.set("sortBy", sortBy);
    if (transmission !== "all") next.set("transmission", transmission);
    if (fuelType !== "all") next.set("fuelType", fuelType);
    setLocation(`/voitures${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const handleReset = () => {
    setBrand("");
    setCategory("all");
    setCity("");
    setStartDate("");
    setReturnDate("");
    setSortBy("year_desc");
    setTransmission("all");
    setFuelType("all");
    setPriceRange([0, 2000]);
    setLocation("/voitures");
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <FilterGroup title="Marque">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-white/45" />
          <Input
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="Toyota, Dacia, Renault..."
            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/35"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Ville">
        <Select value={city || "all"} onValueChange={(value) => setCity(value === "all" ? "" : value)}>
          <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-white/5 text-white">
            <SelectValue placeholder="Choisir une ville" />
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
      </FilterGroup>

      <FilterGroup title="Prix">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Budget</span>
          <span className="font-semibold text-white">
            {priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]}
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

      <Button variant="outline" className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleReset}>
        Reinitialiser
      </Button>

      <Card className="overflow-hidden rounded-[1.5rem] border-0 bg-[linear-gradient(180deg,rgba(246,190,140,0.42),rgba(16,23,34,0.88))] text-white shadow-[0_22px_60px_-36px_rgba(16,23,34,0.45)]">
        <CardContent className="space-y-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xl font-semibold">Roulez en toute sérénite au Maroc</h4>
            <p className="mt-2 text-sm leading-6 text-white/78">Assurance, assistance 24/7 et véhicules vérifiés.</p>
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

          <div className="relative z-10 px-6 py-8 md:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F04B45] text-white shadow-[0_16px_32px_-20px_rgba(240,75,69,0.7)]">
                  <CarFront className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-base font-semibold tracking-tight">Location Auto Maroc</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/58">Location simple et rapide</p>
                </div>
              </div>

              <nav className="hidden items-center gap-6 lg:flex">
                {["Accueil", "Véhicules", "Offres", "Blog", "À propos", "Contact"].map((item) => (
                  <a key={item} href={item === "Accueil" ? "/" : item === "Véhicules" ? "/voitures" : "#"} className="text-sm text-white/72 transition hover:text-white">
                    {item}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <Button asChild variant="outline" className="hidden rounded-full border-white/15 bg-white/8 px-4 text-white hover:bg-white/12 md:inline-flex">
                  <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild className="rounded-full bg-[#F04B45] px-5 text-white hover:bg-[#e63f39]">
                  <Link href="/voitures">Réserver</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-center lg:py-16">
              <div className="max-w-3xl">
                <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/56">Votre voyage, notre passion</p>
                <h1 className="mt-4 font-serif text-5xl leading-[0.95] text-balance md:text-6xl lg:text-7xl">
                  Roulez librement
                  <span className="block text-[#F04B45]">vivez le Maroc.</span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/78 md:text-base">
                  Des véhicules sélectionnés avec soin, un service premium et des prix clairs. Réservez en quelques clics et profitez pleinement de chaque instant.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <div className="flex items-center -space-x-2">
                    {["A", "M", "K"].map((letter) => (
                      <div key={letter} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/18 text-sm font-semibold text-white backdrop-blur-sm">
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>4,8/5</span>
                      <span className="text-[#FFCC66]">★★★★★</span>
                    </div>
                    <p className="text-sm text-white/65">+1200 clients satisfaits</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <StatPill label="Réservation" value="En 2 minutes" />
                  <StatPill label="Disponibilité" value="Calcul temps réel" />
                  <StatPill label="Paiement" value="À l'agence" />
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-white/10 bg-slate-900/70 p-4 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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
              eyebrow="Sélection populaire"
              title="Nos voitures les plus demandées"
              description="Une sélection plus visuelle, plus claire et plus proche du parcours que vous avez partagé."
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

      <section className="container mx-auto px-4 pb-16 lg:pb-20">
        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[1.8rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.35)]">
              <div className="mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#F04B45]" />
                <h2 className="text-lg font-semibold">Affiner votre recherche</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500">{totalLabel}</span>
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full border-border/70 bg-white xl:hidden">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(100vw,420px)] bg-slate-950 text-white">
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
                      onClick={() => setCategory(item.value)}
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

              <Select value={sortBy} onValueChange={setSortBy}>
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
                    <EmptyDescription>Le catalogue est vide pour l'instant. Ajoutez des vehicules depuis l'espace admin.</EmptyDescription>
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
