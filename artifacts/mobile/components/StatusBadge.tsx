import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED_CALL: "Appel confirmé",
  WAITING_AGENCY_PAYMENT: "Attente paiement",
  ACTIVE: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  ABANDONED: "Abandonnée",
};

function getStatusColors(status: string, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case "PENDING":
      return { bg: colors.primary + "18", text: colors.primary };
    case "CONFIRMED_CALL":
    case "WAITING_AGENCY_PAYMENT":
      return { bg: colors.secondary + "18", text: colors.secondary };
    case "ACTIVE":
      return { bg: colors.primary + "12", text: colors.primary };
    case "COMPLETED":
      return { bg: colors.muted, text: colors.mutedForeground };
    case "CANCELLED":
    case "ABANDONED":
      return { bg: colors.destructive + "14", text: colors.destructive };
    default:
      return { bg: colors.muted, text: colors.mutedForeground };
  }
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = useColors();
  const label = STATUS_LABELS[status] ?? status;
  const { bg, text } = getStatusColors(status, colors);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
