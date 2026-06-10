import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { Seo } from "@/components/seo";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CarFront, Filter, Search, SlidersHorizontal } from "lucide-react";

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
  { value: "ELECTRIQUE", label: "Électrique" },
];

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-[1.4rem] border border-border/70 bg-white p-4 shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export default function Cars() {
  const [location] = useLocation();
  const isReservationRoute = location.startsWith("/reservation");
  const params = getSearchParams();

  const [brand, setBrand] = useState(params.get("brand") || params.get("search") || "");
  const [city, setCity] = useState(params.get("city") || "");
  const [sortBy, setSortBy] = useState(params.get("sortBy") || "year_desc");
  const [transmission, setTransmission] = useState(params.get("transmission") || "all");
  const [fuelType, setFuelType] = useState(params.get("fuelType") || "all");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const next = getSearchParams();
    setBrand(next.get("brand") || next.get("search") || "");
    setCity(next.get("city") || "");
    setSortBy(next.get("sortBy") || "year_desc");
    setTransmission(next.get("transmission") || "all");
    setFuelType(next.get("fuelType") || "all");
  }, [location]);

  const { data, isLoading } = useListCars({
    brand: brand || undefined,
    city: city || undefined,
    transmission: transmission !== "all" ? transmission : undefined,
    fuelType: fuelType !== "all" ? fuelType : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
    sortBy,
    limit: 50,
  });

  const pageTitle = isReservationRoute ? "Réservation de véhicule" : "Véhicules disponibles";
  const pageDescription = isReservationRoute
    ? "Choisissez votre véhicule, comparez les prix et finalisez votre demande en quelques clics."
    : "Comparez les véhicules disponibles selon la marque, le prix, la transmission et le carburant.";

  const canonical = isReservationRoute
    ? "https://demo-locationauto.shonenx.shop/reservation"
    : "https://demo-locationauto.shonenx.shop/voitures";

  const handleReset = () => {
    setBrand("");
    setCity("");
    setSortBy("year_desc");
    setTransmission("all");
    setFuelType("all");
    setPriceRange([0, 2000]);
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <FilterGroup title="Marque">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder="Toyota, Dacia, Renault..."
            className="h-12 rounded-2xl border-border/70 pl-9"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Prix">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Budget</span>
          <span className="font-semibold text-foreground">
            {priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]}
          </span>
        </div>
        <Slider value={priceRange} onValueChange={setPriceRange} max={2000} step={50} />
      </FilterGroup>

      <FilterGroup title="Transmission">
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="h-12 rounded-2xl border-border/70">
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
          <SelectTrigger className="h-12 rounded-2xl border-border/70">
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

      <Button variant="outline" className="w-full rounded-2xl border-border/70 bg-white" onClick={handleReset}>
        Réinitialiser
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 lg:py-10">
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        image="/opengraph.jpg"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Location Auto Maroc - ${pageTitle}`,
          description: pageDescription,
          url: canonical,
        }}
      />

      <div className="mb-6 rounded-[1.8rem] bg-[linear-gradient(180deg,hsl(214_90%_48%),hsl(223_45%_18%))] px-6 py-8 text-white md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/86">
          <CarFront className="h-3.5 w-3.5" />
          Catalogue
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">{pageTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82 md:text-base">{pageDescription}</p>

        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-white/88">
            {data?.total || 0} véhicules
          </span>
          {isReservationRoute && (
            <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-white/88">
              Paiement à l’agence
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <Card className="overflow-hidden border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Filtres</h2>
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
            <span className="text-sm font-medium text-muted-foreground">{data?.total || 0} véhicules trouvés</span>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/70 bg-white">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw,420px)]">
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-white px-4 py-3 shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Trier par</p>
              <p className="text-sm font-semibold text-foreground">{data?.total || 0} offres disponibles</p>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="min-w-[220px] rounded-full border-border/70">
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year_desc">Recommandé</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="newest">Les plus récentes</SelectItem>
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
                  <EmptyTitle>Aucune voiture trouvée</EmptyTitle>
                  <EmptyDescription>Essayez une autre marque ou un autre budget.</EmptyDescription>
                </EmptyHeader>
                <Button className="rounded-full bg-primary text-primary-foreground" onClick={handleReset}>
                  Réinitialiser
                </Button>
              </Empty>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
