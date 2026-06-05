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
        colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200";
        break;
      case "CALL_ATTEMPTED":
      case "CALL_CONFIRMED":
      case "WAITING_AGENCY_PAYMENT":
      case "WAITING_DOCUMENTS":
        colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
        break;
      case "RESERVED":
      case "CAR_DELIVERED":
        colorClass = "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20";
        break;
      case "COMPLETED":
      case "CAR_RETURNED":
        colorClass = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200";
        break;
      case "REJECTED":
      case "CANCELLED":
      case "ABANDONED":
        colorClass = "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20";
        break;
      default:
        variant = "outline";
    }
  } else {
    switch (status) {
      case "AVAILABLE":
        colorClass = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200";
        break;
      case "TEMPORARILY_HELD":
      case "RESERVED":
        colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200";
        break;
      case "RENTED":
        colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
        break;
      case "MAINTENANCE":
        colorClass = "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20";
        break;
      default:
        variant = "outline";
    }
  }

  return (
    <Badge variant={variant} className={cn("whitespace-nowrap font-medium", colorClass, className)}>
      {label}
    </Badge>
  );
}
