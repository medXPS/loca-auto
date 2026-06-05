import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "./StatusBadge";
import type { RentalRequest } from "@workspace/api-client-react";

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));
}

interface RentalCardProps {
  rental: RentalRequest;
  onPress: () => void;
}

export function RentalCard({ rental, onPress }: RentalCardProps) {
  const colors = useColors();
  const carName = rental.car
    ? `${rental.car.brand} ${rental.car.model}`
    : "Véhicule";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.93 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.icon, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="car-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.carName, { color: colors.foreground }]} numberOfLines={1}>
              {carName}
            </Text>
            <Text style={[styles.id, { color: colors.mutedForeground }]}>
              Demande #{rental.id}
            </Text>
          </View>
        </View>
        <StatusBadge status={rental.status} />
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.dates}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
            Du {formatDate(rental.startDate)} au {formatDate(rental.returnDate)}
          </Text>
        </View>
        {rental.pickupLocation && (
          <View style={styles.dateItem}>
            <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
              {rental.pickupLocation}
            </Text>
          </View>
        )}
      </View>
      {rental.status === "WAITING_AGENCY_PAYMENT" && rental.paymentDeadline && (
        <View style={[styles.urgentBanner, { backgroundColor: "#fef3c7" }]}>
          <Ionicons name="warning-outline" size={14} color="#92400e" />
          <Text style={[styles.urgentText, { color: "#92400e" }]}>
            Paiement attendu avant {formatDate(rental.paymentDeadline)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  carName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    maxWidth: 140,
  },
  id: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  dates: {
    padding: 12,
    paddingTop: 10,
    gap: 5,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  urgentText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
});
