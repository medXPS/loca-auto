import { useMemo, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Car, useListCars } from "@workspace/api-client-react";
import { ReservationSearchBar } from "@/components/reservation-search-bar";
import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { fetchBrands, fetchPublicRatings } from "@/lib/fleet-catalog";
import { getAvailabilityCopy, formatAvailabilityDate } from "@/lib/car-availability";
import { CATEGORY_TRANSLATIONS, FUEL_TRANSLATIONS, formatPrice } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Fuel,
  Headset,
  Heart,
  KeyRound,
  MapPin,
  Settings2,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

type IconType = ComponentType<{ className?: string }>;

const heroPerks = [
  {
    icon: CircleDollarSign,
    title: "Prix transparents",
    description: "Aucun frais cache, tout est clair des le depart.",
  },
  {
    icon: Clock3,
    title: "Annulation flexible",
    description: "Reservez l esprit libre avec une marge de securite.",
  },
  {
    icon: Headset,
    title: "Support 7j/7",
    description: "Une equipe disponible pour vous guider a chaque etape.",
  },
  {
    icon: CarFront,
    title: "Livraison disponible",
    description: "A l aeroport ou a domicile selon votre besoin.",
  },
];

const heroStats = [
  { value: "+1200", label: "Clients satisfaits" },
  { value: "+350", label: "Vehicules disponibles" },
  { value: "20+", label: "Villes couvertes" },
  { value: "4.8/5", label: "Note moyenne" },
];

const steps = [
  {
    icon: CalendarDays,
    title: "Choisissez vos dates",
    description: "Selectionnez la ville, les dates et le lieu de prise en charge.",
  },
  {
    icon: CarFront,
    title: "Choisissez votre voiture",
    description: "Comparez et reservez le vehicule qui vous convient.",
  },
  {
    icon: CreditCard,
    title: "Reservez en ligne",
    description: "Paiement securise et confirmation immediate.",
  },
  {
    icon: KeyRound,
    title: "Recuperez et profitez",
    description: "Recuperez votre voiture et profitez pleinement du trajet.",
  },
];

const testimonials = [
  {
    initials: "SL",
    name: "Sophie L.",
    location: "Paris, France",
    text: "Service impeccable. Voiture propre, recente et equipe tres professionnelle. Je recommande a 100%.",
  },
  {
    initials: "YA",
    name: "Youssef A.",
    location: "Marrakech, Maroc",
    text: "Excellent rapport qualite-prix. Livraison a l aeroport ponctuelle et sans aucun souci.",
  },
  {
    initials: "ED",
    name: "Emma D.",
    location: "Lyon, France",
    text: "Reservation facile et rapide a la fin. La voiture etait parfaite pour notre road trip au Maroc.",
  },
];

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
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl md:text-[2.6rem]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 text-center shadow-[0_12px_30px_-24px_rgba(15,23,42,0.18)]">
      <p className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  description,
  dark = false,
}: {
  icon: IconType;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div
      className={dark
        ? "flex items-start gap-3 rounded-[1.35rem] border border-white/14 bg-white/5 p-4 text-white shadow-[0_18px_42px_-28px_rgba(0,0,0,0.45)] backdrop-blur"
        : "flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.12)]"}
    >
      <div
        className={dark
          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ff4d43]/30 bg-[#ff4d43]/12 text-[#ff7f77]"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ff4d43]/15 bg-[#ff4d43]/10 text-[#ff4d43]"}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className={dark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
          {title}
        </h3>
        <p className={dark ? "mt-1 text-xs leading-5 text-white/70" : "mt-1 text-xs leading-5 text-slate-500"}>
          {description}
        </p>
      </div>
    </div>
  );
}

function SpecLine({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-2 text-[#ff4d43]">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FeaturedCarCard({ car }: { car: Car }) {
  const availabilityCopy = getAvailabilityCopy(car);
  const transmissionLabel = car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle";
  const fuelLabel = FUEL_TRANSLATIONS[car.fuelType] ?? car.fuelType;
  const categoryLabel = CATEGORY_TRANSLATIONS[car.category] ?? car.category;
  const agency = (car as any).agency;
  const brandMeta = (car as any).brandMeta;
  const detailHref = `/voitures/${car.id}`;
  const reserveHref = `/voitures/${car.id}?reserve=1`;

  return (
    <article className="group overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.22)]">
      <Link href={detailHref} className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
        {car.mainImageUrl ? (
          <img
            src={car.mainImageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#111827,#334155)] px-6 text-center text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/56">{categoryLabel}</p>
              <p className="mt-3 text-2xl font-semibold">
                {car.brand} {car.model}
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.04),rgba(7,15,31,0.24))]" />

        <div className="absolute left-4 top-4 flex max-w-[calc(100%-5rem)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${
                availabilityCopy.isBlocked ? "bg-[#ff4d43] text-white" : "bg-[#17b26a] text-white"
              }`}
            >
              {availabilityCopy.badge}
            </span>
            {brandMeta?.logoUrl && (
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/92 p-1 shadow-sm">
                <img src={brandMeta.logoUrl} alt={car.brand} className="max-h-full max-w-full object-contain" />
              </span>
            )}
          </div>

          <span className="inline-flex w-fit rounded-full border border-white/12 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
            {availabilityCopy.availableFrom
              ? `Disponible a partir du ${formatAvailabilityDate(availabilityCopy.availableFrom)}`
              : availabilityCopy.label}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/92 text-slate-700 shadow-sm">
          <Heart className="h-4 w-4" />
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              {categoryLabel}
            </p>
            <h3 className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950">
              {car.brand} {car.model}
            </h3>
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-[#ff4d43]" />
              {agency?.name || car.city || "Maroc"}
            </p>
          </div>

          <div className="shrink-0 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">A partir de</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {formatPrice(car.dailyPrice)}
            </p>
            <p className="text-xs text-slate-500">/ jour</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} />
          <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} />
          <SpecLine icon={Users} label="Places" value={`${car.seats} places`} />
        </div>

        <Button
          asChild
          className="h-12 w-full rounded-full bg-[#ff4d43] text-white shadow-[0_18px_30px_-18px_rgba(255,77,67,0.68)] hover:bg-[#f03d32]"
        >
          <Link href={reserveHref}>
            Reserver maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function StepCard({
  icon: Icon,
  title,
  description,
  hasArrow = false,
}: {
  icon: IconType;
  title: string;
  description: string;
  hasArrow?: boolean;
}) {
  return (
    <div className="relative rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff4d43]/15 bg-[#ff4d43]/10 text-[#ff4d43]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      {hasArrow && <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 xl:block" />}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AA";
}

function TestimonialCard({
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
  const initials = getInitials(customerName);

  return (
    <article className="w-[300px] flex-none rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.16)] sm:w-[330px]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{customerName}</p>
          <p className="text-xs text-slate-500">{location}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              Voiture {score}/5
            </span>
            <span className="rounded-full border border-[#ff4d43]/15 bg-[#ff4d43]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ff4d43]">
              Service {serviceScore}/5
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{comment}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {carLabel}
      </p>
    </article>
  );
}

function BrandCard({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex min-w-[140px] flex-none items-center justify-center rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.18)]">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="max-h-10 max-w-[4.6rem] object-contain" />
      ) : (
        <span className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700">{name}</span>
      )}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const testimonialsTrackRef = useRef<HTMLDivElement>(null);

  const { data: featuredCars, isLoading } = useListCars({
    limit: 6,
    sortBy: "year_desc",
    available: true,
  });
  const { data: citiesSource } = useListCars({
    limit: 200,
    sortBy: "year_desc",
    available: true,
  });
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  const { data: publicRatings } = useQuery({
    queryKey: ["public-ratings"],
    queryFn: fetchPublicRatings,
    staleTime: 60_000,
  });

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of citiesSource?.cars ?? []) {
      if (car.city?.trim()) values.add(car.city.trim());
    }

    if (values.size === 0) {
      ["Casablanca", "Marrakech", "Rabat", "Tanger", "Agadir", "Fes"].forEach((item) => values.add(item));
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, "fr"));
  }, [citiesSource]);

  const brandShowcase = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ key: string; name: string; logoUrl?: string | null }> = [];

    for (const brand of brands) {
      const key = brand.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({ key, name: brand.name, logoUrl: brand.logoUrl });
    }

    for (const car of featuredCars?.cars ?? []) {
      const key = car.brand.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      items.push({ key, name: car.brand, logoUrl: (car as any).brandMeta?.logoUrl });
    }

    return items;
  }, [brands, featuredCars]);

  const visibleBrandCards = useMemo(() => {
    const fallbackBrands: Array<{ key: string; name: string; logoUrl?: string | null }> = [
      { key: "byd", name: "BYD" },
      { key: "ford", name: "Ford" },
      { key: "porsche", name: "Porsche" },
      { key: "hyundai", name: "Hyundai" },
      { key: "mercedes-benz", name: "Mercedes-Benz" },
      { key: "renault", name: "Renault" },
      { key: "kia", name: "Kia" },
      { key: "bmw", name: "BMW" },
    ];

    const base = brandShowcase.length > 0 ? brandShowcase : fallbackBrands;
    const padded = [...base];

    while (padded.length < 8) {
      padded.push(base[padded.length % base.length]);
    }

    return padded.slice(0, 8);
  }, [brandShowcase]);

  const featuredShowcase = useMemo(() => (featuredCars?.cars ?? []).slice(0, 3), [featuredCars]);
  const recentTestimonials = publicRatings?.testimonials ?? [];
  const heroRatingValue = publicRatings?.summary.averageServiceScore;
  const heroRatingLabel = heroRatingValue != null ? `${heroRatingValue.toFixed(2)}/5` : "Aucun avis";
  const heroClientsLabel = publicRatings ? `+${publicRatings.summary.satisfiedClients}` : "...";
  const heroCarsLabel = featuredCars?.total != null ? `+${featuredCars.total}` : "...";
  const heroCitiesLabel = `${cities.length}+`;
  const heroAvatars = recentTestimonials.slice(0, 4);
  const heroStats = [
    { value: heroClientsLabel, label: "Clients satisfaits" },
    { value: heroCarsLabel, label: "Vehicules disponibles" },
    { value: heroCitiesLabel, label: "Villes couvertes" },
    { value: heroRatingLabel, label: "Note moyenne" },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate);
    if (returnDate) params.set("returnDate", returnDate);

    setLocation(`/reservation${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const scrollTrack = (ref: { current: HTMLDivElement | null }, direction: 1 | -1) => {
    ref.current?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  return (
    <div className="bg-[#f5f7fb]">
      <Seo
        title="Location de voitures au Maroc"
        description="Trouvez votre vehicule en quelques clics. Comparez les prix, reservez rapidement et contactez l'agence sur WhatsApp."
        canonical="https://demo-locationauto.shonenx.shop/"
        image="/hero-marrakech-porsche.png"
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

      <section className="relative overflow-hidden bg-[#07101b]">
        <div className="absolute inset-0">
          <img
            src="/hero-marrakech-porsche.png"
            alt="Porsche blanc au coucher du soleil"
            className="h-full w-full object-cover object-[center_55%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,11,20,0.95)_0%,rgba(7,11,20,0.84)_28%,rgba(7,11,20,0.52)_52%,rgba(7,11,20,0.22)_76%,rgba(7,11,20,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,77,67,0.24),transparent_22%),radial-gradient(circle_at_86%_20%,rgba(255,255,255,0.16),transparent_18%),radial-gradient(circle_at_80%_78%,rgba(255,255,255,0.08),transparent_18%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-10 pt-8 md:pb-12 lg:pb-14 lg:pt-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.03fr)_minmax(380px,0.82fr)] lg:items-start">
            <div className="max-w-3xl py-6 text-white lg:py-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#ff7e76] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Votre voyage, notre passion
              </p>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[0.94] tracking-tight text-balance text-white sm:text-5xl md:text-6xl lg:text-[4.8rem]">
                Louez la voiture
                <span className="block">idÃ©ale pour dÃ©couvrir</span>
                <span className="block font-serif text-[#ff6f66]">le Maroc</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/72 sm:text-base">
                Des voitures sÃ©lectionnÃ©es avec soin, un service premium et des prix transparents.
                RÃ©servez en quelques clics.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                {heroAvatars.length > 0 && (
                  <div className="flex -space-x-3">
                    {heroAvatars.map((review, index) => {
                      const bgVariants = [
                        "from-[#ff756a] to-[#ff4d43]",
                        "from-[#1f9cf0] to-[#0f6ddf]",
                        "from-[#f7b955] to-[#ec7a2f]",
                        "from-[#2fc7a1] to-[#188a7b]",
                      ];

                      return (
                        <div
                          key={review.id}
                          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br ${bgVariants[index % bgVariants.length]} text-xs font-extrabold text-white shadow-lg`}
                          title={review.customerName}
                        >
                          {getInitials(review.customerName)}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>{heroRatingLabel}</span>
                    <span className="flex items-center gap-1 text-[#ffcc66]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/58">
                    {publicRatings ? `${heroClientsLabel} clients satisfaits` : "Les premiers avis arrivent"}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-[450px] justify-self-end">
              <ReservationSearchBar
                title="Trouvez votre voiture"
                subtitle="RÃ©servez votre voiture au meilleur prix"
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
                variant="default"
              />
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {heroPerks.map((item) => {
              const Icon = item.icon;
              return <FeatureTile key={item.title} icon={Icon} title={item.title} description={item.description} dark />;
            })}
          </div>

          <div className="mt-4 grid gap-4 rounded-[1.75rem] border border-white/16 bg-white/92 px-4 py-4 shadow-[0_26px_64px_-38px_rgba(0,0,0,0.35)] backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => (
              <StatTile key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {visibleBrandCards.length > 0 && (
        <section className="relative z-10 -mt-6">
          <div className="container mx-auto px-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.18)] md:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff4d43]">
                    Nos marques partenaires
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Les plus grandes marques</p>
                </div>

              </div>

              <div className="mt-5 overflow-hidden">
                <div className="brand-marquee flex w-max">
                  <div className="flex gap-3 pr-3">
                    {visibleBrandCards.map((brand, index) => (
                      <BrandCard key={`${brand.key}-${index}`} name={brand.name} logoUrl={brand.logoUrl} />
                    ))}
                  </div>
                  <div className="flex gap-3 pr-3" aria-hidden="true">
                    {visibleBrandCards.map((brand, index) => (
                      <BrandCard key={`${brand.key}-dup-${index}`} name={brand.name} logoUrl={brand.logoUrl} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-14 pt-16 md:pb-16 md:pt-18">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Selection populaire"
            title="Nos voitures les plus demandees"
            description="Une presentation premium, fidele au design partage, avec un acces direct vers la fiche vehicule et la reservation."
          />

          <Link
            href="/voitures"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            Voir toutes les offres
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.18)]"
                >
                  <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-8 w-3/4 animate-pulse rounded-full bg-slate-200" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((__, specIndex) => (
                        <div key={specIndex} className="h-20 animate-pulse rounded-[1.15rem] bg-slate-100" />
                      ))}
                    </div>
                    <div className="h-12 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              ))
            : featuredShowcase.map((car) => <FeaturedCarCard key={car.id} car={car} />)}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14">
        <SectionHeading
          eyebrow="Comment Ã§a marche"
          title="Louez en 4 Ã©tapes simples"
          description="Le parcours reste fluide et direct, du choix des dates jusqu Ã  la remise des clÃ©s."
        />

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {steps.map((step, index) => (
            <StepCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              description={step.description}
              hasArrow={index < steps.length - 1}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-18">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Ils nous font confiance"
            title="Ce que disent nos clients"
            description="Des retours simples et directs qui confirment l experience de reservation."
          />

          {recentTestimonials.length > 1 && (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scrollTrack(testimonialsTrackRef, -1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                aria-label="Avis precedents"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack(testimonialsTrackRef, 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                aria-label="Avis suivants"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {recentTestimonials.length > 0 ? (
          <div
            ref={testimonialsTrackRef}
            className="mt-8 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {recentTestimonials.map((item) => (
              <TestimonialCard
                key={item.id}
                customerName={item.customerName}
                location={item.location}
                carLabel={item.carLabel}
                score={item.score}
                serviceScore={item.serviceScore}
                comment={item.comment}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.45rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
            Aucun avis client publie pour le moment.
          </div>
        )}
      </section>
    </div>
  );
}
