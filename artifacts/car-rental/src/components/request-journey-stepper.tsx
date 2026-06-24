"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  Flag,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { cn, formatDateTime, formatPrice, getStatusLabel } from "@/lib/utils";

type StepId =
  | "candidature"
  | "pieces"
  | "verification"
  | "confirmation"
  | "reservation"
  | "location"
  | "cloture";

type StepRelation = "completed" | "current" | "future";
type Tone = "emerald" | "rose" | "sky" | "slate";

type RequestSummary = {
  id?: number | string | null;
  car?: {
    brand?: string | null;
    model?: string | null;
    category?: string | null;
    year?: string | number | null;
    mainImageUrl?: string | null;
  } | null;
  startAt?: string | Date | null;
  startDate?: string | Date | null;
  returnAt?: string | Date | null;
  returnDate?: string | Date | null;
  estimatedTotalPrice?: number | string | null;
  finalPrice?: number | string | null;
};

type JourneyStep = {
  id: StepId;
  title: string;
  description: string;
  statuses: string[];
  icon: LucideIcon;
};

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "candidature",
    title: "Candidature",
    description: "Votre demande a été envoyée et elle est en attente de traitement.",
    statuses: ["PENDING", "UNDER_REVIEW", "CALL_ATTEMPTED"],
    icon: ClipboardList,
  },
  {
    id: "pieces",
    title: "Pièces",
    description: "CIN / Passeport et permis de conduire requis.",
    statuses: ["DOCUMENT_SUBMISSION_WINDOW", "WAITING_DOCUMENTS"],
    icon: FileText,
  },
  {
    id: "verification",
    title: "Vérification",
    description: "L’agence vérifie la validité des documents envoyés.",
    statuses: ["PENDING_CALL_CONFIRMATION"],
    icon: ShieldCheck,
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "L’agence confirme la réservation après vérification.",
    statuses: ["CALL_CONFIRMED", "EXTENDED_PAYMENT_DEADLINE", "WAITING_AGENCY_PAYMENT"],
    icon: PhoneCall,
  },
  {
    id: "reservation",
    title: "Réservation",
    description: "Le véhicule est réservé pour les dates choisies.",
    statuses: ["RESERVED", "PAID"],
    icon: BadgeCheck,
  },
  {
    id: "location",
    title: "Location",
    description: "Le véhicule a été remis au client et la location est active.",
    statuses: ["ACTIVE_RENTAL", "CAR_DELIVERED", "RENTED"],
    icon: CarFront,
  },
  {
    id: "cloture",
    title: "Clôture",
    description: "Retour du véhicule et fermeture du dossier.",
    statuses: ["CAR_RETURNED", "RETURNED", "COMPLETED"],
    icon: Flag,
  },
];

const STEP_INDEX_BY_ID = Object.fromEntries(JOURNEY_STEPS.map((step, index) => [step.id, index] as const)) as Record<
  StepId,
  number
>;

const CANCELLATION_STATUSES = new Set(["CANCELLED", "ABANDONED", "REJECTED"]);

function getJourneyMessage(status: string) {
  switch (status) {
    case "PENDING":
    case "UNDER_REVIEW":
    case "CALL_ATTEMPTED":
      return "Votre demande a été prise en compte. La prochaine étape est la validation des pièces.";
    case "DOCUMENT_SUBMISSION_WINDOW":
    case "WAITING_DOCUMENTS":
      return "Soumettez vos documents pour débloquer la suite du dossier.";
    case "PENDING_CALL_CONFIRMATION":
      return "Nous avons reçu vos pièces. L’équipe revient vers vous pour la vérification.";
    case "CALL_CONFIRMED":
    case "EXTENDED_PAYMENT_DEADLINE":
    case "WAITING_AGENCY_PAYMENT":
      return "Votre dossier est validé. Il ne reste plus qu’à finaliser la réservation à l’agence.";
    case "RESERVED":
    case "PAID":
      return "Le véhicule est bloqué pour vous et la demande avance vers la remise.";
    case "ACTIVE_RENTAL":
    case "CAR_DELIVERED":
    case "RENTED":
      return "La location est en cours. Vous pouvez suivre la progression ici.";
    case "CAR_RETURNED":
    case "RETURNED":
    case "COMPLETED":
      return "La demande est terminée. Le dossier est clôturé.";
    case "CANCELLED":
    case "ABANDONED":
    case "REJECTED":
      return "La demande a été fermée.";
    default:
      return `Statut actuel : ${getStatusLabel(status, "rental")}.`;
  }
}

function getStepRelation(stepIndex: number, currentIndex: number): StepRelation {
  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "future";
}

function getStepStateLabel(stepIndex: number, currentIndex: number) {
  const relation = getStepRelation(stepIndex, currentIndex);

  switch (relation) {
    case "completed":
      return "Terminée";
    case "current":
      return "Étape en cours";
    default:
      return "Étape à venir";
  }
}

function getStepStateTone(stepIndex: number, currentIndex: number) {
  const relation = getStepRelation(stepIndex, currentIndex);

  switch (relation) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "current":
      return "border-[#F04B45]/20 bg-[#F04B45]/10 text-[#F04B45]";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getToneIconClasses(tone: Tone) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-500/10 text-emerald-600";
    case "rose":
      return "bg-rose-500/10 text-rose-600";
    case "sky":
      return "bg-sky-500/10 text-sky-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatOptionalDate(date?: string | Date | null) {
  return date ? formatDateTime(date) : "À définir";
}

function formatOptionalPrice(amount?: number | string | null) {
  return amount === null || amount === undefined ? "À confirmer" : formatPrice(amount);
}

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: Tone;
}

function InfoCard({ icon: Icon, title, description, tone = "slate" }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", getToneIconClasses(tone))}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon?: LucideIcon;
  tone?: Tone;
}

function MetricCard({ label, value, helper, icon: Icon, tone = "slate" }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", getToneIconClasses(tone))}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
          {helper && <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

interface RequestJourneyStepperProps {
  status: string;
  request?: RequestSummary | null;
  piecesContent?: ReactNode;
  className?: string;
}

export function RequestJourneyStepper({ status, request, piecesContent, className }: RequestJourneyStepperProps) {
  const currentStepId = JOURNEY_STEPS.find((step) => step.statuses.includes(status))?.id ?? "candidature";
  const currentIndex = STEP_INDEX_BY_ID[currentStepId] ?? 0;
  const currentStep = JOURNEY_STEPS[currentIndex] ?? JOURNEY_STEPS[0];
  const [selectedStep, setSelectedStep] = useState<StepId>(currentStep.id);

  useEffect(() => {
    setSelectedStep(currentStep.id);
  }, [currentStep.id]);

  const selectedStepIndex = STEP_INDEX_BY_ID[selectedStep] ?? currentIndex;
  const selectedStepConfig = JOURNEY_STEPS[selectedStepIndex] ?? currentStep;
  const selectedStateLabel = getStepStateLabel(selectedStepIndex, currentIndex);
  const selectedStateTone = getStepStateTone(selectedStepIndex, currentIndex);
  const dossierLabel = request?.id != null ? `#${request.id}` : "ce dossier";
  const vehicleTitle =
    request?.car?.brand || request?.car?.model
      ? `${request?.car?.brand ?? ""} ${request?.car?.model ?? ""}`.trim()
      : "Véhicule réservé";
  const vehicleMeta = request?.car
    ? `${request.car.category ?? "Catégorie"} • ${request.car.year != null ? String(request.car.year) : "à définir"}`
    : "Informations de réservation";
  const requestStartDate = formatOptionalDate(request?.startAt ?? request?.startDate);
  const requestReturnDate = formatOptionalDate(request?.returnAt ?? request?.returnDate);
  const requestFinalPrice = formatOptionalPrice(request?.finalPrice ?? request?.estimatedTotalPrice);
  const progressStop = JOURNEY_STEPS.length > 1 ? (currentIndex / (JOURNEY_STEPS.length - 1)) * 100 : 0;
  const progressEnd = Math.min(progressStop + 1.5, 100);
  const timelineConnectorStyle = {
    backgroundImage: `linear-gradient(90deg, rgba(16,185,129,0.95) 0%, rgba(16,185,129,0.95) ${progressStop}%, rgba(240,75,69,0.95) ${progressStop}%, rgba(240,75,69,0.95) ${progressEnd}%, rgba(226,232,240,1) ${progressEnd}%, rgba(226,232,240,1) 100%)`,
  };
  const isCancelled = CANCELLATION_STATUSES.has(status);
  const currentStepTitle = currentStep.title;
  const SelectedStepIcon = selectedStepConfig.icon;

  const renderSelectedStepContent = () => {
    switch (selectedStepConfig.id) {
      case "candidature":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={CheckCircle2}
                tone="emerald"
                title="Demande créée avec succès"
                description={`Le dossier ${dossierLabel} a bien été enregistré.`}
              />
              <InfoCard
                icon={FileText}
                tone="sky"
                title="Informations personnelles enregistrées"
                description="Vos coordonnées sont prêtes pour le traitement."
              />
              <InfoCard
                icon={ClipboardList}
                tone="slate"
                title="Dossier ouvert"
                description="L’équipe peut maintenant poursuivre la vérification."
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-emerald-900">Votre candidature est en file de traitement.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                  Préparez vos pièces justificatives pour accélérer la suite du dossier.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                onClick={() => setSelectedStep("pieces")}
              >
                Préparer les pièces
              </Button>
            </div>
          </div>
        );

      case "pieces":
        if (piecesContent) {
          return <div className="space-y-6">{piecesContent}</div>;
        }

        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Soumission des pièces</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Le bloc de soumission des documents s’affichera ici pour compléter votre demande.
              </p>
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={ShieldCheck}
                tone="sky"
                title="Documents en cours de contrôle"
                description="L’agence vérifie la lisibilité et la validité de chaque fichier."
              />
              <InfoCard
                icon={BadgeCheck}
                tone="emerald"
                title="Identité client"
                description="Les informations du dossier sont comparées avec les pièces reçues."
              />
              <InfoCard
                icon={FileCheck2}
                tone="slate"
                title="Permis de conduire"
                description="Le permis est analysé avant d’ouvrir la confirmation."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Vérification des documents</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Le contrôle est effectué par l’agence avant le passage à l’étape de confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={PhoneCall}
                tone="sky"
                label="Appel de confirmation"
                value="Programmé"
                helper="L’équipe confirme les derniers détails avec le client."
              />
              <MetricCard
                icon={BadgeCheck}
                tone="emerald"
                label="Conditions acceptées"
                value="Prêtes à valider"
                helper="Les conditions de location sont déjà consultables."
              />
              <MetricCard
                icon={ShieldCheck}
                tone="slate"
                label="Statut agence"
                value="Validation finale"
                helper="Le dossier attend la dernière approbation."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">L’agence confirme la réservation après vérification.</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Cette étape débloque la réservation du véhicule et prépare la remise.
              </p>
            </div>
          </div>
        );

      case "reservation":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {request?.car?.mainImageUrl ? (
                  <img src={request.car.mainImageUrl} alt={vehicleTitle} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 text-slate-400">
                    <CarFront className="h-14 w-14" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-xl font-semibold tracking-tight text-slate-900">{vehicleTitle}</h4>
                      <p className="mt-1 text-sm text-slate-500">{vehicleMeta}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Réservé
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <MetricCard
                  icon={CalendarDays}
                  tone="slate"
                  label="Départ"
                  value={requestStartDate}
                  helper="Date et heure de début de location."
                />
                <MetricCard
                  icon={CalendarDays}
                  tone="slate"
                  label="Retour"
                  value={requestReturnDate}
                  helper="Date et heure de fin de location."
                />
                <MetricCard
                  icon={BadgeCheck}
                  tone="emerald"
                  label="Total à payer"
                  value={requestFinalPrice}
                  helper="Le montant final est affiché ici quand il est connu."
                />
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                icon={CarFront}
                tone="rose"
                title="Véhicule en possession du client"
                description="Le véhicule a été remis et la location est désormais active."
              />
              <InfoCard
                icon={ShieldCheck}
                tone="emerald"
                title="Respect des conditions d’utilisation"
                description="Le client doit respecter les règles prévues dans le contrat."
              />
              <InfoCard
                icon={PhoneCall}
                tone="sky"
                title="Assistance disponible"
                description="L’équipe reste joignable si une aide est nécessaire pendant la location."
              />
            </div>

            <div className="rounded-2xl border border-[#F04B45]/15 bg-[#F04B45]/6 px-4 py-4">
              <p className="text-sm font-semibold text-[#F04B45]">Location en cours</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Le véhicule est actuellement entre les mains du client. La demande reste active jusqu’au retour.
              </p>
            </div>
          </div>
        );

      case "cloture":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={CalendarDays}
                tone="slate"
                label="Date de retour prévue"
                value={requestReturnDate}
                helper="L’équipe prépare la clôture autour de cette date."
              />
              <MetricCard
                icon={CarFront}
                tone="sky"
                label="Inspection véhicule"
                value="À réaliser"
                helper="L’état du véhicule est vérifié au retour."
              />
              <MetricCard
                icon={FileText}
                tone="emerald"
                label="Paiement final / reçu"
                value={requestFinalPrice}
                helper="Le reçu est émis après la restitution."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Retour du véhicule et fermeture du dossier.</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Le dossier sera archivé une fois le véhicule inspecté et le reçu final généré.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)]",
        className,
      )}
    >
      <CardContent className="space-y-8 p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Parcours de candidature
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Suivi de votre demande</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">{getJourneyMessage(status)}</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <StatusBadge status={status} className="px-4 py-1.5" />
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setSelectedStep("pieces")}>
              Soumettre mes pièces
            </Button>
          </div>
        </div>

        <p className="text-sm text-slate-500">Cliquez sur une étape pour afficher son détail juste en dessous.</p>

        <div className="overflow-x-auto pb-2">
          <div className="relative min-w-[920px] px-2 pt-4">
            <div className="absolute left-8 right-8 top-[1.95rem] h-0.5 rounded-full bg-slate-200" />
            <div className="absolute left-8 right-8 top-[1.95rem] h-0.5 rounded-full" style={timelineConnectorStyle} />

            <div className="grid grid-cols-7 gap-3">
              {JOURNEY_STEPS.map((step, index) => {
                const relation = getStepRelation(index, currentIndex);
                const isSelected = step.id === selectedStep;
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedStep(step.id)}
                    className="group flex min-w-0 flex-col items-center text-center outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
                    aria-pressed={isSelected}
                    aria-label={`Afficher le détail de l’étape ${step.title}`}
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200",
                        relation === "completed" && "border-emerald-500 bg-emerald-500 text-white",
                        relation === "current" && "border-[#F04B45] bg-[#F04B45] text-white",
                        relation === "future" && "border-slate-200 bg-slate-50 text-slate-500",
                        isSelected &&
                          relation === "completed" &&
                          "scale-[1.04] ring-4 ring-emerald-200 shadow-[0_18px_32px_-20px_rgba(16,185,129,0.8)]",
                        isSelected &&
                          relation === "current" &&
                          "scale-[1.04] ring-4 ring-rose-200 shadow-[0_18px_32px_-20px_rgba(240,75,69,0.8)]",
                        isSelected &&
                          relation === "future" &&
                          "scale-[1.04] border-slate-300 bg-white text-slate-600 ring-4 ring-slate-200 shadow-[0_18px_32px_-20px_rgba(148,163,184,0.55)]",
                      )}
                    >
                      {relation === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>

                    <div className="mt-3 max-w-[132px] space-y-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          getStepStateTone(index, currentIndex),
                          isSelected && "ring-2 ring-slate-200",
                        )}
                      >
                        {index + 1}
                      </span>
                      <p
                        className={cn(
                          "text-sm font-semibold leading-5 transition-colors",
                          isSelected || relation !== "future" ? "text-slate-900" : "text-slate-500",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] leading-5 text-slate-500">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedStepConfig.id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.992 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 shadow-sm lg:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
                  <SelectedStepIcon className="h-3.5 w-3.5" />
                  Point sélectionné
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">{selectedStepConfig.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{selectedStepConfig.description}</p>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <span className={cn("inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold", selectedStateTone)}>
                  {selectedStateLabel}
                </span>
                <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                  Statut : {getStatusLabel(status, "rental")}
                </span>
              </div>
            </div>

            <div className="mt-5">{renderSelectedStepContent()}</div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                Étape active : {currentStepTitle}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-500">
                Dossier {isCancelled ? "fermé" : "en cours"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {isCancelled && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Cette demande a été fermée. Vous pouvez repartir sur une nouvelle réservation quand vous le souhaitez.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
