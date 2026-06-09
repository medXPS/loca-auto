import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { CarCard } from "@/components/CarCard";
import { AvailabilityRangePicker } from "@/components/AvailabilityRangePicker";
import { useListCars } from "@workspace/api-client-react";
import type { Car } from "@workspace/api-client-react";

const CITIES = ["Casablanca", "Marrakech", "Rabat", "Agadir", "Fès", "Tanger"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchCity, setSearchCity] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [returnDate, setReturnDate] = useState(tomorrowStr());
  const [cityFocus, setCityFocus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, isLoading } = useListCars(undefined, {
    query: { queryKey: ["/api/cars", "featured"] },
  });

  const featuredCars: Car[] = (data?.cars ?? []).slice(0, 6);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function handleSearch() {
    router.push({
      pathname: "/(tabs)/cars",
      params: { city: searchCity, startDate, returnDate },
    });
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <LinearGradient
        colors={[colors.secondary, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: topPad + 24 }]}
      >
        <Text style={styles.heroTagline}>Location Auto Maroc</Text>
        <Text style={styles.heroTitle}>
          Votre voiture idéale{"\n"}vous attend
        </Text>
        <Text style={styles.heroSubtitle}>
          Des centaines de véhicules disponibles à travers le Maroc
        </Text>
      </LinearGradient>

      <View
        style={[
          styles.searchCard,
          { backgroundColor: colors.card, shadowColor: colors.primary },
        ]}
      >
        <Text style={[styles.searchTitle, { color: colors.foreground }]}>
          Rechercher un véhicule
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            Ville de départ
          </Text>
          <View
            style={[
              styles.cityRow,
              {
                borderColor: cityFocus ? colors.primary : colors.border,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <TextInput
              value={searchCity}
              onChangeText={setSearchCity}
              placeholder="Ex : Casablanca"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              onFocus={() => setCityFocus(true)}
              onBlur={() => setCityFocus(false)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchCity.length > 0 && (
              <Pressable onPress={() => setSearchCity("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            )}
          </View>
        </View>

        <AvailabilityRangePicker
          label="Période"
          startDate={startDate}
          returnDate={returnDate}
          blocks={[]}
          onChange={({ startDate: nextStart, returnDate: nextReturn }) => {
            setStartDate(nextStart);
            setReturnDate(nextReturn);
          }}
        />

        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            styles.searchBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.searchBtnText}>Rechercher</Text>
        </Pressable>
      </View>

      <View style={styles.citiesRow}>
        <FlatList
          data={CITIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.cityList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSearchCity(item);
                router.push({ pathname: "/(tabs)/cars", params: { city: item } });
              }}
              style={({ pressed }) => [
                styles.cityChip,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={[styles.cityChipText, { color: colors.foreground }]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Véhicules disponibles
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/cars")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.muted }]}>
            <Ionicons name="car-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Chargement...
            </Text>
          </View>
        ) : featuredCars.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.muted }]}>
            <Ionicons name="car-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Aucun véhicule disponible
            </Text>
          </View>
        ) : (
          featuredCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onPress={() => router.push(`/car/${car.id}`)}
            />
          ))
        )}
      </View>

      <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 88,
    gap: 8,
  },
  heroTagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    lineHeight: 36,
    marginTop: 4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  searchCard: {
    marginHorizontal: 16,
    marginTop: -56,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  searchTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  searchBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  citiesRow: { marginTop: 20 },
  cityList: { paddingHorizontal: 16, gap: 8 },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  section: { padding: 16, paddingTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  emptyBox: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
