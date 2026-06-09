import { Link } from "wouter";
import { useMemo, useState } from "react";
import { Car } from "@workspace/api-client-react";
import { calculateRentalDays } from "@workspace/api-client-react/availability";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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

  const heroImage = car.mainImageUrl;

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/70 bg-white/95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-34px_hsl(var(--primary)/0.32)]",
        isCompact
          ? "shadow-[0_20px_45px_-28px_hsl(var(--primary)/0.24)]"
          : "flex h-full flex-col shadow-[0_18px_50px_-28px_hsl(var(--primary)/0.24)]",
      )}
    >
      <div
        className={cn(
          isCompact
            ? "grid min-h-[320px] gap-0 lg:grid-cols-[250px_minmax(0,1fr)_230px]"
            : "flex h-full flex-col",
        )}
      >
        <div className={cn("relative overflow-hidden bg-[linear-gradient(135deg,hsl(214_90%_48%/_0.14),hsl(41_95%_56%/_0.08))]", isCompact ? "min-h-[250px]" : "aspect-[16/11]")}>
          {heroImage && !imageFailed ? (
            <img
              src={heroImage}
              alt={`${car.brand} ${car.model}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageIcon className="h-11 w-11 opacity-45" />
              <span className="text-sm">Aucune image disponible</span>
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.08),rgba(7,15,31,0.42))]" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={car.status}
              type="car"
              className="border-white/20 bg-white/90 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground shadow-sm"
            />
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
              {categoryLabel}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
            <div className="max-w-[70%]">
              <p className="text-xs uppercase tracking-[0.2em] text-white/74">{car.city || "Maroc"}</p>
              <h3 className="mt-1 text-lg font-extrabold leading-tight text-balance">
                {car.brand} {car.model}
              </h3>
              <p className="mt-1 text-xs text-white/78">
                {car.year} · {fuelLabel} · {car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle"}
              </p>
            </div>
            {estimatedPrice && isCompact && (
              <div className="rounded-2xl border border-white/15 bg-white/14 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/72">Prix total</p>
                <p className="text-lg font-extrabold">{formatPrice(estimatedPrice)}</p>
              </div>
            )}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col p-5 lg:p-6", isCompact && "lg:p-6")}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Réservation rapide
                </span>
                {car.insuranceIncluded && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Assurance incluse
                  </span>
                )}
              </div>

              {!isCompact && (
                <>
                  <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {car.year} · {categoryLabel} · {car.city || "Maroc"}
                  </p>
                </>
              )}
            </div>

            {!isCompact && (
              <div className="rounded-2xl border border-primary/10 bg-primary/6 px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">À partir de</p>
                <p className="text-2xl font-extrabold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="text-xs text-muted-foreground">par jour</p>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-3 py-2.5">
              <Settings2 className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Boîte</p>
                <p className="text-sm font-semibold">{car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-3 py-2.5">
              <Fuel className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Carburant</p>
                <p className="text-sm font-semibold">{fuelLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-3 py-2.5">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Places</p>
                <p className="text-sm font-semibold">{car.seats} sièges</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 px-3 py-2.5">
              <DoorClosed className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Portes</p>
                <p className="text-sm font-semibold">{car.doors} portes</p>
              </div>
            </div>
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
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Caution {formatPrice(car.depositAmount)}
              </span>
            )}
          </div>

          {isCompact ? (
            <div className="mt-6 hidden rounded-2xl border border-border/70 bg-white/90 p-4 shadow-sm lg:block">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {estimatedPrice ? `Prix pour ${rentalDays} jours` : "Prix par jour"}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-foreground">
                    {estimatedPrice ? formatPrice(estimatedPrice) : formatPrice(car.dailyPrice)}
                  </p>
                  <p className="text-sm text-emerald-700">Annulation flexible</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isAvailable ? (
                    <Button asChild className="rounded-full bg-emerald-500 px-5 text-white shadow-[0_18px_30px_-18px_rgba(34,197,94,0.75)] hover:bg-emerald-600">
                      <Link href={reserveHref}>{reserveLabel}</Link>
                    </Button>
                  ) : (
                    <Button className="rounded-full bg-emerald-500 px-5 text-white opacity-70" disabled>
                      {reserveLabel}
                    </Button>
                  )}
                  <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
                    <Link href={detailHref}>
                      Détails
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-auto rounded-2xl border border-border/70 bg-gradient-to-br from-primary/7 via-white to-secondary/7 p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {estimatedPrice ? `Prix estimé pour ${rentalDays} jours` : "Tarif journalier"}
                  </p>
                  <p className="text-3xl font-extrabold text-primary">
                    {estimatedPrice ? formatPrice(estimatedPrice) : formatPrice(car.dailyPrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {estimatedPrice ? "Total basé sur la période sélectionnée" : "Réservation claire et sans frais cachés"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
                    <Link href={detailHref}>
                      Voir détails
                    </Link>
                  </Button>
                  {isAvailable ? (
                    <Button asChild className="rounded-full bg-emerald-500 px-5 text-white shadow-[0_18px_30px_-18px_rgba(34,197,94,0.75)] hover:bg-emerald-600">
                      <Link href={reserveHref}>Demander la location</Link>
                    </Button>
                  ) : (
                    <Button className="rounded-full bg-emerald-500 px-5 text-white opacity-70" disabled>
                      Indisponible
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isCompact && (
          <div className="flex flex-col justify-between border-t border-border/70 bg-[linear-gradient(180deg,hsl(214_90%_48%/_0.05),hsl(41_95%_56%/_0.05))] p-5 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {estimatedPrice ? `Prix pour ${rentalDays} jours` : "Tarif journalier"}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-primary">
                  {estimatedPrice ? formatPrice(estimatedPrice) : formatPrice(car.dailyPrice)}
                </p>
                <p className="text-sm text-emerald-700">Annulation flexible</p>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Assistance et documents clairs
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Réservation immédiate en ligne
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {isAvailable ? (
                <Button asChild className="w-full rounded-full bg-emerald-500 px-5 text-white shadow-[0_18px_30px_-18px_rgba(34,197,94,0.75)] hover:bg-emerald-600">
                  <Link href={reserveHref}>Voir l'offre</Link>
                </Button>
              ) : (
                <Button className="w-full rounded-full bg-emerald-500 px-5 text-white opacity-70" disabled>
                  Indisponible
                </Button>
              )}
              <Button asChild variant="outline" className="w-full rounded-full border-border/70 bg-white px-5">
                <Link href={detailHref}>
                  Voir le véhicule
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isCompact && (
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-4 lg:px-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              {car.insuranceIncluded ? "Assurance incluse" : "Protection standard"}
            </span>
            {car.weeklyPrice && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {formatPrice(car.weeklyPrice)}/sem.
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full border-border/70 bg-white px-5">
              <Link href={detailHref}>
                Voir détails
              </Link>
            </Button>
            {isAvailable ? (
              <Button asChild className="rounded-full bg-emerald-500 px-5 text-white shadow-[0_18px_30px_-18px_rgba(34,197,94,0.75)] hover:bg-emerald-600">
                <Link href={reserveHref}>Réserver</Link>
              </Button>
            ) : (
              <Button className="rounded-full bg-emerald-500 px-5 text-white opacity-70" disabled>
                Indisponible
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
