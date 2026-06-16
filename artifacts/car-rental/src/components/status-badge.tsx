import { Badge } from "@/components/ui/badge";
import { CAR_STATUS_TRANSLATIONS, STATUS_TRANSLATIONS, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "rental" | "car";
  className?: string;
}

function getRentalTone(status: string) {
  switch (status) {
    case "DOCUMENT_SUBMISSION_WINDOW":
      return "bg-amber-500/12 text-amber-700 hover:bg-amber-500/18 border-amber-200";
    case "PENDING_CALL_CONFIRMATION":
      return "bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 border-sky-200";
    case "PENDING":
    case "UNDER_REVIEW":
    case "CALL_ATTEMPTED":
      return "bg-yellow-500/12 text-yellow-700 hover:bg-yellow-500/18 border-yellow-200";
    case "CALL_CONFIRMED":
    case "EXTENDED_PAYMENT_DEADLINE":
    case "WAITING_AGENCY_PAYMENT":
      return "bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 border-sky-200";
    case "RESERVED":
      return "bg-primary/10 text-primary hover:bg-primary/18 border-primary/15";
    case "PAID":
    case "ACTIVE_RENTAL":
    case "CAR_DELIVERED":
    case "RENTED":
    case "CAR_RETURNED":
    case "RETURNED":
    case "COMPLETED":
      return "bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 border-emerald-200";
    case "REJECTED":
    case "CANCELLED":
    case "ABANDONED":
      return "bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 border-rose-200";
    default:
      return "border-border bg-background text-foreground";
  }
}

function getCarTone(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 border-emerald-200";
    case "TEMPORARILY_HELD":
      return "bg-amber-500/12 text-amber-700 hover:bg-amber-500/18 border-amber-200";
    case "RESERVED":
      return "bg-primary/10 text-primary hover:bg-primary/18 border-primary/15";
    case "RENTED":
      return "bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 border-sky-200";
    case "MAINTENANCE":
      return "bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 border-rose-200";
    default:
      return "border-border bg-background text-foreground";
  }
}

export function StatusBadge({ status, type = "rental", className }: StatusBadgeProps) {
  const label = type === "rental"
    ? STATUS_TRANSLATIONS[status] || status
    : CAR_STATUS_TRANSLATIONS[status] || status;

  const tone = type === "rental" ? getRentalTone(status) : getCarTone(status);

  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-semibold uppercase tracking-[0.12em]", tone, className)}>
      {label}
    </Badge>
  );
}
