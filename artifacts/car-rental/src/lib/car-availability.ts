export type CarAvailabilityLike = {
  status: string;
  city?: string | null;
  availability?: {
    hasActiveBlock?: boolean;
    availableFrom?: string | null;
  } | null;
};

function parseAvailabilityDate(isoDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(isoDate);
}

function formatDatePart(date: Date) {
  const parts = new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Casablanca",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${day}/${month}`;
}

function formatTimePart(date: Date) {
  const parts = new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Casablanca",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  return `${hour}:${minute}`;
}

export function formatAvailabilityDate(isoDate?: string | null) {
  if (!isoDate) return "";

  const date = parseAvailabilityDate(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const dateLabel = formatDatePart(date);
  return isoDate.includes("T") ? `${dateLabel} ${formatTimePart(date)}` : dateLabel;
}

export function getAvailabilityCopy(car: CarAvailabilityLike) {
  const availability = car.availability ?? undefined;
  const isBlocked = Boolean(availability?.hasActiveBlock && availability.availableFrom);
  const isManualUnavailable = car.status === "MAINTENANCE" || car.status === "INACTIVE";

  if (isBlocked) {
    return {
      isBlocked: true,
      badge: "Réservée",
      label: `Disponible à partir du ${formatAvailabilityDate(availability?.availableFrom)}`,
      availableFrom: availability?.availableFrom ?? null,
    };
  }

  if (isManualUnavailable) {
    return {
      isBlocked: true,
      badge: "Sur demande",
      label: "Disponibilité sur demande",
      availableFrom: null,
    };
  }

  return {
    isBlocked: false,
    badge: "Disponible",
    label: "Disponible maintenant",
    availableFrom: null,
  };
}
