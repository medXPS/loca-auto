import { useMemo, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { ReservationSearchBar } from "@/components/reservation-search-bar";
import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, CarFront, MessageCircle, ShieldCheck, Sparkles, Star } from "lucide-react";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.5rem] border border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.12)]">
      <CardContent className="p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Assurance incluse",
    description: "Des véhicules présentés avec une information claire et rassurante dès la première vue.",
  },
  {
    icon: BadgeCheck,
    title: "Prix transparents",
    description: "Le tarif journalier reste visible immédiatement, sans surcharge visuelle ni surprise.",
  },
  {
    icon: MessageCircle,
    title: "Support WhatsApp",
    description: "Un contact direct pour poser une question, confirmer une disponibilité ou finaliser une demande.",
  },
  {
    icon: Sparkles,
    title: "Réservation rapide",
    description: "Un parcours court, pensé pour aller droit au véhicule et au formulaire de réservation.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const { data: featuredCars, isLoading } = useListCars({
    limit: 6,
    sortBy: "year_desc",
  });
  const { data: citiesSource } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of citiesSource?.cars ?? []) {
      if (car.city?.trim()) {
        values.add(car.city.trim());
      }
    }

    if (values.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fès"].forEach((item) => values.add(item));
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
  }, [citiesSource]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate);
    if (returnDate) params.set("returnDate", returnDate);

    setLocation(`/reservation${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const heroStats = [
    {
      label: "Note client",
      value: "4,8/5",
      description: "Avis vérifiés et expérience fluide",
      icon: Star,
    },
    {
      label: "Confiance",
      value: "Agence vérifiée",
      description: "Processus clair et encadré",
      icon: ShieldCheck,
    },
    {
      label: "Véhicules",
      value: `${featuredCars?.total ?? 0}+`,
      description: "Offres prêtes à réserver",
      icon: CarFront,
    },
  ];

  return (
    <div className="flex flex-col">
      <Seo
        title="Location de voitures au Maroc"
        description="Trouvez votre véhicule en quelques clics. Comparez les prix, réservez rapidement et contactez l’agence sur WhatsApp."
        canonical="https://demo-locationauto.shonenx.shop/"
        image="/opengraph.jpg"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Location Auto Maroc",
            url: "https://demo-locationauto.shonenx.shop/",
            telephone: "+212600000000",
            email: "contact@locationautomaroc.ma",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Casablanca",
              addressCountry: "MA",
            },
            areaServed: "Morocco",
          },
          {
            "@context": "https://schema.org",
            "@type": "CarRental",
            name: "Location Auto Maroc",
            url: "https://demo-locationauto.shonenx.shop/",
            areaServed: "Morocco",
          },
        ]}
      />

      <section className="container mx-auto px-4 pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-slate-950 text-white shadow-[0_28px_70px_-40px_rgba(16,23,34,0.3)]">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80"
            alt="Voiture premium sur route"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.9),rgba(15,23,42,0.68)_55%,rgba(15,23,42,0.4))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.24),transparent_28%)]" />

          <div className="relative z-10 px-6 py-10 md:px-8 lg:px-12 lg:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/72">Location Auto Maroc</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-balance md:text-5xl lg:text-6xl">
                Réservez votre voiture au Maroc avec une expérience simple et premium.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
                Comparez les véhicules disponibles, choisissez vos dates et lancez votre demande en quelques secondes.
              </p>
            </div>

            <div className="mt-8 max-w-5xl">
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

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-white px-6 text-primary hover:bg-white/95">
                <Link href="/voitures">
                  Voir les véhicules
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/16 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[1.35rem] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                      <Icon className="h-4 w-4 text-white/78" />
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                    <p className="mt-1 text-sm leading-6 text-white/72">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 lg:py-16">
        <SectionHeading
          eyebrow="Confiance"
          title="Une réservation claire et rassurante"
          description="Quatre repères simples pour garder une expérience premium, lisible et orientée conversion."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => (
            <TrustCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 lg:pb-20">
        <SectionHeading
          eyebrow="Véhicules populaires"
          title="Les offres les plus demandées"
          description="Une sélection lisible avec le prix journalier, les caractéristiques clés et un accès direct à la réservation."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-white shadow-[0_16px_35px_-28px_rgba(16,23,34,0.14)]">
                  <div className="h-60 animate-pulse bg-muted/60" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-1/2 animate-pulse rounded-full bg-muted/60" />
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted/60" />
                    <div className="h-20 animate-pulse rounded-2xl bg-muted/60" />
                  </div>
                </div>
              ))
            : featuredCars?.cars?.slice(0, 6).map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>
    </div>
  );
}
