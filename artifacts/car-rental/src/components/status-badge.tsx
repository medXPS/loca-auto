import { Badge } from "@/components/ui/badge";
import { STATUS_TRANSLATIONS, CAR_STATUS_TRANSLATIONS, cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: "rental" | "car";
  className?: string;
}

export function StatusBadge({ status, type = "rental", className }: StatusBadgeProps) {
  const label = type === "rental" 
    ? STATUS_TRANSLATIONS[status] || status 
    : CAR_STATUS_TRANSLATIONS[status] || status;

  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let colorClass = "";

  if (type === "rental") {
    switch (status) {
      case "PENDING":
      case "UNDER_REVIEW":
        colorClass = "bg-amber-500/12 text-amber-700 hover:bg-amber-500/18 border-amber-200";
        break;
      case "CALL_ATTEMPTED":
      case "CALL_CONFIRMED":
      case "WAITING_AGENCY_PAYMENT":
      case "WAITING_DOCUMENTS":
        colorClass = "bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 border-sky-200";
        break;
      case "RESERVED":
      case "CAR_DELIVERED":
        colorClass = "bg-primary/10 text-primary hover:bg-primary/18 border-primary/15";
        break;
      case "COMPLETED":
      case "CAR_RETURNED":
        colorClass = "bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 border-emerald-200";
        break;
      case "REJECTED":
      case "CANCELLED":
      case "ABANDONED":
        colorClass = "bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 border-rose-200";
        break;
      default:
        variant = "outline";
    }
  } else {
    switch (status) {
      case "AVAILABLE":
        colorClass = "bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/18 border-emerald-200";
        break;
      case "TEMPORARILY_HELD":
      case "RESERVED":
        colorClass = "bg-amber-500/12 text-amber-700 hover:bg-amber-500/18 border-amber-200";
        break;
      case "RENTED":
        colorClass = "bg-sky-500/12 text-sky-700 hover:bg-sky-500/18 border-sky-200";
        break;
      case "MAINTENANCE":
        colorClass = "bg-rose-500/12 text-rose-700 hover:bg-rose-500/18 border-rose-200";
        break;
      default:
        variant = "outline";
    }
  }

  return (
    <Badge variant={variant} className={cn("whitespace-nowrap font-bold uppercase tracking-[0.12em]", colorClass, className)}>
      {label}
    </Badge>
  );
}
