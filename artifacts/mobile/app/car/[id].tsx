import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { AvailabilityRangePicker } from "@/components/AvailabilityRangePicker";
import {
  useGetCar,
  useGetMe,
  useGetCarAvailability,
  createRentalRequest,
} from "@workspace/api-client-react";
import type { CarDetail } from "@workspace/api-client-react";
import {
  calculateRentalDays,
  doesIsoRangeOverlapBlocked,
} from "@workspace/api-client-react/availability";

const FUEL_LABELS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
};

const CAT_LABELS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  MONOSPACE: "Monospace",
  UTILITAIRE: "Utilitaire",
  LUXE: "Luxe",
  SPORT: "Sport",
  "4X4": "4x4",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

function formatPrice(p: unknown): string {
  const n = Number(p);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-MA").format(n) + " MAD/j";
}

export default function CarDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const { data: car, isLoading, isError } = useGetCar(Number(id));
  const { data: meData } = useGetMe({ query: { queryKey: ["/api/me"], enabled: !!token } });
  const { data: availabilityBlocks = [] } = useGetCarAvailability(Number(id), {
    query: { queryKey: ["/api/cars", Number(id), "availability"], enabled: !!id },
  });

  const [imgIndex, setImgIndex] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [cityFocus, setCityFocus] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());

  const carDetail = car as CarDetail;
  const images = carDetail?.images ?? [];
  const allImages: string[] =
    images.length > 0
      ? images.map((img) => img.url)
      : carDetail?.mainImageUrl
        ? [carDetail.mainImageUrl]
        : [];
  const visibleImages = allImages.filter((url) => !failedImageUrls.has(url));
  const safeImgIndex = Math.min(imgIndex, Math.max(visibleImages.length - 1, 0));

  const days = startDate && returnDate ? calculateRentalDays(startDate, returnDate) : 0;
  const total = days > 0 ? days * Number(car?.dailyPrice ?? 0) : 0;

  async function handleBook() {
    if (!startDate || !returnDate) {
      Alert.alert("Erreur", "Veuillez sélectionner une période de location.");
      return;
    }
    if (returnDate <= startDate) {
      Alert.alert("Erreur", "La date de retour doit être après la date de début.");
      return;
    }
    if (doesIsoRangeOverlapBlocked({ startDate, endDate: returnDate }, availabilityBlocks)) {
      Alert.alert("Dates indisponibles", "La période sélectionnée contient des dates déjà réservées.");
      return;
    }
    if (!pickupLocation.trim()) {
      Alert.alert("Erreur", "Veuillez indiquer le lieu de prise en charge.");
      return;
    }
    const userName = meData?.fullName ?? "";
    const userPhone = meData?.phone ?? "";
    const userEmail = meData?.email ?? "";
    if (!userName || !userPhone || !userEmail) {
      Alert.alert(
        "Profil incomplet",
        "Veuillez compléter votre nom, téléphone et e-mail dans votre profil avant de réserver.",
        [{ text: "Aller au profil", onPress: () => router.push("/(tabs)/profile") }]
      );
      return;
    }
    setBooking(true);
    try {
      await createRentalRequest({
        carId: Number(id),
        fullName: userName,
        phone: userPhone,
        email: userEmail,
        startDate,
        returnDate,
        pickupLocation: pickupLocation.trim(),
        notes: notes.trim() || undefined,
        estimatedTotalPrice: total,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Demande envoyée",
        "Votre demande de réservation a été soumise. Nous vous contacterons pour confirmer.",
        [{ text: "Voir mes demandes", onPress: () => router.push("/(tabs)/rentals") }]
      );
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message : "Erreur lors de la réservation.";
      Alert.alert("Erreur", msg);
    } finally {
      setBooking(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="car-outline" size={40} color={colors.mutedForeground} />
        <Text style={[styles.loadText, { color: colors.mutedForeground }]}>
          Chargement…
        </Text>
      </View>
    );
  }

  if (isError || !car) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.destructive} />
        <Text style={[styles.loadText, { color: colors.foreground }]}>
          Véhicule introuvable
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const available = car.status === "AVAILABLE";

  const specItems = [
    { icon: "people-outline", label: "Places", value: String(car.seats ?? "—") },
    {
      icon: "flash-outline",
      label: "Carburant",
      value: FUEL_LABELS[car.fuelType ?? ""] ?? car.fuelType ?? "—",
    },
    {
      icon: "settings-outline",
      label: "Boîte",
      value: TRANSMISSION_LABELS[car.transmission ?? ""] ?? car.transmission ?? "—",
    },
    {
      icon: "car-sport-outline",
      label: "Catégorie",
      value: CAT_LABELS[car.category ?? ""] ?? car.category ?? "—",
    },
    { icon: "location-outline", label: "Ville", value: car.city ?? "—" },
    {
      icon: "speedometer-outline",
      label: "Km inclus",
      value: car.mileageLimit ? `${Number(car.mileageLimit).toLocaleString("fr")} km` : "Illimité",
    },
  ] as const;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.galleryWrap}>
        {visibleImages.length > 0 ? (
          <>
            <FlatList
              data={visibleImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onScroll={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                );
                setImgIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                  onError={() => setFailedImageUrls((prev) => new Set(prev).add(item))}
                />
              )}
            />
            {visibleImages.length > 1 && (
              <View style={styles.dots}>
                {visibleImages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === safeImgIndex ? "#fff" : "rgba(255,255,255,0.5)",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.galleryPlaceholder, { backgroundColor: colors.muted }]}>
            <Ionicons name="car-outline" size={60} color={colors.mutedForeground} />
          </View>
        )}

        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { top: topPad + 8, backgroundColor: "rgba(0,0,0,0.4)" },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <View
          style={[
            styles.availBadge,
            {
              top: topPad + 8,
              right: 16,
              backgroundColor: available ? "#d1fae5" : "#fee2e2",
            },
          ]}
        >
          <Text
            style={{
              color: available ? "#065f46" : "#991b1b",
              fontSize: 12,
              fontFamily: "Inter_600SemiBold",
              fontWeight: "600" as const,
            }}
          >
            {available ? "Disponible" : "Indisponible"}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>
          {car.brand}
        </Text>
        <Text style={[styles.model, { color: colors.foreground }]}>
          {car.model} {car.year}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(car.dailyPrice)}
        </Text>

        <View
          style={[
            styles.specGrid,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {specItems.map(({ icon, label, value }) => (
            <View
              key={label}
              style={[styles.specItem, { borderColor: colors.border }]}
            >
              <Ionicons name={icon} size={20} color={colors.primary} />
              <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>
                {label}
              </Text>
              <Text style={[styles.specValue, { color: colors.foreground }]}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        {car.description && (
          <View style={styles.desc}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Description
            </Text>
            <Text style={[styles.descText, { color: colors.mutedForeground }]}>
              {car.description}
            </Text>
          </View>
        )}

        {available && (
          <View
            style={[
              styles.bookingCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Faire une demande
            </Text>

            <AvailabilityRangePicker
              label="Dates de location"
              startDate={startDate}
              returnDate={returnDate}
              blocks={availabilityBlocks}
              onChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
                setStartDate(nextStartDate);
                setReturnDate(nextReturnDate);
              }}
            />
            <View style={styles.dateSummaryRow}>
              <View style={styles.dateSummaryCard}>
                <Text style={[styles.dateSummaryLabel, { color: colors.mutedForeground }]}>Départ</Text>
                <Text style={[styles.dateSummaryValue, { color: colors.foreground }]}>
                  {startDate || "À choisir"}
                </Text>
              </View>
              <View style={styles.dateSummaryCard}>
                <Text style={[styles.dateSummaryLabel, { color: colors.mutedForeground }]}>Retour</Text>
                <Text style={[styles.dateSummaryValue, { color: colors.foreground }]}>
                  {returnDate || "À choisir"}
                </Text>
              </View>
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                Lieu de prise en charge
              </Text>
              <TextInput
                value={pickupLocation}
                onChangeText={setPickupLocation}
                placeholder="Ex: Casablanca, agence principale"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    borderColor: cityFocus ? colors.primary : colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
                onFocus={() => setCityFocus(true)}
                onBlur={() => setCityFocus(false)}
              />
            </View>

            <View style={styles.inputField}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                Notes (optionnel)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Informations complémentaires…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[
                  styles.textarea,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>

            {days > 0 && (
              <View
                style={[
                  styles.totalRow,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                  {days} jour{days !== 1 ? "s" : ""} · Total estimé
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {new Intl.NumberFormat("fr-MA").format(total)} MAD
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleBook}
              disabled={booking}
              style={({ pressed }) => [
                styles.bookBtn,
                {
                  backgroundColor: booking ? colors.primary + "88" : colors.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.bookBtnText}>
                {booking ? "Envoi…" : "Envoyer la demande"}
              </Text>
            </Pressable>

            <Text style={[styles.codNote, { color: colors.mutedForeground }]}>
              Paiement en espèces à l'agence · Confirmation par téléphone
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: Platform.OS === "web" ? 80 : 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  link: { fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  galleryWrap: { position: "relative", height: 280 },
  galleryImage: { width: Platform.OS === "web" ? 400 : 375, height: 280 },
  galleryPlaceholder: { height: 280, alignItems: "center", justifyContent: "center" },
  dots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  availBadge: {
    position: "absolute",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  body: { padding: 20, gap: 16 },
  brand: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  model: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginTop: -8,
  },
  price: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  specGrid: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  specItem: {
    width: "33.33%",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  specLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  specValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textAlign: "center",
  },
  desc: { gap: 8 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  bookingCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  dateSummaryRow: { flexDirection: "row", gap: 12 },
  dateSummaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 4,
  },
  dateSummaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateSummaryValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  inputField: { gap: 6 },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  totalValue: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  bookBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  codNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
