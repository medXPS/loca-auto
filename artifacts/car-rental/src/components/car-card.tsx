import { Link } from "wouter";
import { useMemo, useState, type ComponentType } from "react";
import { Car } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, cn, FUEL_TRANSLATIONS } from "@/lib/utils";
import { ArrowRight, Fuel, ImageIcon, Settings2 } from "lucide-react";

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

function SpecLine({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CarCard({ car, variant = "featured" }: CarCardProps) {
  const isCompact = variant === "compact";
  const [imageFailed, setImageFailed] = useState(false);
  const { searchParams } = useMemo(resolveQueryContext, []);

  const searchParamsString = searchParams.toString();
  const detailHref = `/voitures/${car.id}${searchParamsString ? `?${searchParamsString}` : ""}`;

  const reservationParams = new URLSearchParams(searchParamsString);
  reservationParams.set("reserve", "1");
  const reserveHref = `/voitures/${car.id}?${reservationParams.toString()}`;

  const fuelLabel = FUEL_TRANSLATIONS[car.fuelType] || car.fuelType;
  const transmissionLabel = car.transmission === "AUTOMATIQUE" ? "Automatique" : "Manuelle";

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-[1.5rem] border border-border/70 bg-white shadow-[0_16px_40px_-28px_rgba(16,23,34,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-34px_rgba(16,23,34,0.2)]",
        isCompact ? "lg:grid lg:grid-cols-[260px_minmax(0,1fr)_230px]" : "flex h-full flex-col",
      )}
    >
      <Link
        href={detailHref}
        className={cn("relative block overflow-hidden bg-muted", isCompact ? "min-h-[220px]" : "aspect-[16/11]")}
        aria-label={`Voir la fiche de ${car.brand} ${car.model}`}
      >
        {car.mainImageUrl && !imageFailed ? (
          <img
            src={car.mainImageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="mx-auto h-11 w-11 opacity-45" />
              <p className="mt-2 text-sm">Aucune image</p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.04),rgba(7,15,31,0.24))]" />
      </Link>

      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <div className="space-y-2">
          <Link href={detailHref} className="inline-flex w-fit">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {car.brand} {car.model}
            </h3>
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} />
          <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} />
        </div>

        {!isCompact && (
          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prix par jour</p>
            <p className="mt-1 text-3xl font-semibold text-primary">{formatPrice(car.dailyPrice)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Paiement à l'agence</p>
          </div>
        )}

        {!isCompact && (
          <div className="mt-auto pt-5">
            <Button asChild className="rounded-full bg-primary px-5 text-primary-foreground">
              <Link href={reserveHref}>
                Réserver
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {isCompact && (
        <div className="flex flex-col justify-between border-t border-border/70 bg-muted/15 p-5 lg:border-l lg:border-t-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prix par jour</p>
            <p className="mt-1 text-3xl font-semibold text-primary">{formatPrice(car.dailyPrice)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Paiement à l'agence</p>
          </div>

          <div className="mt-5">
            <Button asChild className="w-full rounded-full bg-primary px-5 text-primary-foreground">
              <Link href={reserveHref}>
                Réserver
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
