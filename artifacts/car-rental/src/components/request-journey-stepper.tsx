import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { cn, getStatusLabel } from "@/lib/utils";

type JourneyStep = {
  title: string;
  description: string;
  statuses: string[];
};

const JOURNEY_STEPS: JourneyStep[] = [
  {
    title: "Candidature",
    description: "Demande envoyee et en attente de traitement.",
    statuses: ["PENDING", "UNDER_REVIEW", "CALL_ATTEMPTED"],
  },
  {
    title: "Pieces",
    description: "CIN, passeport et permis a valider.",
    statuses: ["DOCUMENT_SUBMISSION_WINDOW", "WAITING_DOCUMENTS"],
  },
  {
    title: "Verification",
    description: "Vos documents sont recus par l'agence.",
    statuses: ["PENDING_CALL_CONFIRMATION"],
  },
  {
    title: "Confirmation",
    description: "Appel confirme et conditions finalisees.",
    statuses: ["CALL_CONFIRMED", "EXTENDED_PAYMENT_DEADLINE", "WAITING_AGENCY_PAYMENT"],
  },
  {
    title: "Reservation",
    description: "Le vehicule vous est reserve.",
    statuses: ["RESERVED", "PAID"],
  },
  {
    title: "Location",
    description: "La voiture est remise ou en cours d'utilisation.",
    statuses: ["ACTIVE_RENTAL", "CAR_DELIVERED", "RENTED"],
  },
  {
    title: "Cloture",
    description: "Retour du vehicule et dossier termine.",
    statuses: ["CAR_RETURNED", "RETURNED", "COMPLETED"],
  },
];

const STATUS_INDEX = Object.fromEntries(
  JOURNEY_STEPS.flatMap((step, index) => step.statuses.map((status) => [status, index] as const)),
) as Record<string, number>;

const CANCELLATION_STATUSES = new Set(["CANCELLED", "ABANDONED", "REJECTED"]);

function getJourneyMessage(status: string) {
  switch (status) {
    case "PENDING":
    case "UNDER_REVIEW":
    case "CALL_ATTEMPTED":
      return "Votre demande a ete prise en compte. La prochaine etape est la validation des pieces.";
    case "DOCUMENT_SUBMISSION_WINDOW":
    case "WAITING_DOCUMENTS":
      return "Soumettez vos documents maintenant pour debloquer la suite du dossier.";
    case "PENDING_CALL_CONFIRMATION":
      return "Nous avons recu vos pieces. L'equipe revient vers vous pour la confirmation.";
    case "CALL_CONFIRMED":
    case "EXTENDED_PAYMENT_DEADLINE":
    case "WAITING_AGENCY_PAYMENT":
      return "Votre dossier est valide. Il ne reste plus qu'a finaliser la reservation a l'agence.";
    case "RESERVED":
    case "PAID":
      return "Le vehicule est bloque pour vous et la demande avance vers la remise.";
    case "ACTIVE_RENTAL":
    case "CAR_DELIVERED":
    case "RENTED":
      return "La location est en cours. Vous pouvez suivre la progression ici.";
    case "CAR_RETURNED":
    case "RETURNED":
    case "COMPLETED":
      return "La demande est terminee. Le dossier est cloture.";
    case "CANCELLED":
    case "ABANDONED":
    case "REJECTED":
      return "La demande a ete fermee.";
    default:
      return `Statut actuel: ${getStatusLabel(status, "rental")}.`;
  }
}

interface RequestJourneyStepperProps {
  status: string;
  className?: string;
}

export function RequestJourneyStepper({ status, className }: RequestJourneyStepperProps) {
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const isCancelled = CANCELLATION_STATUSES.has(status);
  const currentStep = JOURNEY_STEPS[currentIndex] ?? JOURNEY_STEPS[0];

  return (
    <Card className={cn("overflow-hidden rounded-[1.9rem] border border-primary/10 bg-gradient-to-br from-primary/6 via-background to-secondary/10 shadow-[0_24px_70px_-45px_hsl(var(--primary)/0.5)]", className)}>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Parcours de candidature
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Suivi de votre demande</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{getJourneyMessage(status)}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <StatusBadge status={status} className="px-4 py-1.5" />
            <Button asChild variant="outline" className="rounded-full">
              <a href="#documents">Soumettre mes pieces</a>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="relative min-w-[860px] px-2 pt-2">
            <div className="absolute left-8 right-8 top-[1.95rem] h-0.5 rounded-full bg-border/80" />
            <div className="grid grid-cols-7 gap-3">
              {JOURNEY_STEPS.map((step, index) => {
                const isActive = index === currentIndex;
                const isComplete = index < currentIndex;
                const isPending = index > currentIndex;

                return (
                  <div key={step.title} className="flex min-w-0 flex-col items-center text-center">
                    <div
                      className={cn(
                        "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background text-sm font-bold shadow-sm transition-all",
                        isComplete && "border-emerald-500 bg-emerald-500 text-white",
                        isActive && "border-[#F04B45] bg-[#F04B45] text-white shadow-[0_16px_28px_-18px_rgba(240,75,69,0.95)]",
                        isPending && "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="mt-3 max-w-[120px] space-y-1">
                      <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : isComplete ? "text-foreground" : "text-muted-foreground")}>
                        {step.title}
                      </p>
                      <p className="text-[11px] leading-5 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/10 bg-background/85 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Etape active</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{currentStep.title}</p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-background/85 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Statut actuel</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{getStatusLabel(status, "rental")}</p>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-background/85 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Votre dossier</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {isCancelled ? "Ferme" : "En cours"}
            </p>
          </div>
        </div>

        {isCancelled && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Cette demande a ete fermee. Vous pouvez repartir sur une nouvelle reservation quand vous voulez.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
