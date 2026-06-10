import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import { CarCard } from "@/components/CarCard";
import { useListCars } from "@workspace/api-client-react";
import type { Car } from "@workspace/api-client-react";
import { AvailabilityRangePicker } from "@/components/AvailabilityRangePicker";

const CATEGORIES = ["CITADINE", "BERLINE", "SUV", "MONOSPACE", "LUXE", "SPORT", "4X4"];
const CAT_LABELS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  MONOSPACE: "Monospace",
  LUXE: "Luxe",
  SPORT: "Sport",
  "4X4": "4x4",
};

const SEATS_OPTIONS = [2, 4, 5, 7, 9];

const PRICE_RANGES = [
  { label: "Tous les prix", min: 0, max: 999999 },
  { label: "Moins de 300 MAD", min: 0, max: 300 },
  { label: "300 – 600 MAD", min: 300, max: 600 },
  { label: "600 – 1000 MAD", min: 600, max: 1000 },
  { label: "Plus de 1000 MAD", min: 1000, max: 999999 },
];

export default function CarsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ city?: string; startDate?: string; returnDate?: string }>();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState(params.city ?? "");
  const [startDate, setStartDate] = useState(params.startDate ?? "");
  const [returnDate, setReturnDate] = useState(params.returnDate ?? "");
  const [category, setCategory] = useState("");
  const [minSeats, setMinSeats] = useState(0);
  const [priceRange, setPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useListCars(
    {
      city: city || undefined,
      startDate: startDate || undefined,
      returnDate: returnDate || undefined,
    } as Parameters<typeof useListCars>[0],
    {
      query: { queryKey: ["/api/cars", "list", city, startDate, returnDate] },
    }
  );

  const allCars: Car[] = data?.cars ?? [];
  const selectedPriceRange = PRICE_RANGES[priceRange] ?? PRICE_RANGES[0];

  const filtered = allCars.filter((car) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      car.brand?.toLowerCase().includes(s) ||
      car.model?.toLowerCase().includes(s) ||
      car.city?.toLowerCase().includes(s);
    const matchCity = !city || (car.city ?? "").toLowerCase().includes(city.toLowerCase());
    const matchCat = !category || car.category === category;
    const matchSeats = minSeats === 0 || (car.seats ?? 0) >= minSeats;
    const price = Number(car.dailyPrice ?? 0);
    const matchPrice = price >= selectedPriceRange.min && price <= selectedPriceRange.max;
    return matchSearch && matchCity && matchCat && matchSeats && matchPrice;
  });

  const hasActiveFilters =
    category !== "" || minSeats !== 0 || priceRange !== 0 || city !== "" || startDate !== "" || returnDate !== "";
  const activeFilterCount = [
    category !== "",
    minSeats !== 0,
    priceRange !== 0,
    city !== "",
    startDate !== "",
    returnDate !== "",
  ].filter(Boolean).length;

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function resetFilters() {
    setCategory("");
    setMinSeats(0);
    setPriceRange(0);
    setCity("");
    setStartDate("");
    setReturnDate("");
    Haptics.selectionAsync();
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
          Nos véhicules
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Marque, modèle, ville…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => {
              setShowFilters(true);
              Haptics.selectionAsync();
            }}
            style={[
              styles.filterBtn,
              {
                backgroundColor: hasActiveFilters ? colors.primary : colors.card,
                borderColor: hasActiveFilters ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasActiveFilters ? "#fff" : colors.foreground}
            />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: "#fff" }]}>
                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {isLoading
            ? "Chargement…"
            : `${filtered.length} véhicule${filtered.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CarCard car={item} onPress={() => router.push(`/car/${item.id}`)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.muted }]}>
            <Ionicons name="car-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aucun véhicule trouvé
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Essayez de modifier vos critères de recherche
            </Text>
            {hasActiveFilters && (
              <Pressable
                onPress={resetFilters}
                style={[styles.resetBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)}>
          <Pressable
            style={[
              styles.filterSheet,
              { backgroundColor: colors.card, shadowColor: colors.secondary },
            ]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Filtres
              </Text>
              {hasActiveFilters && (
                <Pressable onPress={resetFilters}>
                  <Text style={[styles.resetLink, { color: colors.primary }]}>
                    Réinitialiser
                  </Text>
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                  Ville
                </Text>
                <View
                  style={[
                    styles.cityFilter,
                    { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons name="location-outline" size={15} color={colors.mutedForeground} />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Ex : Casablanca"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.cityInput, { color: colors.foreground }]}
                  />
                  {city.length > 0 && (
                    <Pressable onPress={() => setCity("")}>
                      <Ionicons name="close-circle" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.filterSection}>
                <AvailabilityRangePicker
                  label="Période"
                  startDate={startDate}
                  returnDate={returnDate}
                  blocks={[]}
                  onChange={({ startDate: nextStartDate, returnDate: nextReturnDate }) => {
                    setStartDate(nextStartDate);
                    setReturnDate(nextReturnDate);
                  }}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                  Catégorie
                </Text>
                <View style={styles.chipRow}>
                  {["", ...CATEGORIES].map((cat) => {
                    const active = category === cat;
                    return (
                      <Pressable
                        key={cat || "all"}
                        onPress={() => {
                          setCategory(cat);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.background,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? "#fff" : colors.foreground },
                          ]}
                        >
                          {cat ? CAT_LABELS[cat] ?? cat : "Toutes"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                  Prix par jour
                </Text>
                <View style={styles.optionList}>
                  {PRICE_RANGES.map((range, idx) => {
                    const active = priceRange === idx;
                    return (
                      <Pressable
                        key={range.label}
                        onPress={() => {
                          setPriceRange(idx);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.optionRow,
                          { borderColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primary : "transparent",
                            },
                          ]}
                        />
                        <Text style={[styles.optionText, { color: colors.foreground }]}>
                          {range.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                  Nombre de places minimum
                </Text>
                <View style={styles.chipRow}>
                  {[0, ...SEATS_OPTIONS].map((seats) => {
                    const active = minSeats === seats;
                    return (
                      <Pressable
                        key={seats}
                        onPress={() => {
                          setMinSeats(seats);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.background,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? "#fff" : colors.foreground },
                          ]}
                        >
                          {seats === 0 ? "Toutes" : `${seats}+`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => {
                setShowFilters(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyBtnText}>
                Voir {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  searchRow: { flexDirection: "row", gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  count: { fontSize: 12, fontFamily: "Inter_400Regular" },
  list: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 100 : 90,
  },
  empty: {
    borderRadius: 20,
    padding: 48,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "90%",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  resetLink: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  filterSection: { marginBottom: 24 },
  filterLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  cityFilter: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  cityInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  optionList: { gap: 0 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  optionText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  applyBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
});
