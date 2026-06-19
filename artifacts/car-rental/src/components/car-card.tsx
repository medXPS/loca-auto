import { Link } from "wouter";
import { useMemo, useState, type CSSProperties, type ComponentType } from "react";
import { Car } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, FUEL_TRANSLATIONS } from "@/lib/utils";
import { ArrowRight, BarChart3, Fuel, Heart, ImageIcon, Settings2, Users } from "lucide-react";

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
  tone = "light",
}: {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  label: string;
  value: string;
  tone?: "light" | "dark";
}) {
  const isDarkTone = tone === "dark";
  const labelStyle: CSSProperties | undefined = isDarkTone ? { color: "rgba(255,255,255,0.9)" } : undefined;
  const valueStyle: CSSProperties | undefined = isDarkTone ? { color: "#ffffff" } : undefined;
  const iconStyle: CSSProperties | undefined = isDarkTone ? { color: "#ffffff" } : undefined;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
        isDarkTone ? "border-white/10 bg-white/5" : "border-border/70 bg-muted/15"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isDarkTone ? "text-white" : "text-primary"}`} style={iconStyle} />
      <div className="min-w-0">
        <p
          className={`text-[11px] uppercase tracking-[0.14em] ${isDarkTone ? "text-white" : "text-muted-foreground"}`}
          style={labelStyle}
        >
          {label}
        </p>
        <p className={`truncate text-sm font-semibold ${isDarkTone ? "text-white" : "text-foreground"}`} style={valueStyle}>
          {value}
        </p>
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
  const ratingSummary = (car as any).ratingSummary;
  const brandMeta = (car as any).brandMeta;
  const agency = (car as any).agency;

  if (isCompact) {
    return (
      <Card className="group overflow-hidden rounded-[1.6rem] border border-border/70 bg-white shadow-[0_16px_35px_-28px_rgba(16,23,34,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_rgba(16,23,34,0.18)]">
        <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)_220px]">
          <Link
            href={detailHref}
            className="relative block min-h-[220px] overflow-hidden bg-muted lg:min-h-[190px]"
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

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.06),rgba(7,15,31,0.28))]" />
          </Link>

          <div className="flex flex-col justify-between p-5 lg:p-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={detailHref} className="inline-flex w-fit items-center gap-2">
                    {brandMeta?.logoUrl && (
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border bg-white p-1">
                        <img src={brandMeta.logoUrl} alt={car.brand} className="max-h-full max-w-full object-contain" />
                      </span>
                    )}
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {car.brand} {car.model}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {agency?.name || car.city || "Maroc"} - {car.year} - {car.category}
                  </p>
                  {ratingSummary?.count > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      {ratingSummary.average}/5 - {ratingSummary.count} avis verifies
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Disponible
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} />
                <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} />
                <SpecLine icon={Users} label="Places" value={`${car.seats} places`} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prix par jour</p>
                <p className="mt-1 text-3xl font-semibold text-primary">{formatPrice(car.dailyPrice)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Par jour</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-full border-border/70 bg-white">
                  <BarChart3 className="h-4 w-4" />
                  Comparer
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-border/70 bg-white">
                  <Heart className="h-4 w-4" />
                  Favori
                </Button>
                <Button asChild className="rounded-full bg-[#F04B45] px-5 text-primary-foreground">
                  <Link href={reserveHref}>
                    Reserver
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden rounded-[1.85rem] border border-white/8 bg-[linear-gradient(180deg,#07101f_0%,#040712_100%)] text-white shadow-[0_26px_60px_-36px_rgba(16,23,34,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_80px_-34px_rgba(16,23,34,0.55)]">
      <Link
        href={detailHref}
        className="relative block aspect-[16/11] overflow-hidden bg-muted"
        aria-label={`Voir la fiche de ${car.brand} ${car.model}`}
      >
        {car.mainImageUrl && !imageFailed ? (
          <img
            src={car.mainImageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
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

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.6))]" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <div className="rounded-full bg-[#F04B45] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_-12px_rgba(240,75,69,0.95)]">
            Disponible
          </div>
          {brandMeta?.logoUrl && (
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/92 p-1">
              <img src={brandMeta.logoUrl} alt={car.brand} className="max-h-full max-w-full object-contain" />
            </span>
          )}
        </div>
        {ratingSummary?.count > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
            {ratingSummary.average}/5
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.2em] text-white">{car.category}</p>
            <h3 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white transition-colors group-hover:text-[#ffd3d0]">
              {car.brand} {car.model}
            </h3>
            <p className="mt-1 text-xs text-white/85">{agency?.name || car.city || "Maroc"}</p>
          </div>
          <div className="rounded-[1.15rem] border border-white/10 bg-white/8 px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white">A partir de</p>
            <p className="text-3xl font-semibold tracking-tight text-white">{formatPrice(car.dailyPrice)}</p>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} tone="dark" />
          <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} tone="dark" />
          <SpecLine icon={Users} label="Places" value={`${car.seats} places`} tone="dark" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
          <span>Disponible a {agency?.name || car.city || "Maroc"}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Reservation rapide</span>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1 rounded-full bg-white text-slate-950 hover:bg-white/95">
            <Link href={reserveHref}>
              Reserver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
