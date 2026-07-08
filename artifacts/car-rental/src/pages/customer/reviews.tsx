import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingEditor } from "@/components/rating-editor";
import { fetchEligibleRatings, type EligibleRatingRecord } from "@/lib/fleet-catalog";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, FileText, PenLine, Star } from "lucide-react";

function formatDate(value?: string | Date | null) {
  if (!value) return "Non renseigne";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Non renseigne";
  return date.toLocaleDateString("fr-MA");
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function renderRatingPill(label: string, score: number, tone: "neutral" | "accent" = "neutral") {
  const toneClasses =
    tone === "accent"
      ? "border-[#ff4d43]/15 bg-[#ff4d43]/10 text-[#ff4d43]"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", toneClasses)}>
      <span>{label} {score.toFixed(1)}</span>
      <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
    </span>
  );
}

function ReviewDialog({
  entry,
  onSaved,
}: {
  entry: EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> };
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rating = entry.existingRating;
  const carName = entry.car ? `${entry.car.brand} ${entry.car.model}` : `Reservation #${entry.requestId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900"
          aria-label={`Modifier l'avis pour ${carName}`}
        >
          <PenLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{carName}</DialogTitle>
          <DialogDescription>
            Reservation #{entry.requestId} - avis modifiable a tout moment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50">
            {entry.car?.mainImageUrl ? (
              <img
                src={entry.car.mainImageUrl}
                alt={carName}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                <FileText className="h-10 w-10" />
              </div>
            )}
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-950">{carName}</p>
              <p className="text-xs text-slate-500">
                Du {entry.startDate} au {entry.returnDate}
              </p>
              <div className="flex flex-wrap gap-2">
                {renderRatingPill("Voiture", rating.score)}
                {renderRatingPill("Service", rating.serviceScore ?? rating.score, "accent")}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <RatingEditor
              rentalRequestId={entry.requestId}
              defaultCarScore={rating.score}
              defaultServiceScore={rating.serviceScore ?? rating.score}
              defaultComment={rating.comment}
              onSaved={() => {
                setOpen(false);
                onSaved?.();
              }}
            />

            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/dashboard/demandes/${entry.requestId}`}>Voir la reservation</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({
  entry,
}: {
  entry: EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> };
}) {
  const rating = entry.existingRating;
  const carName = entry.car ? `${entry.car.brand} ${entry.car.model}` : `Reservation #${entry.requestId}`;
  const serviceScore = rating.serviceScore ?? rating.score;

  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          {entry.car?.mainImageUrl ? (
            <img
              src={entry.car.mainImageUrl}
              alt={carName}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{carName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(rating.updatedAt || rating.createdAt || entry.createdAt)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {renderRatingPill("Voiture", rating.score)}
              {renderRatingPill("Service", serviceScore, "accent")}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Commentaire</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              "{rating.comment?.trim() || "Pas de commentaire"}"
            </p>
          </div>

          <ReviewDialog entry={entry} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge variant="outline" className="rounded-full">
          Reservation #{entry.requestId}
        </Badge>
        <Button asChild variant="ghost" className="h-8 px-0 text-sm font-semibold text-[#2f7de1] hover:bg-transparent hover:text-[#2469c2]">
          <Link href={`/dashboard/demandes/${entry.requestId}`}>Voir le detail</Link>
        </Button>
      </div>
    </article>
  );
}

export default function CustomerReviews() {
  const { data: eligibleRatings = [], isLoading } = useQuery({
    queryKey: ["eligible-ratings"],
    queryFn: fetchEligibleRatings,
  });

  const ratedEntries = useMemo(
    () =>
      eligibleRatings
        .filter((item): item is EligibleRatingRecord & { existingRating: NonNullable<EligibleRatingRecord["existingRating"]> } =>
          Boolean(item.existingRating),
        )
        .sort((left, right) => {
          const leftValue = new Date(left.existingRating!.updatedAt || left.existingRating!.createdAt || left.createdAt).getTime();
          const rightValue = new Date(right.existingRating!.updatedAt || right.existingRating!.createdAt || right.createdAt).getTime();
          return rightValue - leftValue;
        }),
    [eligibleRatings],
  );

  const pendingEntries = useMemo(
    () => eligibleRatings.filter((item) => !item.existingRating),
    [eligibleRatings],
  );

  const stats = useMemo(() => {
    const carScores = ratedEntries.map((item) => item.existingRating.score);
    const serviceScores = ratedEntries.map((item) => item.existingRating.serviceScore ?? item.existingRating.score);

    return {
      total: ratedEntries.length,
      carAverage: average(carScores),
      serviceAverage: average(serviceScores),
    };
  }, [ratedEntries]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ff4d43]/15 bg-[#ff4d43]/8 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#ff4d43]">
              <Star className="h-3.5 w-3.5" />
              Avis client
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Tous mes avis
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
              Consultez et modifiez toutes vos notes voiture et service, sans passer par la liste des demandes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="secondary">Total avis: {stats.total}</Badge>
              {renderRatingPill("Voiture moyenne", stats.carAverage)}
              {renderRatingPill("Service moyen", stats.serviceAverage, "accent")}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/profil">
                <ArrowLeft className="h-4 w-4" />
                Retour au profil
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-[#ff4d43]" />
          <h2 className="text-xl font-semibold text-slate-950">Mes avis publiés</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-[1.4rem]" />
            ))}
          </div>
        ) : ratedEntries.length > 0 ? (
          <div className="space-y-4">
            {ratedEntries.map((entry) => (
              <ReviewCard key={entry.requestId} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
            Vous n'avez pas encore publié d'avis.
          </div>
        )}
      </section>

      {pendingEntries.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#ff4d43]" />
            <h2 className="text-xl font-semibold text-slate-950">Locations a noter</h2>
          </div>

          <div className="space-y-4">
            {pendingEntries.map((item) => {
              const carName = item.car ? `${item.car.brand} ${item.car.model}` : `Reservation #${item.requestId}`;

              return (
                <Card key={item.requestId} className="rounded-[1.4rem] border-slate-200 bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)]">
                  <CardHeader className="border-b border-slate-200 pb-4">
                    <CardTitle className="text-base">{carName}</CardTitle>
                    <CardDescription>
                      Du {item.startDate} au {item.returnDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <RatingEditor
                      rentalRequestId={item.requestId}
                      defaultCarScore={item.existingRating?.score}
                      defaultServiceScore={item.existingRating?.serviceScore ?? item.existingRating?.score}
                      defaultComment={item.existingRating?.comment}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
