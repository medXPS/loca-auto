import { useMemo, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { Car, useListCars } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { ReservationSearchBar } from "@/components/reservation-search-bar";
import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { fetchBrands } from "@/lib/fleet-catalog";
import { getAvailabilityCopy, formatAvailabilityDate } from "@/lib/car-availability";
import { CATEGORY_TRANSLATIONS, FUEL_TRANSLATIONS, formatPrice } from "@/lib/utils";
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Fuel,
  Headset,
  Heart,
  MapPin,
  Settings2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

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
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#ff4d43]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-2xl leading-tight text-slate-950 sm:text-3xl md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">{description}</p>
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
    <article className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_22px_56px_-34px_rgba(15,23,42,0.18)]">
      <Link href={detailHref} className="group relative block aspect-[4/3] overflow-hidden bg-slate-100">
        {car.mainImageUrl ? (
          <img
            src={car.mainImageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
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

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.06),rgba(7,15,31,0.3))]" />

        <div className="absolute left-4 top-4 flex max-w-[calc(100%-5.5rem)] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${
                availabilityCopy.isBlocked
                  ? "bg-[#ff4d43] text-white"
                  : "bg-[#17b26a] text-white"
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
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            {categoryLabel}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            {car.brand} {car.model}
          </h3>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4 text-[#ff4d43]" />
            {agency?.name || car.city || "Maroc"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SpecChip icon={Settings2} label="Transmission" value={transmissionLabel} />
          <SpecChip icon={Fuel} label="Carburant" value={fuelLabel} />
          <SpecChip icon={Users} label="Places" value={`${car.seats} places`} />
        </div>

        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">A partir de</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {formatPrice(car.dailyPrice)}
              </p>
              <p className="text-xs text-slate-500">/ jour</p>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {availabilityCopy.isBlocked && availabilityCopy.availableFrom
              ? `Disponible a partir du ${formatAvailabilityDate(availabilityCopy.availableFrom)}`
              : availabilityCopy.label}
          </p>

          <Button
            asChild
            className="mt-4 h-12 w-full rounded-full bg-[#ff4d43] text-white shadow-[0_18px_30px_-18px_rgba(255,77,67,0.68)] hover:bg-[#f03d32]"
          >
            <Link href={reserveHref}>
              Reserver maintenant
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SpecChip({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.15rem] border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-[#ff4d43]">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FeatureColumn({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#ff4d43]/15 bg-[#ff4d43]/10 text-[#ff4d43]">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

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

  const featuredShowcase = useMemo(() => (featuredCars?.cars ?? []).slice(0, 3), [featuredCars]);
  const visibleBrandCards = useMemo(() => {
    if (brandShowcase.length === 0) return [];
    if (brandShowcase.length >= 6) return brandShowcase;

    const padded = [...brandShowcase];

    while (padded.length < 6) {
      padded.push(brandShowcase[padded.length % brandShowcase.length]);
    }

    return padded;
  }, [brandShowcase]);
  const animatedBrandCards = useMemo(() => [...visibleBrandCards, ...visibleBrandCards], [visibleBrandCards]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate);
    if (returnDate) params.set("returnDate", returnDate);

    setLocation(`/reservation${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="bg-[#f4f6fb]">
      <Seo
        title="Location de voitures au Maroc"
        description="Trouvez votre vehicule en quelques clics. Comparez les prix, reservez rapidement et contactez l'agence sur WhatsApp."
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

      <section className="relative overflow-hidden bg-[#070b14]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1587667548502-8fafd51f864b?auto=format&fit=crop&w=1800&q=80"
            alt="Porsche 911 de nuit"
            className="h-full w-full object-cover object-center md:object-[center_46%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,9,18,0.92)_0%,rgba(6,9,18,0.78)_34%,rgba(6,9,18,0.46)_58%,rgba(6,9,18,0.16)_80%,rgba(6,9,18,0.06)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,77,67,0.26),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.14),transparent_18%),radial-gradient(circle_at_76%_82%,rgba(255,255,255,0.08),transparent_18%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-16 pt-8 md:pb-20 md:pt-10 lg:pb-24 lg:pt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.82fr)] lg:items-center">
            <div className="max-w-3xl py-6 lg:py-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[#ff9b95]">
                Votre voyage, notre passion
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[0.96] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.9rem]">
                Louez la voiture
                <span className="block">ideale pour decouvrir</span>
                <span className="block font-serif text-[#ff7269]">le Maroc</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/72">
                Des voitures selectionnees avec soin, un service premium et des prix transparents.
                Reservez en quelques clics et partez l esprit leger.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex -space-x-3">
                  {[
                    { initials: "AM", bg: "from-[#ff756a] to-[#ff4d43]" },
                    { initials: "SK", bg: "from-[#1f9cf0] to-[#0f6ddf]" },
                    { initials: "YR", bg: "from-[#f7b955] to-[#ec7a2f]" },
                    { initials: "NA", bg: "from-[#2fc7a1] to-[#188a7b]" },
                  ].map((person) => (
                    <div
                      key={person.initials}
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br ${person.bg} text-xs font-extrabold text-white shadow-lg`}
                    >
                      {person.initials}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span>4.8/5</span>
                    <span className="flex items-center gap-1 text-[#ffcc66]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/58">+1200 clients satisfaits</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="h-13 w-full rounded-2xl bg-[#ff4d43] px-6 text-white shadow-[0_22px_35px_-20px_rgba(255,77,67,0.72)] hover:bg-[#f03d32] sm:w-auto"
                >
                  <Link href="/voitures">
                    Voir les vehicules
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="w-full max-w-[470px] justify-self-end">
              <ReservationSearchBar
                title="Trouvez votre voiture"
                subtitle="Reservez votre voiture au meilleur prix"
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
        </div>
      </section>

      {visibleBrandCards.length > 0 && (
        <section className="relative z-10 -mt-10">
          <div className="container mx-auto px-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.24)] md:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff4d43]">Marques disponibles</p>
                  <p className="mt-2 text-sm text-slate-500">Un bandeau vivant avec les logos des plus grandes marques.</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
                    aria-label="Marques precedentes"
                  >
                    <ArrowRight className="h-4 w-4 -rotate-180" />
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
                    aria-label="Marques suivantes"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="group mt-5 overflow-hidden">
                <div
                  className="flex w-max items-center gap-2 sm:gap-3 md:gap-4 group-hover:[animation-play-state:paused]"
                  style={{ animation: "home-brand-marquee 24s linear infinite" }}
                >
                  {animatedBrandCards.map((brand, index) => (
                    <div
                      key={`${brand.key}-${index}`}
                      className="flex min-w-[170px] flex-none items-center gap-3 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.24)] sm:min-w-[220px] sm:px-6 sm:py-3.5"
                    >
                      <div className="flex h-9 w-14 items-center justify-center rounded-xl bg-slate-50 sm:h-10 sm:w-[4.5rem]">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="max-h-8 max-w-14 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-slate-700 sm:text-sm">
                            {brand.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-600 sm:text-sm">{brand.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-14 pt-18 md:pb-18 md:pt-22">
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
                  className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_22px_56px_-34px_rgba(15,23,42,0.18)]"
                >
                  <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                  <div className="space-y-4 p-5">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-8 w-3/4 animate-pulse rounded-full bg-slate-200" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Array.from({ length: 3 }).map((__, specIndex) => (
                        <div key={specIndex} className="h-20 animate-pulse rounded-[1.15rem] bg-slate-100" />
                      ))}
                    </div>
                    <div className="h-16 animate-pulse rounded-[1.35rem] bg-slate-200" />
                  </div>
                </div>
              ))
            : featuredShowcase.map((car) => <FeaturedCarCard key={car.id} car={car} />)}
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_32px_70px_-44px_rgba(15,23,42,0.18)] md:px-8 md:py-8">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            <FeatureColumn
              icon={ShieldCheck}
              title="Securite garantie"
              description="Vehicules controles et assures pour votre tranquillite."
            />
            <FeatureColumn
              icon={CircleDollarSign}
              title="Prix transparents"
              description="Aucun frais cache, tout est clair des le depart."
            />
            <FeatureColumn
              icon={Clock3}
              title="Reservation rapide"
              description="Reservez en quelques clics et gagnez du temps."
            />
            <FeatureColumn
              icon={Headset}
              title="Support 7j/7"
              description="Notre equipe reste disponible a tout moment."
            />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes home-brand-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.5rem)); }
        }
      `}</style>
    </div>
  );
}
