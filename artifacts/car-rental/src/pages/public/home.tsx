import { Link, useLocation } from "wouter";
import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <BadgeCheck className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function IconCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.5rem] border border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
      <CardContent className="p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

const benefits = [
  {
    icon: ShieldCheck,
    title: "Assurance incluse",
    description: "Des offres plus rassurantes avec les informations utiles affichées clairement.",
  },
  {
    icon: Clock3,
    title: "Assistance 24/7",
    description: "Une équipe réactive par WhatsApp et téléphone pour répondre rapidement.",
  },
  {
    icon: Sparkles,
    title: "Réservation rapide",
    description: "Un parcours court pour choisir et réserver sans perdre du temps.",
  },
  {
    icon: BadgeCheck,
    title: "Prix transparents",
    description: "Le tarif apparaît dès les premières secondes, sans surcharge visuelle.",
  },
];

const steps = [
  {
    title: "Choisissez votre véhicule",
    description: "Parcourez le catalogue et ouvrez la fiche qui correspond à votre besoin.",
  },
  {
    title: "Confirmez votre réservation",
    description: "Validez vos dates et envoyez votre demande en quelques clics.",
  },
  {
    title: "Récupérez votre voiture",
    description: "L’agence vous contacte et prépare la remise du véhicule.",
  },
];

const testimonials = [
  {
    name: "Youssef A.",
    role: "Casablanca",
    quote: "J’ai trouvé une voiture en moins de deux minutes et le prix était clair tout de suite.",
  },
  {
    name: "Sara M.",
    role: "Marrakech",
    quote: "Le site est simple sur mobile et le bouton WhatsApp m’a permis d’être rassurée rapidement.",
  },
  {
    name: "Hassan R.",
    role: "Rabat",
    quote: "Le parcours est direct, sans sections inutiles. On voit les voitures et on réserve.",
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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate);
    if (returnDate) params.set("returnDate", returnDate);

    setLocation(`/reservation${params.toString() ? `?${params.toString()}` : ""}`);
  };

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

      <section className="container mx-auto px-4 pt-8 lg:pt-10">
        <div className="grid gap-6 overflow-hidden rounded-[2.2rem] bg-white shadow-[0_28px_70px_-40px_rgba(16,23,34,0.22)] lg:grid-cols-[1.02fr_0.98fr]">
          <div className="flex flex-col justify-between gap-8 marketing-dark-panel p-6 text-white md:p-8 lg:p-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Location au Maroc
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-balance md:text-5xl lg:text-6xl">
                Location de voitures au Maroc
              </h1>
              <p className="mt-4 max-w-lg text-base leading-8 text-white/84 md:text-lg">
                Trouvez votre véhicule en quelques clics.
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4 rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/72">Ville</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 rounded-2xl border-white/16 bg-white/95 text-foreground">
                      <SelectValue placeholder="Choisir une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/72">Date départ</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-12 rounded-2xl border-white/16 bg-white/95 text-foreground"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/72">Date retour</label>
                  <Input
                    type="date"
                    value={returnDate}
                    min={startDate || undefined}
                    onChange={(event) => setReturnDate(event.target.value)}
                    className="h-12 rounded-2xl border-white/16 bg-white/95 text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="rounded-full bg-white px-6 text-primary hover:bg-white/95">
                  <Search className="h-4 w-4" />
                  Rechercher
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/16 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                  <Link href="/voitures">
                    Voir nos véhicules
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2 text-sm">
              {["Prix transparents", "Réservation rapide", "WhatsApp direct"].map((item) => (
                <span key={item} className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-white/86">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
              alt="Voiture premium"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.08),rgba(7,15,31,0.38))]" />
            <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary shadow-sm">
              Premium car
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="rounded-[1.6rem] border border-white/16 bg-white/92 p-4 shadow-[0_20px_40px_-24px_rgba(16,23,34,0.3)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Réserver vite</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">Les voitures et les prix sont visibles dès le premier écran.</p>
                  </div>
                  <div className="hidden rounded-full bg-primary/10 p-3 text-primary md:block">
                    <CarFront className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          eyebrow="Véhicules populaires"
          title="Les offres les plus demandées"
          description="Six véhicules maximum, présentés avec une hiérarchie simple pour décider rapidement."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[420px] rounded-[1.5rem] border border-border/70 bg-white shadow-sm">
                  <div className="h-56 animate-pulse rounded-t-[1.5rem] bg-muted/60" />
                </div>
              ))
            : featuredCars?.cars.slice(0, 6).map((car) => <CarCard key={car.id} car={car} />)}
        </div>

        <div className="mt-10 text-center">
          <Button asChild className="rounded-full bg-primary px-6 text-primary-foreground">
            <Link href="/voitures">
              Voir tous les véhicules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/25 py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Pourquoi nous choisir"
            title="Quatre raisons simples de réserver ici"
            description="Aucune surcharge. Seulement les points qui rassurent vraiment."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((benefit) => (
              <IconCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <SectionHeader
          eyebrow="Comment ça marche"
          title="Trois étapes"
          description="Le parcours reste ultra court, du choix du véhicule à la remise des clés."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="rounded-[1.5rem] border border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <span className="text-lg font-semibold">{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeader
          eyebrow="Avis clients"
          title="Ils ont réservé en toute simplicité"
          description="Seulement trois témoignages, courts et crédibles."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="rounded-[1.5rem] border border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)]">
              <CardContent className="p-6">
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">"{item.quote}"</p>
                <div className="mt-5">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="overflow-hidden rounded-[2rem] marketing-dark-panel px-6 py-10 text-white md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/86">
                <Users className="h-3.5 w-3.5" />
                Besoin d'une voiture aujourd'hui ?
              </div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight text-balance md:text-4xl">
                Réservez maintenant et recevez une réponse rapide.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
                Comparez, cliquez et contactez l'agence si besoin. Le site reste volontairement court pour aller droit à la réservation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild className="rounded-full bg-white px-6 text-primary hover:bg-white/95">
                <Link href="/reservation">
                  Réserver maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/16 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
