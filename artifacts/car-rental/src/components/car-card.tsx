import { Link } from "wouter";
import { useMemo, useState, type ComponentType } from "react";
import { Car } from "@workspace/api-client-react";
import { calculateRentalDays } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice, cn, CATEGORY_TRANSLATIONS, FUEL_TRANSLATIONS } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  DoorClosed,
  Fuel,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Settings2,
  Users,
} from "lucide-react";

interface CarCardProps {
  car: Car;
  variant?: "featured" | "compact";
}

function resolveQueryContext() {
  if (typeof window === "undefined") {
    return { searchParams: new URLSearchParams() };
  }

  return { searchParams: new URLSearchParams(window.location.search) };
}

function FeatureItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-[#faf7f2] px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CarCard({ car, variant = "featured" }: CarCardProps) {
  const isCompact = variant === "compact";
  const isAvailable = car.status === "AVAILABLE";
  const [imageFailed, setImageFailed] = useState(false);
  const { searchParams } = useMemo(resolveQueryContext, []);

  const searchParamsString = searchParams.toString();
  const detailHref = `/voitures/${car.id}${searchParamsString ? `?${searchParamsString}` : ""}`;

  const reservationParams = new URLSearchParams(searchParamsString);
  reservationParams.set("reserve", "true");
  const reserveHref = `/voitures/${car.id}?${reservationParams.toString()}`;

  const startDate = searchParams.get("startDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const rentalDays = startDate && returnDate ? calculateRentalDays(startDate, returnDate) : 0;
  const estimatedPrice =
    rentalDays > 0
      ? rentalDays >= 7 && car.weeklyPrice
        ? Math.floor(rentalDays / 7) * car.weeklyPrice + (rentalDays % 7) * car.dailyPrice
        : rentalDays * car.dailyPrice
      : null;

  const categoryLabel = CATEGORY_TRANSLATIONS[car.category] || car.category;
  const fuelLabel = FUEL_TRANSLATIONS[car.fuelType] || car.fuelType;
  const reserveLabel = isCompact ? "Voir l'offre" : "Réserver";
  const transmissionLabel = car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle";
  const heroImage = car.mainImageUrl;
  const headline = `${car.brand} ${car.model}`;
  const priceLabel = estimatedPrice ? formatPrice(estimatedPrice) : formatPrice(car.dailyPrice);
  const priceDescription = estimatedPrice ? `Prix pour ${rentalDays} jours` : "Tarif journalier";

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-[1.75rem] border border-black/8 bg-white/94 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_rgba(16,23,34,0.22)]",
        isCompact
          ? "shadow-[0_20px_45px_-28px_rgba(16,23,34,0.16)]"
          : "flex h-full flex-col shadow-[0_18px_50px_-28px_rgba(16,23,34,0.16)]",
      )}
    >
      <div
        className={cn(
          isCompact
            ? "grid min-h-[320px] gap-0 lg:grid-cols-[260px_minmax(0,1fr)_245px]"
            : "flex h-full flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-[linear-gradient(135deg,rgba(12,17,27,0.98),rgba(31,41,55,0.94))]",
            isCompact ? "min-h-[250px]" : "aspect-[16/11]",
          )}
        >
          {heroImage && !imageFailed ? (
            <img
              src={heroImage}
              alt={headline}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-white/70">
              <ImageIcon className="h-11 w-11 opacity-45" />
              <span className="text-sm">Aucune image disponible</span>
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.14),rgba(7,15,31,0.68))]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(255,106,43,0.16))]" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={car.status}
              type="car"
              className="border-white/20 bg-white/92 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground shadow-sm"
            />
            <span className="rounded-full border border-white/16 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
              {categoryLabel}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
            <div className="max-w-[72%]">
              <p className="text-xs uppercase tracking-[0.2em] text-white/66">{car.city || "Maroc"}</p>
              <h3 className="mt-1 text-lg font-semibold leading-tight text-balance">{headline}</h3>
              <p className="mt-1 text-xs text-white/72">
                {car.year} · {fuelLabel} · {transmissionLabel}
              </p>
            </div>
            {estimatedPrice && isCompact && (
              <div className="rounded-2xl border border-white/14 bg-black/30 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/58">Prix total</p>
                <p className="text-lg font-semibold text-white">{formatPrice(estimatedPrice)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 lg:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Réservation rapide
                </span>
                {car.insuranceIncluded && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Assurance incluse
                  </span>
                )}
              </div>

              {!isCompact && (
                <>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">{headline}</h3>
                  <p className="text-sm text-muted-foreground">
                    {car.year} · {categoryLabel} · {car.city || "Maroc"}
                  </p>
                </>
              )}
            </div>

            {!isCompact && (
              <div className="rounded-2xl border border-black/8 bg-[#101722] px-4 py-3 text-right text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/58">À partir de</p>
                <p className="text-2xl font-semibold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="text-xs text-white/68">par jour</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureItem icon={Settings2} label="Boîte" value={transmissionLabel} />
            <FeatureItem icon={Fuel} label="Carburant" value={fuelLabel} />
            <FeatureItem icon={Users} label="Places" value={`${car.seats} sièges`} />
            <FeatureItem icon={DoorClosed} label="Portes" value={`${car.doors} portes`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {car.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {car.city}
              </span>
            )}
            {car.mileageLimit && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {car.mileageLimit} km/jour
              </span>
            )}
            {car.depositAmount && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Caution {formatPrice(car.depositAmount)}
              </span>
            )}
          </div>

          {!isCompact && (
            <div className="mt-auto rounded-2xl border border-black/8 bg-[linear-gradient(135deg,rgba(255,106,43,0.08),rgba(16,23,34,0.03))] p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{priceDescription}</p>
                  <p className="text-3xl font-semibold text-primary">{priceLabel}</p>
                  <p className="text-sm text-muted-foreground">
                    {estimatedPrice ? "Total basé sur la période sélectionnée" : "Réservation claire et sans frais cachés"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
                    <Link href={detailHref}>Voir détails</Link>
                  </Button>
                  {isAvailable ? (
                    <Button asChild className="rounded-full px-5 marketing-accent-button">
                      <Link href={reserveHref}>Demander la location</Link>
                    </Button>
                  ) : (
                    <Button className="rounded-full px-5 marketing-accent-button opacity-70" disabled>
                      Indisponible
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isCompact && (
          <div className="flex flex-col justify-between border-t border-black/8 bg-[linear-gradient(180deg,rgba(16,23,34,0.98),rgba(25,35,52,0.96))] p-5 text-white lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/52">{priceDescription}</p>
                <p className="mt-1 text-3xl font-semibold text-primary">{priceLabel}</p>
                <p className="text-sm text-white/68">Annulation flexible</p>
              </div>

              <div className="grid gap-2 text-sm text-white/68">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Assistance et documents clairs
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Réservation immédiate en ligne
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Button asChild variant="outline" className="w-full rounded-full border-white/14 bg-white/6 px-5 text-white hover:bg-white/10 hover:text-white">
                <Link href={detailHref}>
                  Voir le véhicule
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              {isAvailable ? (
                <Button asChild className="w-full rounded-full px-5 marketing-accent-button">
                  <Link href={reserveHref}>{reserveLabel}</Link>
                </Button>
              ) : (
                <Button className="w-full rounded-full px-5 marketing-accent-button opacity-70" disabled>
                  Indisponible
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
