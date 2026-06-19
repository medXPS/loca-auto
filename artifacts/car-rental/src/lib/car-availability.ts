export type CarAvailabilityLike = {
  status: string;
  city?: string | null;
  availability?: {
    hasActiveBlock?: boolean;
    availableFrom?: string | null;
  } | null;
};

export function formatAvailabilityDate(isoDate?: string | null) {
  if (!isoDate) return "";

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
