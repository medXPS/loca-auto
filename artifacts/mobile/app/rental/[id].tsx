import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useGetRentalRequest, cancelRentalRequest } from "@workspace/api-client-react";
import type { RentalRequest } from "@workspace/api-client-react";

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
        <Ionicons name={icon as "car-outline"} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function RentalDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: rental,
    isLoading,
    isError,
    refetch,
  } = useGetRentalRequest(Number(id));

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleCancel() {
    Alert.alert(
      "Annuler la demande",
      "Êtes-vous sûr de vouloir annuler cette demande de réservation ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelRentalRequest(Number(id));
              await refetch();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert("Erreur", "Impossible d'annuler la demande.");
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}
      >
        <Ionicons name="time-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
          Chargement…
        </Text>
      </View>
    );
  }

  if (isError || !rental) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background, paddingTop: topPad }]}
      >
        <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
        <Text style={[styles.loadText, { color: colors.foreground }]}>
          Demande introuvable
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const r = rental as RentalRequest;
  const carName = r.car ? `${r.car.brand} ${r.car.model}` : "Véhicule";
  const canCancel = r.status === "PENDING";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.secondary, paddingTop: topPad + 16 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.16)" }]}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{carName}</Text>
          <Text style={styles.headerId}>Demande #{r.id}</Text>
          <View style={styles.badgeWrap}>
            <StatusBadge status={r.status} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {r.status === "WAITING_AGENCY_PAYMENT" && r.paymentDeadline && (
          <CountdownTimer deadline={r.paymentDeadline} />
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Détails de la réservation
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="calendar-outline"
            label="Date de début"
            value={formatDate(r.startDate)}
          />
          <InfoRow
            icon="calendar-outline"
            label="Date de retour"
            value={formatDate(r.returnDate)}
          />
          {r.pickupLocation && (
            <InfoRow
              icon="location-outline"
              label="Lieu de prise en charge"
              value={r.pickupLocation}
            />
          )}
          {r.returnLocation && (
            <InfoRow
              icon="location-outline"
              label="Lieu de retour"
              value={r.returnLocation}
            />
          )}
          <InfoRow
            icon="cash-outline"
            label="Total estimé"
            value={new Intl.NumberFormat("fr-MA").format(r.estimatedTotalPrice) + " MAD"}
          />
          {r.notes && (
            <InfoRow icon="document-text-outline" label="Notes" value={r.notes} />
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Historique
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow
            icon="time-outline"
            label="Demande créée"
            value={formatDateTime(r.createdAt)}
          />
          {r.updatedAt && r.updatedAt !== r.createdAt && (
            <InfoRow
              icon="refresh-outline"
              label="Dernière mise à jour"
              value={formatDateTime(r.updatedAt)}
            />
          )}
          {r.paymentDeadline && (
            <InfoRow
              icon="alarm-outline"
              label="Délai de paiement"
              value={formatDateTime(r.paymentDeadline)}
            />
          )}
          {r.callConfirmedAt && (
            <InfoRow
              icon="call-outline"
              label="Appel confirmé"
              value={formatDateTime(r.callConfirmedAt)}
            />
          )}
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
        >
          <View style={styles.codRow}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <View style={styles.codContent}>
              <Text style={[styles.codTitle, { color: colors.primary }]}>
                Paiement en espèces
              </Text>
              <Text style={[styles.codText, { color: colors.primary }]}>
                Le paiement s'effectue en espèces directement à l'agence lors de
                la confirmation de la réservation.
              </Text>
            </View>
          </View>
        </View>

        {canCancel && (
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.destructive, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.destructive} />
            <Text style={[styles.cancelText, { color: colors.destructive }]}>
              Annuler la demande
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: Platform.OS === "web" ? 80 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  backLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  header: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  headerContent: { gap: 6 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  headerId: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  badgeWrap: { alignSelf: "flex-start" },
  body: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    padding: 16,
    paddingBottom: 12,
  },
  divider: { height: 1, marginHorizontal: 16, marginBottom: 4 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  codRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  codContent: { flex: 1, gap: 4 },
  codTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  codText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
});
