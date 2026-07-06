import { Link } from "wouter";
import { useMemo, useState, type CSSProperties, type ComponentType } from "react";
import { Car } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, FUEL_TRANSLATIONS } from "@/lib/utils";
import { formatAvailabilityDate, getAvailabilityCopy } from "@/lib/car-availability";
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
  const availabilityCopy = getAvailabilityCopy(car);
  const depositAmount = Number(car.depositAmount ?? 0);
  const hasDepositAmount = Number.isFinite(depositAmount) && depositAmount > 0;

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
                    <h3 className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
                      {car.brand} {car.model}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {agency?.name || car.city || "Maroc"} - {car.year} - {car.category}
                  </p>
                  {ratingSummary?.count > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      {ratingSummary.average}/5 - {ratingSummary.count} avis vérifiés
                    </p>
                  )}
                  {availabilityCopy.isBlocked && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      {availabilityCopy.label}
                    </p>
                  )}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    availabilityCopy.isBlocked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {availabilityCopy.badge}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} />
                <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} />
                <SpecLine icon={Users} label="Places" value={`${car.seats} places`} />
              </div>
            </div>

              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:w-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Prix par jour</p>
                  <p className="mt-1 text-2xl font-semibold text-primary sm:text-3xl">{formatPrice(car.dailyPrice)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Par jour</p>
                  {hasDepositAmount && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Caution: {formatPrice(depositAmount)}
                    </p>
                  )}
                </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button variant="outline" size="sm" className="w-full rounded-full border-border/70 bg-white sm:w-auto">
                  <BarChart3 className="h-4 w-4" />
                  Comparer
                </Button>
                <Button variant="outline" size="sm" className="w-full rounded-full border-border/70 bg-white sm:w-auto">
                  <Heart className="h-4 w-4" />
                  Favori
                </Button>
                <Button asChild className="w-full rounded-full bg-[#F04B45] px-5 text-primary-foreground sm:w-auto">
                  <Link href={reserveHref}>
                    Réserver
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
    <Card className="group overflow-hidden rounded-[1.85rem] border border-slate-200/80 bg-white text-slate-950 shadow-[0_26px_60px_-36px_rgba(16,23,34,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_80px_-34px_rgba(16,23,34,0.28)]">
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

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,31,0.04),rgba(7,15,31,0.56))]" />
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-5.5rem)] flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#F04B45] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_-12px_rgba(240,75,69,0.95)]">
              {availabilityCopy.badge}
            </div>
            {brandMeta?.logoUrl && (
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/92 p-1">
                <img src={brandMeta.logoUrl} alt={car.brand} className="max-h-full max-w-full object-contain" />
              </span>
            )}
          </div>
          {availabilityCopy.availableFrom && (
            <div className="inline-flex w-fit rounded-full border border-white/15 bg-slate-950/45 px-3 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
              {availabilityCopy.isBlocked
                ? `Disponible à partir du ${formatAvailabilityDate(availabilityCopy.availableFrom)}`
                : availabilityCopy.label}
            </div>
          )}
        </div>
        {ratingSummary?.count > 0 && (
          <div className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
            {ratingSummary.average}/5
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.2em] text-white">{car.category}</p>
            <h3 className="mt-1 truncate text-xl font-semibold tracking-tight text-white transition-colors group-hover:text-[#ffd3d0] sm:text-2xl">
              {car.brand} {car.model}
            </h3>
            <p className="mt-1 text-xs text-white/85">{agency?.name || car.city || "Maroc"}</p>
          </div>
          <div className="w-full rounded-[1.15rem] border border-white/12 bg-white/92 px-4 py-3 text-left backdrop-blur-sm sm:w-auto sm:text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">À partir de</p>
            <p className="text-2xl font-semibold tracking-tight text-[#F04B45] sm:text-3xl">{formatPrice(car.dailyPrice)}</p>
            {hasDepositAmount && (
              <p className="mt-1 text-xs font-medium text-slate-600">
                Caution: {formatPrice(depositAmount)}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-4 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <SpecLine icon={Settings2} label="Transmission" value={transmissionLabel} />
          <SpecLine icon={Fuel} label="Carburant" value={fuelLabel} />
          <SpecLine icon={Users} label="Places" value={`${car.seats} places`} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="text-slate-700">Réservation rapide</span>
          <span className="rounded-full bg-[#F04B45]/10 px-3 py-1 text-xs font-semibold text-[#F04B45]">
            {availabilityCopy.badge}
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1 rounded-full bg-[#F04B45] text-white hover:bg-[#ec3c36]">
            <Link href={reserveHref}>
              Réserver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
