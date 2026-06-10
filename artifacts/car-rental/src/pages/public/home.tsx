import { Link, useLocation } from "wouter";
import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { useListCars } from "@workspace/api-client-react";
import { formatDisplayDate } from "@workspace/api-client-react/availability";
import { CarCard } from "@/components/car-card";
import { DateRangeCalendar } from "@/components/date-range-calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const timeOptions = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];

const trustHighlights = [
  {
    title: "Parcours plus direct",
    description: "La recherche, la comparaison et la prise de contact restent visibles sans détour inutile.",
    icon: Sparkles,
  },
  {
    title: "Tarifs lisibles",
    description: "Les prix et conditions importantes remontent en haut des cartes pour rassurer plus vite.",
    icon: ShieldCheck,
  },
  {
    title: "Présence locale",
    description: "Villes, aéroports et contact WhatsApp restent accessibles à chaque étape.",
    icon: MapPin,
  },
];

const bookingSteps = [
  {
    title: "Sélectionnez votre ville",
    description: "Choisissez l'agence ou l'aéroport le plus pratique selon votre arrivée.",
  },
  {
    title: "Comparez les véhicules",
    description: "Repérez rapidement le prix, la boîte, les places et la disponibilité.",
  },
  {
    title: "Confirmez la demande",
    description: "Passez à la réservation ou contactez l'équipe pour finaliser plus vite.",
  },
];

const faqItems = [
  {
    question: "Quels documents faut-il pour réserver ?",
    answer:
      "Une pièce d'identité valide, un permis de conduire en cours de validité et un moyen de contact suffisent pour lancer une demande.",
  },
  {
    question: "Les prix affichés sont-ils transparents ?",
    answer:
      "Oui. Le tarif journalier ou le total estimé apparaît directement sur la fiche véhicule avant la prise de contact.",
  },
  {
    question: "Puis-je réserver depuis mobile ?",
    answer:
      "Oui. La recherche, les cartes véhicules et les actions de réservation sont pensées pour fonctionner proprement sur téléphone.",
  },
];

const airportDestinations = [
  { label: "Aéroport Mohammed V", city: "Casablanca" },
  { label: "Aéroport Marrakech Menara", city: "Marrakech" },
  { label: "Aéroport Rabat-Salé", city: "Rabat" },
  { label: "Aéroport Ibn Battouta", city: "Tanger" },
  { label: "Aéroport Al Massira", city: "Agadir" },
  { label: "Aéroport Fès-Saïss", city: "Fès" },
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
          "inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/72 px-4 py-1.5 text-xs font-semibold text-primary marketing-kicker",
          align === "center" ? "" : "mx-0",
        )}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      <p className={cn("max-w-3xl text-base leading-7 text-muted-foreground", align === "center" ? "mx-auto" : "")}>
        {description}
      </p>
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
    <div className="rounded-[1.35rem] border border-black/8 bg-white/90 px-4 py-3 shadow-[0_18px_32px_-26px_rgba(16,23,34,0.2)] transition-transform hover:-translate-y-0.5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground marketing-kicker">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      {children}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
      <p className="text-[11px] text-white/58 marketing-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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
      className="group flex items-center justify-between rounded-2xl border border-black/8 bg-white/88 px-4 py-3 text-sm font-medium transition-all hover:border-primary/25 hover:text-primary"
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
      ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fès", "Essaouira"].forEach((city) => cities.add(city));
    }

    return Array.from(cities).sort((a, b) => a.localeCompare(b, "fr"));
  }, [citiesSource]);

  const topCities = agencyCities.slice(0, 6);

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
      <section className="container mx-auto px-4 pt-8 md:pt-10">
        <div className="overflow-hidden rounded-[2.3rem] marketing-dark-panel marketing-grid">
          <div className="relative z-10 grid gap-10 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Refonte commerciale inspirée des codes SaaS premium
                </div>

                <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white text-balance md:text-5xl xl:text-6xl">
                  Louez une voiture au Maroc avec une vitrine plus claire, plus crédible et prête à vendre.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                  Une expérience plus professionnelle pour capter la demande vite: design premium, hiérarchie plus nette et recherche immédiatement exploitable.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/78">
                  <span className="rounded-full px-4 py-2 marketing-pill">Catalogue structuré</span>
                  <span className="rounded-full px-4 py-2 marketing-pill">Contact visible</span>
                  <span className="rounded-full px-4 py-2 marketing-pill">Réservation mobile-friendly</span>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <HeroMetric label="Véhicules listés" value={`${featuredCars?.total ?? 0}+`} />
                <HeroMetric label="Villes couvertes" value={`${agencyCities.length}+`} />
                <HeroMetric label="Canal direct" value="WhatsApp" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] marketing-soft-panel p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground marketing-kicker">Recherche rapide</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">Préparez une demande en quelques clics</p>
                  </div>
                  <span className="hidden rounded-full border border-black/8 bg-white/72 px-3 py-1 text-xs text-muted-foreground md:inline-flex">
                    Ready for sale
                  </span>
                </div>

                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSearch}>
                  <SearchField label="Lieu" icon={MapPin}>
                    <Select value={agencyCity} onValueChange={setAgencyCity}>
                      <SelectTrigger className="h-11 rounded-2xl border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0">
                        <SelectValue placeholder="Ville, agence ou aéroport" />
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
                        className="rounded-[1.35rem] border border-black/8 bg-white/90 px-4 py-3 text-left shadow-[0_18px_32px_-26px_rgba(16,23,34,0.2)] transition-transform hover:-translate-y-0.5"
                      >
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground marketing-kicker">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          Dates
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase text-muted-foreground marketing-kicker">
                              {dateDebut ? "Période choisie" : "Choisir les dates"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{periodLabel}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[min(calc(100vw-1rem),34rem)] rounded-[1.35rem] border-black/8 bg-background/96 p-2 shadow-[0_26px_70px_-42px_rgba(16,23,34,0.3)] backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between px-2 pb-2 text-[11px] text-muted-foreground marketing-kicker">
                        <span>Choisissez vos dates</span>
                        <span>Disponibilités en direct</span>
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

                  <SearchField label="Départ" icon={Clock3}>
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

                  <SearchField label="Retour" icon={Clock3}>
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

                  <div className="md:col-span-2 grid gap-3 rounded-[1.35rem] border border-black/8 bg-[#0f1521] px-4 py-4 text-white md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <label className="flex items-center gap-3 text-sm text-white/78">
                      <Checkbox checked={differentDropoff} onCheckedChange={(checked) => setDifferentDropoff(checked === true)} />
                      Retour dans une autre ville
                    </label>
                    <label className="flex items-center gap-3 text-sm text-white/78">
                      <Checkbox checked={driverAgeOk} onCheckedChange={(checked) => setDriverAgeOk(checked === true)} />
                      Conducteur 30 à 65 ans
                    </label>
                    <Button type="submit" className="h-12 rounded-full px-6 marketing-accent-button">
                      <Search className="h-5 w-5" />
                      Rechercher
                    </Button>
                  </div>
                </form>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 text-white backdrop-blur">
                  <p className="text-xs text-white/56 marketing-kicker">Pourquoi ce redesign</p>
                  <p className="mt-2 text-xl font-semibold">Une page d’accueil qui agit comme un commercial.</p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Les infos utiles remontent plus vite: recherche, prix, preuves de confiance et destination.
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 text-white backdrop-blur">
                  <p className="text-xs text-white/56 marketing-kicker">Objectif business</p>
                  <p className="mt-2 text-xl font-semibold">Réduire l'hésitation et accélérer la prise de contact.</p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Le catalogue devient plus lisible et les CTA restent visibles sans paraître agressifs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {trustHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="marketing-soft-panel">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {["Atlas Mobility", "Blue Coast Rent", "Sahara Drive", "Rif Auto", "Médina Fleet", "Coastal Cars"].map((brand) => (
              <div
                key={brand}
                className="rounded-[1.2rem] border border-black/8 bg-white/82 px-4 py-3 text-center text-sm font-medium text-muted-foreground shadow-[0_18px_35px_-28px_rgba(16,23,34,0.14)]"
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
            eyebrow="Véhicules mis en avant"
            title="Des offres présentées comme un vrai produit prêt à être vendu."
            description="La hiérarchie met d'abord en avant le prix, la disponibilité, les caractéristiques clés et l'appel à l'action."
          />

          <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-sm">
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
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/10 bg-white/82 py-16 text-center text-muted-foreground">
                Aucune voiture disponible pour le moment.
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <Button asChild className="rounded-full px-8 marketing-accent-button">
              <Link href="/voitures">
                Voir toutes les voitures
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
            <Card className="overflow-hidden marketing-dark-panel marketing-grid text-white">
              <CardContent className="relative z-10 p-6 md:p-8">
                <SectionHeader
                  eyebrow="Pourquoi ça convertit mieux"
                  title="Une expérience qui ressemble davantage à un produit premium qu'à une simple page catalogue."
                  description="Le site reprend des codes visuels plus nets: contrastes forts, repères typographiques, blocs éditoriaux courts et CTA visibles."
                  align="left"
                />

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {bookingSteps.map((step, index) => (
                    <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-primary">
                        <span className="text-lg font-semibold">{index + 1}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">{step.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="marketing-soft-panel">
                <CardContent className="p-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/72 px-4 py-1.5 text-xs font-semibold text-primary marketing-kicker">
                    <MapPin className="h-3.5 w-3.5" />
                    Destinations
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-foreground">Villes et aéroports les plus demandés</h3>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {topCities.map((city) => (
                      <DestinationLink key={city} label={city} city={city} />
                    ))}
                    {airportDestinations.slice(0, 2).map((airport) => (
                      <DestinationLink key={airport.label} label={airport.label} city={airport.city} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="marketing-soft-panel">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground marketing-kicker">Signaux de confiance</p>
                      <p className="text-2xl font-semibold text-foreground">Une lecture plus rassurante</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Parcours", value: "Mobile-first" },
                      { label: "Actions", value: "Toujours visibles" },
                      { label: "Contact", value: "Direct" },
                      { label: "Catalogue", value: "Plus lisible" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-black/8 bg-white/82 px-4 py-4">
                        <p className="text-[11px] text-muted-foreground marketing-kicker">{stat.label}</p>
                        <p className="mt-2 text-xl font-semibold text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="marketing-soft-panel">
              <CardContent className="p-6">
                <SectionHeader
                  eyebrow="Questions fréquentes"
                  title="Les réponses essentielles avant la réservation."
                  description="Une FAQ courte, utile et structurée pour répondre aux dernières hésitations avant la conversion."
                  align="left"
                />

                <Accordion type="single" collapsible className="mt-6 space-y-3">
                  {faqItems.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="overflow-hidden rounded-2xl border border-black/8 bg-white/82 px-4">
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

            <Card className="overflow-hidden marketing-dark-panel text-white">
              <CardContent className="p-6 md:p-8">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs marketing-kicker marketing-pill">
                  <CarFront className="h-3.5 w-3.5 text-primary" />
                  Dernier écran avant action
                </div>

                <h3 className="mt-5 text-3xl font-semibold leading-tight text-balance">
                  Une interface plus professionnelle, prête pour la vente et le déploiement.
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/72 md:text-base">
                  Le site garde sa logique métier, mais sa présentation est désormais plus proche d'une plateforme produit sérieuse: plus d'impact, plus de structure, plus de confiance.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Design plus cohérent entre accueil, catalogue et fiches véhicules.",
                    "Typographie plus nette avec repères inspirés des interfaces modernes.",
                    "Mise en avant claire des CTA importants pour accélérer la demande.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-white/74">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="rounded-full px-6 marketing-accent-button">
                    <Link href="/voitures">
                      Explorer les offres
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-white/14 bg-white/6 px-6 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/contact">Parler à l'équipe</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
