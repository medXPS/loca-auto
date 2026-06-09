import { Link, useLocation } from "wouter";
import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@workspace/api-client-react/availability";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const timeOptions = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];

const trustHighlights = [
  {
    title: "Prix transparents",
    description: "Tarifs lisibles, sans frais cachés ni mauvaise surprise à l’arrivée.",
    icon: ShieldCheck,
  },
  {
    title: "Service local",
    description: "Des agences situées dans les villes et les aéroports les plus demandés.",
    icon: MapPin,
  },
  {
    title: "Réponse rapide",
    description: "Un parcours de réservation pensé pour aller droit au but, sur mobile comme sur desktop.",
    icon: Sparkles,
  },
];

const bookingSteps = [
  {
    title: "Choisissez votre point de départ",
    description: "Sélectionnez la ville, l’aéroport ou l’agence qui vous convient le mieux.",
  },
  {
    title: "Comparez les offres",
    description: "Filtrez par prix, boîte, carburant et disponibilité pour garder le contrôle.",
  },
  {
    title: "Réservez en quelques clics",
    description: "Préparez votre dossier, puis finalisez la demande quand vous êtes prêt.",
  },
];

const faqItems = [
  {
    question: "Quels documents faut-il pour réserver ?",
    answer:
      "Une pièce d’identité valide, un permis de conduire en cours de validité et un moyen de contact fiable suffisent pour lancer la demande. Le détail peut varier selon le véhicule.",
  },
  {
    question: "Les prix affichés sont-ils définitifs ?",
    answer:
      "Oui, nous privilégions des tarifs clairs. Les éventuels frais spécifiques sont affichés avant validation afin que vous puissiez comparer sereinement.",
  },
  {
    question: "Puis-je modifier mes dates après la recherche ?",
    answer:
      "Oui. Il suffit de relancer la recherche avec une autre période, ou d’ouvrir la fiche véhicule pour ajuster votre demande avant confirmation.",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-4", align === "center" ? "text-center" : "text-left")}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/6 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary",
          align === "center" ? "" : "mx-0",
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">{title}</h2>
      <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function SearchField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/24 bg-white/94 px-4 py-3 shadow-[0_16px_30px_-22px_hsl(var(--primary)/0.55)] transition-transform hover:-translate-y-0.5">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      {children}
    </div>
  );
}

function DestinationLink({
  label,
  city,
}: {
  label: string;
  city: string;
}) {
  return (
    <Link
      href={`/voitures?city=${encodeURIComponent(city)}`}
      className="group flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm font-medium transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [agencyCity, setAgencyCity] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [differentDropoff, setDifferentDropoff] = useState(false);
  const [driverAgeOk, setDriverAgeOk] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: featuredCars, isLoading } = useListCars({
    limit: 3,
    sortBy: "year_desc",
  });
  const { data: citiesSource } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });

  const agencyCities = useMemo(() => {
    const cities = new Set<string>();
    for (const car of citiesSource?.cars ?? []) {
      if (car.city?.trim()) {
        cities.add(car.city.trim());
      }
    }

    if (cities.size === 0) {
      [
        "Casablanca",
        "Marrakech",
        "Rabat",
        "Tanger",
        "Agadir",
        "Fès",
        "Essaouira",
      ].forEach((city) => cities.add(city));
    }

    return Array.from(cities).sort((a, b) => a.localeCompare(b, "fr"));
  }, [citiesSource]);

  const topCities = agencyCities.slice(0, 6);
  const airportDestinations = [
    { label: "Aéroport Mohammed V", city: "Casablanca" },
    { label: "Aéroport Marrakech Menara", city: "Marrakech" },
    { label: "Aéroport Rabat-Salé", city: "Rabat" },
    { label: "Aéroport Ibn Battouta", city: "Tanger" },
    { label: "Aéroport Al Massira", city: "Agadir" },
    { label: "Aéroport Fès-Saïss", city: "Fès" },
  ];

  const periodLabel =
    dateDebut && dateFin
      ? `${formatDisplayDate(dateDebut)} · ${formatDisplayDate(dateFin)}`
      : dateDebut
        ? `${formatDisplayDate(dateDebut)} · Retour à choisir`
        : "Choisir les dates";

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (agencyCity) params.set("city", agencyCity);
    if (dateDebut) params.set("startDate", dateDebut);
    if (dateFin) params.set("returnDate", dateFin);
    params.set("pickupTime", pickupTime);
    params.set("returnTime", returnTime);
    if (differentDropoff) params.set("dropoffDifferent", "true");
    if (driverAgeOk) params.set("driverAge", "30-65");
    const query = params.toString();
    setLocation(`/voitures${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex w-full flex-col">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80"
            alt="Route côtière au lever du jour"
            className="h-full w-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(41,128,255,0.32),transparent_30%),linear-gradient(180deg,rgba(11,91,194,0.96),rgba(17,105,216,0.88)_42%,rgba(216,232,250,0.9)_100%)]" />
        </div>

        <div className="container relative mx-auto px-4 py-10 lg:py-14">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/92 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Réservation premium au Maroc
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white text-balance drop-shadow-[0_8px_30px_rgba(0,0,0,0.35)] md:text-5xl lg:text-6xl">
              Location de voitures - recherchez, comparez et partez avec plus de clarté.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-white/88 md:text-lg">
              Une expérience pensée comme un vrai comparateur: même logique que les grands sites de réservation,
              mais avec une palette plus riche, une lecture plus douce et un parcours plus direct.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-white/90">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Annulation flexible
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 backdrop-blur">
                <Users className="h-4 w-4" />
                Plus de 60 agences
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 backdrop-blur">
                <Clock3 className="h-4 w-4" />
                Assistance 7j/7
              </span>
            </div>

            <div className="mt-10 w-full max-w-6xl rounded-[2rem] border border-white/25 bg-white/84 p-3 shadow-[0_30px_80px_-42px_hsl(var(--primary)/0.7)] backdrop-blur-xl">
              <form className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.5fr_0.5fr_auto] lg:items-stretch" onSubmit={handleSearch}>
                <SearchField label="Lieu de prise en charge" icon={MapPin}>
                  <Select value={agencyCity} onValueChange={setAgencyCity}>
                    <SelectTrigger className="h-11 rounded-2xl border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                      <SelectValue placeholder="Aéroport, ville ou agence" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencyCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SearchField>

                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full rounded-[1.35rem] border border-white/24 bg-white/94 px-4 py-3 text-left shadow-[0_16px_30px_-22px_hsl(var(--primary)/0.55)] transition-transform hover:-translate-y-0.5"
                    >
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        Dates de location
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {dateDebut ? "Prise en charge" : "Choisir les dates"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{periodLabel}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[min(calc(100vw-1rem),34rem)] rounded-[1.35rem] border-border/70 bg-background/96 p-2 shadow-[0_26px_70px_-42px_hsl(var(--primary)/0.65)] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Choisissez vos dates</span>
                      <span>Jours réservés en gris</span>
                    </div>
                    <DateRangeCalendar
                      label="Période de location"
                      startDate={dateDebut}
                      returnDate={dateFin}
                      onChange={({ startDate, returnDate }) => {
                        setDateDebut(startDate);
                        setDateFin(returnDate);
                        if (startDate && returnDate) {
                          setCalendarOpen(false);
                        }
                      }}
                      minimal
                    />
                  </PopoverContent>
                </Popover>

                <SearchField label="Heure de départ" icon={Clock3}>
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className="h-11 rounded-2xl border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SearchField>

                <SearchField label="Heure de retour" icon={Clock3}>
                  <Select value={returnTime} onValueChange={setReturnTime}>
                    <SelectTrigger className="h-11 rounded-2xl border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SearchField>

                <Button
                  type="submit"
                  className="h-auto rounded-[1.35rem] bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-[0_20px_36px_-20px_rgba(34,197,94,0.78)] hover:bg-emerald-600 lg:min-h-[84px]"
                >
                  <Search className="h-5 w-5" />
                  Rechercher
                </Button>
              </form>

              <div className="mt-3 grid gap-3 rounded-[1.6rem] border border-border/50 bg-white/75 px-4 py-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Checkbox checked={differentDropoff} onCheckedChange={(checked) => setDifferentDropoff(checked === true)} />
                  Je souhaite restituer la voiture dans un autre endroit
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <Checkbox checked={driverAgeOk} onCheckedChange={(checked) => setDriverAgeOk(checked === true)} />
                  Le conducteur a-t-il entre 30 et 65 ans ?
                </label>
                <Link
                  href="/voitures"
                  className="inline-flex items-center justify-center rounded-full border border-primary/15 bg-primary/6 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  Filtres rapides
                </Link>
              </div>
            </div>

            <div className="mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-3">
              <div className="rounded-[1.35rem] border border-white/18 bg-white/10 px-4 py-3 text-left text-white backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Véhicules disponibles</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {featuredCars?.total ?? 0}
                  <span className="text-base font-semibold text-white/75">+</span>
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/18 bg-white/10 px-4 py-3 text-left text-white backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Villes couvertes</p>
                <p className="mt-1 text-2xl font-extrabold">{agencyCities.length}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/18 bg-white/10 px-4 py-3 text-left text-white backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Réservation</p>
                <p className="mt-1 text-2xl font-extrabold">Rapide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(216_55%_97%),hsl(216_45%_99%))] py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {trustHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="surface-panel">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              "Atlas Mobility",
              "Blue Coast Rent",
              "Sahara Drive",
              "Rif Auto",
              "Médina Fleet",
              "Coastal Cars",
            ].map((brand) => (
              <div
                key={brand}
                className="rounded-[1.1rem] border border-border/60 bg-white px-4 py-3 text-center text-sm font-semibold text-muted-foreground shadow-sm"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Véhicules populaires"
            title="Des offres choisies pour un parcours de réservation plus net."
            description="Les modèles les plus demandés en ce moment, avec une hiérarchie visuelle plus lisible pour comparer rapidement le prix, la transmission et la disponibilité."
          />

          <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
                  <Skeleton className="h-[220px] w-full rounded-none" />
                  <div className="space-y-4 p-5">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ))
            ) : featuredCars?.cars && featuredCars.cars.length > 0 ? (
              featuredCars.cars.map((car) => <CarCard key={car.id} car={car} />)
            ) : (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-border/70 bg-white/80 py-16 text-center text-muted-foreground">
                Aucune voiture disponible pour le moment.
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-8">
              <Link href="/voitures">
                Voir toutes les voitures
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-[linear-gradient(180deg,hsl(216_55%_98%),hsl(216_45%_96%))] py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Pourquoi nous"
            title="Une interface inspirée des meilleurs standards, mais adaptée à votre logique locale."
            description="Nous avons gardé le schéma de réservation que les utilisateurs connaissent déjà, tout en lui donnant plus d’oxygène, plus de contraste et plus de hiérarchie."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Tarifs lisibles",
                  description: "Chaque voiture affiche son prix de manière immédiate, avec des repères clairs sur le total estimé.",
                  icon: Sparkles,
                },
                {
                  title: "Filtres utiles",
                  description: "Ville, dates, boîte, carburant et budget pour affiner la recherche sans surcharge.",
                  icon: SlidersHorizontal,
                },
                {
                  title: "Réservation sereine",
                  description: "La fiche véhicule rassure avant la demande avec un vrai résumé des conditions.",
                  icon: ShieldCheck,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.title} className="surface-panel">
                    <CardContent className="p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="surface-panel-strong overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Statistiques</p>
                    <p className="text-2xl font-extrabold text-foreground">Une vue d’ensemble plus solide</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Villes couvertes", value: `${agencyCities.length}+` },
                    { label: "Véhicules listés", value: `${featuredCars?.total ?? 0}+` },
                    { label: "Formats de recherche", value: "5 champs" },
                    { label: "Support", value: "7j/7" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-border/70 bg-white px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-primary">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Destinations"
            title="Les villes et les aéroports les plus demandés."
            description="Le parcours reste le même, mais les entrées de destination sont plus lisibles et plus proches des attentes d’un site de réservation premium."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="surface-panel">
              <CardContent className="p-6">
                <h3 className="text-xl font-extrabold">Les destinations les plus prisées</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {topCities.map((city) => (
                    <DestinationLink key={city} label={city} city={city} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="surface-panel">
              <CardContent className="p-6">
                <h3 className="text-xl font-extrabold">Les aéroports les plus demandés</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {airportDestinations.map((airport) => (
                    <DestinationLink key={airport.label} label={airport.label} city={airport.city} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-[linear-gradient(180deg,hsl(214_90%_48%/_0.06),hsl(216_45%_98%))] py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Comment ça marche"
            title="Le même logique, mais en plus simple à lire."
            description="Le voyage utilisateur reste familier: chercher, comparer, choisir. Nous avons surtout renforcé l’orientation visuelle et les points d’appui."
          />

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 md:block" />
            {bookingSteps.map((step, index) => (
              <Card key={step.title} className="surface-panel relative">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-primary/15 bg-primary/10 text-primary shadow-sm">
                    <span className="text-xl font-extrabold">{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="surface-panel">
              <CardContent className="p-6">
                <SectionHeader
                  eyebrow="Questions fréquentes"
                  title="Tout ce qu’il faut savoir avant de réserver."
                  description="Nous gardons la partie informative simple et directe, sans noyer la page dans des blocs répétitifs."
                  align="left"
                />

                <Accordion type="single" collapsible className="mt-6 space-y-3">
                  {faqItems.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="overflow-hidden rounded-2xl border border-border/70 bg-white px-4">
                      <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-7 text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card className="surface-panel-strong overflow-hidden">
              <div className="bg-[linear-gradient(180deg,hsl(214_90%_48%),hsl(223_45%_18%))] px-6 py-7 text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/85">
                  <CarFront className="h-3.5 w-3.5" />
                  Pourquoi ce refont
                </div>
                <h3 className="mt-5 text-3xl font-extrabold leading-tight text-balance">Une expérience plus nette, plus riche et plus rassurante.</h3>
                <p className="mt-4 text-sm leading-7 text-white/85">
                  Le design suit la logique d’un grand site de réservation, mais avec une direction visuelle plus moderne:
                  bleu profond, ivoire, touches émeraude et cartes beaucoup plus aérées.
                </p>
              </div>

              <CardContent className="space-y-4 p-6">
                {[
                  "Les prix sont mis en avant avant les longs blocs de texte.",
                  "Les cartes utilisent des surfaces contrastées et des coins plus généreux.",
                  "Les filtres et le parcours de réservation restent faciles à comprendre sur mobile.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4 text-sm leading-6 text-emerald-900">
                  <p className="font-semibold text-emerald-950">Astuce rapide</p>
                  <p className="mt-1">
                    Lancez une recherche avec dates pour voir directement les véhicules disponibles et le total estimé.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16">
        <div className="container mx-auto px-4">
          <div className="rounded-[2rem] bg-[linear-gradient(135deg,hsl(214_90%_48%),hsl(198_85%_42%))] px-6 py-8 text-white shadow-[0_30px_80px_-38px_hsl(var(--primary)/0.75)] md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_auto] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/88">
                  <Sparkles className="h-3.5 w-3.5" />
                  Réservez maintenant
                </div>
                <h2 className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">
                  Prêt pour votre prochain trajet ?
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">
                  Comparez les véhicules, choisissez votre période et gardez un parcours de réservation fluide jusqu’à la demande finale.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button asChild className="w-full rounded-full bg-white px-6 text-primary hover:bg-white/95">
                  <Link href="/voitures">
                    Voir les voitures
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
