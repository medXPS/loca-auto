import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCars } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { CarCard } from "@/components/car-card";
import { ReservationSearchBar } from "@/components/reservation-search-bar";
import { Seo } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { fetchBrands } from "@/lib/fleet-catalog";

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
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F04B45]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-slate-900 md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">{description}</p>
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
  });
  const { data: citiesSource } = useListCars({
    limit: 200,
    sortBy: "year_desc",
  });
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const cities = useMemo(() => {
    const values = new Set<string>();

    for (const car of citiesSource?.cars ?? []) {
      if (car.city?.trim()) {
        values.add(car.city.trim());
      }
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

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate);
    if (returnDate) params.set("returnDate", returnDate);

    setLocation(`/reservation${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="flex flex-col bg-[radial-gradient(circle_at_top,rgba(247,244,240,0.9),rgba(255,255,255,1)_48%)]">
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

      <section className="container mx-auto px-4 pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-slate-950 text-white shadow-[0_32px_80px_-42px_rgba(16,23,34,0.42)]">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80"
            alt="Voiture premium sur route"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(7,14,27,0.94),rgba(7,14,27,0.76)_52%,rgba(7,14,27,0.24))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(240,75,69,0.18),transparent_22%)]" />

          <div className="relative z-10 px-6 py-8 md:px-8 lg:px-10 lg:py-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.82fr)] lg:items-center">
              <div className="max-w-3xl lg:py-8">
                <p className="text-xs font-medium uppercase tracking-[0.34em] text-white/56">Votre voyage, notre passion</p>
                <h1 className="mt-5 font-serif text-5xl leading-[0.94] text-balance md:text-6xl lg:text-7xl">
                  Roulez librement
                  <span className="block text-[#F04B45]">vivez le Maroc.</span>
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">
                  Des voitures selectionnees avec soin, un service premium et des prix clairs. Recherchez vos dates,
                  choisissez votre ville et lancez votre reservation en quelques clics.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <div className="flex items-center -space-x-2">
                    {["AM", "SK", "YR"].map((label) => (
                      <div
                        key={label}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/15 text-[11px] font-semibold text-white backdrop-blur-sm"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>4,8/5</span>
                      <span className="text-[#FFCC66]">★★★★★</span>
                    </div>
                    <p className="text-sm text-white/64">+1200 clients satisfaits</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full bg-white px-6 text-slate-950 hover:bg-white/95">
                    <Link href="/voitures">
                      Voir les vehicules
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/8 px-6 text-white hover:bg-white/12 hover:text-white">
                    <a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <div className="w-full max-w-[430px] justify-self-end">
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
                  variant="compact"
                />
              </div>
            </div>
          </div>
        </div>

      </section>

      {brandShowcase.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_20px_55px_-36px_rgba(16,23,34,0.18)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#F04B45]">Marques disponibles</p>
                <p className="mt-1 text-sm text-slate-500">Un bandeau vivant avec les logos deja presentes dans votre flotte.</p>
              </div>
            </div>

            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
              <div
                className="flex min-w-max items-center gap-4"
                style={{ animation: "home-brand-marquee 28s linear infinite" }}
              >
                {[...brandShowcase, ...brandShowcase].map((brand, index) => (
                  <div
                    key={`${brand.key}-${index}`}
                    className="flex h-16 min-w-[180px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-[#FAFBFF] px-5"
                  >
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="h-8 max-w-[82px] object-contain" />
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{brand.name}</span>
                    )}
                    <span className="text-sm font-medium text-slate-500">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 pb-16 pt-16 lg:pb-20 lg:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Selection populaire"
            title="Nos voitures les plus demandees"
            description="Une presentation plus premium et plus proche du design partage, avec un acces direct vers la fiche vehicule et la reservation."
          />
          <Link href="/voitures" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Voir toutes les offres
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_16px_35px_-28px_rgba(16,23,34,0.14)]">
                  <div className="h-64 animate-pulse bg-muted/60" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-1/2 animate-pulse rounded-full bg-muted/60" />
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted/60" />
                    <div className="h-16 animate-pulse rounded-2xl bg-muted/60" />
                  </div>
                </div>
              ))
            : featuredCars?.cars?.slice(0, 3).map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>

      <style>{`
        @keyframes home-brand-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
