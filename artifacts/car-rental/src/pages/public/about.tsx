import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGetCompanySettings, useListCars, type Car } from "@workspace/api-client-react";
import { ArrowRight, BadgeCheck, CarFront, MapPin, ShieldCheck, Sparkles, Star, Users, Phone, Mail, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/seo";
import { fetchBrands, fetchPublicRatings } from "@/lib/fleet-catalog";
import { CATEGORY_TRANSLATIONS, formatPrice } from "@/lib/utils";

type BrandTile = {
  name: string;
  logoUrl?: string | null;
};

const principles = [
  {
    title: "Clarté",
    description:
      "Des prix lisibles, des catégories bien expliquées et un parcours de réservation qui évite les mauvaises surprises.",
    icon: BadgeCheck,
  },
  {
    title: "Service local",
    description:
      "Une offre pensée pour les villes du Maroc, les aéroports et les besoins concrets des voyageurs comme des résidents.",
    icon: MapPin,
  },
  {
    title: "Confiance",
    description:
      "Des données réelles sur les véhicules, les marques et les avis pour aider chaque client à réserver sereinement.",
    icon: ShieldCheck,
  },
];

function formatCount(value: number) {
  return new Intl.NumberFormat("fr-MA").format(value);
}

function HeroStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/52">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs leading-5 text-white/65">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function FleetCard({ car }: { car: Car }) {
  const brandMeta = (car as any).brandMeta as { logoUrl?: string | null } | undefined;
  const categoryLabel = CATEGORY_TRANSLATIONS[car.category] ?? car.category;

  return (
    <article className="group overflow-hidden rounded-[1.7rem] border border-black/8 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.22)]">
      <Link href={`/voitures/${car.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {car.mainImageUrl ? (
            <img
              src={car.mainImageUrl}
              alt={`${car.brand} ${car.model}`}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#111827,#334155)] px-6 text-center text-white">
              <CarFront className="h-12 w-12 opacity-70" />
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.04),rgba(7,15,31,0.24))]" />

          <div className="absolute left-4 top-4 flex max-w-[calc(100%-5rem)] flex-wrap items-center gap-2">
            {brandMeta?.logoUrl ? (
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/92 p-1 shadow-sm">
                <img src={brandMeta.logoUrl} alt={car.brand} className="max-h-full max-w-full object-contain" />
              </span>
            ) : null}
            <span className="rounded-full border border-white/12 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
              {categoryLabel}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">{car.city || "Maroc"}</p>
              <h3 className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
                {car.brand} {car.model}
              </h3>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-[#ff4d43]" />
                {car.city || "Maroc"}
              </p>
            </div>

            <div className="shrink-0 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">À partir de</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formatPrice(car.dailyPrice)}</p>
              <p className="text-xs text-slate-500">/ jour</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transmission</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Places</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{car.seats} places</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ReviewCard({
  customerName,
  location,
  carLabel,
  score,
  serviceScore,
  comment,
}: {
  customerName: string;
  location: string;
  carLabel: string;
  score: number;
  serviceScore: number;
  comment: string;
}) {
  const initials = customerName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AA";

  return (
    <article className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{customerName}</p>
          <p className="text-xs text-slate-500">{location}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
              Voiture {score.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4d43]/15 bg-[#ff4d43]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ff4d43]">
              <Star className="h-3.5 w-3.5 fill-current" />
              Service {serviceScore.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{comment?.trim() || "Pas de commentaire"}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{carLabel}</p>
    </article>
  );
}

export default function About() {
  const { data: settings } = useGetCompanySettings();
  const { data: fleetData } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });
  const { data: publicRatings } = useQuery({
    queryKey: ["public-ratings"],
    queryFn: fetchPublicRatings,
    staleTime: 60_000,
  });

  const companyName = settings?.brandName?.trim() || "Location Auto Maroc";
  const slogan = settings?.slogan?.trim() || "Une expérience claire, rapide et pensée pour les vrais trajets.";
  const cars = fleetData?.cars ?? [];
  const totalCars = fleetData?.total ?? cars.length;
  const featuredCars = cars.slice(0, 3);

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of cars) {
      if (car.city?.trim()) {
        values.add(car.city.trim());
      }
    }

    if (values.size === 0 && settings?.city?.trim()) {
      values.add(settings.city.trim());
    }

    if (values.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger"].forEach((city) => values.add(city));
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right, "fr"));
  }, [cars, settings?.city]);

  const brandTiles = useMemo<BrandTile[]>(() => {
    const seen = new Set<string>();
    const items: BrandTile[] = [];

    for (const brand of brands) {
      const key = brand.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({ name: brand.name, logoUrl: brand.logoUrl });
    }

    for (const car of cars) {
      const key = car.brand.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({ name: car.brand, logoUrl: (car as any).brandMeta?.logoUrl });
    }

    return items.slice(0, 8);
  }, [brands, cars]);

  const testimonials = publicRatings?.testimonials ?? [];
  const averageRating = publicRatings?.summary.averageServiceScore ?? publicRatings?.summary.averageCarScore ?? null;
  const totalReviews = publicRatings?.summary.totalReviews ?? 0;
  const satisfiedClients = publicRatings?.summary.satisfiedClients ?? 0;
  const whatsapp = settings?.whatsapp ?? "+212600000000";
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  const contactEmail = settings?.email ?? "contact@locationauto.ma";
  const contactPhone = settings?.phone ?? "+212600000000";

  const heroStats = [
    {
      icon: CarFront,
      label: "Véhicules",
      value: formatCount(totalCars),
      detail: "dans la flotte réelle",
    },
    {
      icon: BadgeCheck,
      label: "Marques",
      value: formatCount(brands.length),
      detail: "logos disponibles",
    },
    {
      icon: MapPin,
      label: "Villes",
      value: formatCount(cities.length),
      detail: "couvertes par le catalogue",
    },
    {
      icon: Users,
      label: "Avis",
      value: formatCount(totalReviews),
      detail: averageRating ? `note moyenne ${averageRating.toFixed(1)}/5` : "en cours de collecte",
    },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-10">
      <Seo
        title={`À propos de ${companyName}`}
        description="Découvrez une présentation claire de notre flotte, de nos marques partenaires et de notre service de location au Maroc."
        canonical="/a-propos"
      />

      <section className="overflow-hidden rounded-[2.2rem] marketing-dark-panel marketing-grid px-5 py-8 text-white sm:px-6 md:px-8 md:py-10">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] marketing-kicker marketing-pill">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              À propos
            </div>
            <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl md:text-5xl">
              {companyName} rassemble des données réelles pour vous aider à réserver en confiance.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              {slogan} Nous mettons en avant la flotte, les marques et les avis publics afin de rendre chaque choix plus simple, plus transparent et plus utile.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/voitures">
                <Button className="w-full rounded-full px-6 marketing-accent-button sm:w-auto">
                  Voir les voitures
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-white/14 bg-white/6 px-6 text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Nous contacter
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/72">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2">
                <MapPin className="h-4 w-4 text-primary" />
                {settings?.city?.trim() || "Casablanca"} et partout au Maroc
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2">
                <Star className="h-4 w-4 text-amber-300" />
                {averageRating ? `${averageRating.toFixed(1)}/5 sur ${totalReviews} avis` : "Aucun avis publié pour le moment"}
              </span>
            </div>
          </div>

          <Card className="overflow-hidden border-white/10 bg-white/6 text-white backdrop-blur">
            <CardContent className="space-y-5 p-6">
              <img
                src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
                alt="Flotte de véhicules"
                className="h-52 w-full rounded-[1.5rem] object-cover sm:h-64"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {heroStats.map((stat) => (
                  <HeroStat
                    key={stat.label}
                    icon={stat.icon}
                    label={stat.label}
                    value={stat.value}
                    detail={stat.detail}
                  />
                ))}
              </div>

              <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/6 p-4 text-sm text-white/82 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/52">Téléphone</p>
                    <p className="mt-1 font-medium">{contactPhone}</p>
                  </div>
                </div>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/52">WhatsApp</p>
                    <p className="mt-1 font-medium">{whatsapp}</p>
                  </div>
                </a>
                <a href={`mailto:${contactEmail}`} className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/52">Email</p>
                    <p className="mt-1 font-medium">{contactEmail}</p>
                  </div>
                </a>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/52">Confiance</p>
                    <p className="mt-1 font-medium">{satisfiedClients} client(s) satisfaits</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="pb-16 pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;

            return (
              <Card key={principle.title} className="marketing-soft-panel">
                <CardContent className="p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-foreground">{principle.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Flotte réelle</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-[2.6rem]">
              Quelques véhicules réellement disponibles dans le catalogue.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Les modèles affichés ici proviennent des données du site. Ils reflètent la flotte, les catégories et les prix que les clients peuvent consulter.
            </p>
          </div>

          <Link href="/voitures" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
            Voir toutes les offres
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredCars.length > 0 ? (
            featuredCars.map((car) => <FleetCard key={car.id} car={car} />)
          ) : (
            <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/10 bg-white/88 px-6 py-14 text-center text-sm text-muted-foreground">
              Aucune voiture n'est disponible pour le moment.
            </div>
          )}
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Marques partenaires</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-[2.6rem]">
            Les logos sont alimentés par les vraies marques du catalogue.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            Lorsque les marques sont renseignées dans l’administration ou dans les données de démo, elles remontent automatiquement sur le site public.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brandTiles.length > 0 ? (
            brandTiles.map((brand) => (
              <div
                key={brand.name}
                className="flex min-h-[110px] items-center justify-center rounded-[1.35rem] border border-black/8 bg-white px-5 py-5 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.18)]"
              >
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className="max-h-10 max-w-[8rem] object-contain" />
                ) : (
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                    {brand.name}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/10 bg-white/88 px-6 py-14 text-center text-sm text-muted-foreground">
              Aucune marque n'est encore renseignée.
            </div>
          )}
        </div>
      </section>

      <section className="pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">Avis publics</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-[2.6rem]">
              Les retours clients visibles sur le site.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Les notes et les commentaires affichés ici proviennent des avis publiés par les clients. Ils apportent une preuve sociale concrète.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Star className="h-4 w-4 text-amber-400" />
            {averageRating ? `${averageRating.toFixed(1)}/5 de moyenne` : "Pas encore de note"}
          </div>
        </div>

        {testimonials.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((testimonial) => (
              <ReviewCard
                key={testimonial.id}
                customerName={testimonial.customerName}
                location={testimonial.location}
                carLabel={testimonial.carLabel}
                score={testimonial.score}
                serviceScore={testimonial.serviceScore}
                comment={testimonial.comment}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-black/10 bg-white/88 px-6 py-14 text-center text-sm text-muted-foreground">
            Aucun avis public n'a encore été publié.
          </div>
        )}
      </section>
    </div>
  );
}
