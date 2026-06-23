"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flag,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { cn, getStatusLabel } from "@/lib/utils";

type JourneyStep = {
  title: string;
  description: string;
  statuses: string[];
  icon: LucideIcon;
  actionLabel: string;
  actionHref: string;
  actionHint: string;
};

const JOURNEY_STEPS: JourneyStep[] = [
  {
    title: "Candidature",
    description: "Demande envoyee et en attente de traitement.",
    statuses: ["PENDING", "UNDER_REVIEW", "CALL_ATTEMPTED"],
    icon: ClipboardList,
    actionLabel: "Soumettre mes pieces",
    actionHref: "#documents",
    actionHint: "Ouvrez la zone d'envoi pour completer le dossier.",
  },
  {
    title: "Pieces",
    description: "CIN, passeport et permis a valider.",
    statuses: ["DOCUMENT_SUBMISSION_WINDOW", "WAITING_DOCUMENTS"],
    icon: FileText,
    actionLabel: "Soumettre mes pieces",
    actionHref: "#documents",
    actionHint: "Vous pouvez reutiliser ou remplacer vos fichiers ici.",
  },
  {
    title: "Verification",
    description: "Vos documents sont recus par l'agence.",
    statuses: ["PENDING_CALL_CONFIRMATION"],
    icon: ShieldCheck,
    actionLabel: "Verifier les pieces",
    actionHref: "#documents",
    actionHint: "Consultez les fichiers deja envoyes et leur etat.",
  },
  {
    title: "Confirmation",
    description: "Appel confirme et conditions finalisees.",
    statuses: ["CALL_CONFIRMED", "EXTENDED_PAYMENT_DEADLINE", "WAITING_AGENCY_PAYMENT"],
    icon: PhoneCall,
    actionLabel: "Voir le paiement",
    actionHref: "#payment",
    actionHint: "Le paiement a l'agence est la prochaine etape visible.",
  },
  {
    title: "Reservation",
    description: "Le vehicule vous est reserve.",
    statuses: ["RESERVED", "PAID"],
    icon: BadgeCheck,
    actionLabel: "Voir le vehicule reserve",
    actionHref: "#vehicle",
    actionHint: "Rouvrez le vehicule deja bloque pour cette demande.",
  },
  {
    title: "Location",
    description: "La voiture est remise ou en cours d'utilisation.",
    statuses: ["ACTIVE_RENTAL", "CAR_DELIVERED", "RENTED"],
    icon: CarFront,
    actionLabel: "Voir les details de location",
    actionHref: "#details",
    actionHint: "Les dates et le montant sont affiches plus bas.",
  },
  {
    title: "Cloture",
    description: "Retour du vehicule et dossier termine.",
    statuses: ["CAR_RETURNED", "RETURNED", "COMPLETED"],
    icon: Flag,
    actionLabel: "Retour en haut du dossier",
    actionHref: "#request-top",
    actionHint: "Votre demande est cloturee, mais vous pouvez relire le dossier.",
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

function getStepStateLabel(stepIndex: number, currentIndex: number) {
  if (stepIndex < currentIndex) {
    return "Terminee";
  }

  if (stepIndex === currentIndex) {
    return "Etape en cours";
  }

  return "Etape a venir";
}

function getStepStateTone(stepIndex: number, currentIndex: number) {
  if (stepIndex < currentIndex) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (stepIndex === currentIndex) {
    return "border-primary/20 bg-primary/8 text-primary";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getStepDetails(stepIndex: number, currentIndex: number) {
  if (stepIndex < currentIndex) {
    return [
      "Cette etape a deja ete franchie.",
      "Vous pouvez consulter les documents et informations deja envoyes.",
      "Le dossier continue vers la suite du parcours.",
    ];
  }

  if (stepIndex === currentIndex) {
    return [
      "C'est la phase actuellement active dans votre dossier.",
      "La prochaine action utile s'affiche ici au bon moment.",
      "Cliquez sur un autre point pour voir les autres etapes du parcours.",
    ];
  }

  return [
    "Cette etape s'ouvrira quand le dossier avancera.",
    "Le point est deja prepare pour la suite de votre demande.",
    "Vous verrez ici les informations correspondantes a ce moment-la.",
  ];
}

export function RequestJourneyStepper({ status, className }: RequestJourneyStepperProps) {
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const isCancelled = CANCELLATION_STATUSES.has(status);
  const currentStep = JOURNEY_STEPS[currentIndex] ?? JOURNEY_STEPS[0];
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);

  useEffect(() => {
    setSelectedIndex(currentIndex);
  }, [currentIndex]);

  const selectedStep = JOURNEY_STEPS[selectedIndex] ?? JOURNEY_STEPS[currentIndex] ?? JOURNEY_STEPS[0];
  const selectedStateLabel = getStepStateLabel(selectedIndex, currentIndex);
  const selectedStateTone = getStepStateTone(selectedIndex, currentIndex);
  const selectedStepDetails = getStepDetails(selectedIndex, currentIndex);
  const selectedActionVariant =
    selectedIndex < currentIndex ? "secondary" : selectedIndex === currentIndex ? "default" : "outline";
  const SelectedStepIcon = selectedStep.icon;

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

        <p className="text-sm text-muted-foreground">Cliquez sur un point pour afficher le detail de l'etape juste en dessous.</p>

        <div className="overflow-x-auto pb-2">
          <div className="relative min-w-[860px] px-2 pt-2">
            <div className="absolute left-8 right-8 top-[1.95rem] h-0.5 rounded-full bg-border/80" />
            <div className="grid grid-cols-7 gap-3">
              {JOURNEY_STEPS.map((step, index) => {
                const isActive = index === currentIndex;
                const isComplete = index < currentIndex;
                const isPending = index > currentIndex;
                const isSelected = index === selectedIndex;
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className="group flex min-w-0 flex-col items-center text-center outline-none transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
                    aria-pressed={isSelected}
                    aria-label={`Afficher le detail de l'etape ${step.title}`}
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background text-sm font-bold shadow-sm transition-all duration-200",
                        isComplete && "border-emerald-500 bg-emerald-500 text-white",
                        isActive && "border-[#F04B45] bg-[#F04B45] text-white shadow-[0_16px_28px_-18px_rgba(240,75,69,0.95)]",
                        isPending && "border-border bg-muted text-muted-foreground",
                        isSelected && "ring-4 ring-primary/15",
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>

                    <div className="mt-3 max-w-[120px] space-y-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                          getStepStateTone(index, currentIndex),
                          isSelected && "ring-2 ring-primary/10",
                        )}
                      >
                        <StepIcon className="h-3 w-3" />
                        {index + 1}
                      </span>
                      <p
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          isActive || isSelected ? "text-foreground" : isComplete ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] leading-5 text-muted-foreground">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, y: 14, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.992 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="rounded-[1.75rem] border border-primary/10 bg-background/90 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  <SelectedStepIcon className="h-3.5 w-3.5" />
                  Point selectionne
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">{selectedStep.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedStep.description}</p>
                </div>
              </div>

              <span className={cn("inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold", selectedStateTone)}>
                {selectedStateLabel}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {selectedStepDetails.map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-primary">
                Etape active: {currentStep.title}
              </span>
              <span className="rounded-full border border-primary/10 bg-background px-3 py-1.5 text-muted-foreground">
                Statut: {getStatusLabel(status, "rental")}
              </span>
              <span className="rounded-full border border-primary/10 bg-background px-3 py-1.5 text-muted-foreground">
                Dossier {isCancelled ? "ferme" : "en cours"}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-primary/15 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-foreground">{selectedStep.actionHint}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cette action vous emmene directement au bon endroit dans le dossier.
                </p>
              </div>

              <Button asChild variant={selectedActionVariant} className="gap-2 rounded-full">
                <a href={selectedStep.actionHref}>
                  {selectedStep.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {isCancelled && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Cette demande a ete fermee. Vous pouvez repartir sur une nouvelle reservation quand vous voulez.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
