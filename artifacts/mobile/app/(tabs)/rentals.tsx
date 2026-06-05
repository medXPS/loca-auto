import React, { useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { RentalCard } from "@/components/RentalCard";
import { useListRentalRequests } from "@workspace/api-client-react";
import type { RentalRequest } from "@workspace/api-client-react";

const ACTIVE_STATUSES = new Set([
  "PENDING",
  "CONFIRMED_CALL",
  "WAITING_AGENCY_PAYMENT",
  "ACTIVE",
]);

export default function RentalsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useListRentalRequests(undefined, {
    query: { queryKey: ["/api/rental-requests"] },
  });

  const rentals: RentalRequest[] = data?.requests ?? [];
  const active = rentals.filter((r) => ACTIVE_STATUSES.has(r.status));
  const past = rentals.filter((r) => !ACTIVE_STATUSES.has(r.status));

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sections: Array<{ title: string; data: RentalRequest[] }> = [];
  if (active.length > 0) sections.push({ title: "En cours", data: active });
  if (past.length > 0) sections.push({ title: "Historique", data: past });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: topPad + 12,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Mes demandes
        </Text>
        {!isLoading && rentals.length > 0 && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {rentals.length} demande{rentals.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Chargement…
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Erreur de chargement
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Vérifiez votre connexion et réessayez
          </Text>
        </View>
      ) : rentals.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="car-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aucune demande
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Parcourez nos véhicules et faites votre première réservation
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionDot,
                    {
                      backgroundColor:
                        section.title === "En cours" ? colors.primary : colors.mutedForeground,
                    },
                  ]}
                />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                  ({section.data.length})
                </Text>
              </View>
              {section.data.map((rental) => (
                <RentalCard
                  key={rental.id}
                  rental={rental}
                  onPress={() => router.push(`/rental/${rental.id}`)}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  list: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 100 : 90,
    gap: 8,
  },
  section: { gap: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
