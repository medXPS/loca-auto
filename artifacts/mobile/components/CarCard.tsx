import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Car } from "@workspace/api-client-react";

const CATEGORY_LABELS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  MONOSPACE: "Monospace",
  UTILITAIRE: "Utilitaire",
  LUXE: "Luxe",
  SPORT: "Sport",
  "4X4": "4x4",
};

function formatPrice(p: unknown): string {
  const n = Number(p);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-MA").format(n) + " MAD/j";
}

interface CarCardProps {
  car: Car;
  onPress: () => void;
}

export function CarCard({ car, onPress }: CarCardProps) {
  const colors = useColors();
  const available = car.status === "AVAILABLE";
  const imageUrl = car.mainImageUrl ?? null;
  const [imageFailed, setImageFailed] = useState(false);

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
      <View style={styles.imageWrap}>
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Ionicons name="car-outline" size={36} color={colors.mutedForeground} />
          </View>
        )}
        <View
          style={[
            styles.badge,
            { backgroundColor: available ? colors.secondary + "16" : colors.destructive + "16" },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: available ? colors.secondary : colors.destructive }]}
          >
            {available ? "Disponible" : "Indisponible"}
          </Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>
          {car.brand}
        </Text>
        <Text style={[styles.model, { color: colors.foreground }]} numberOfLines={1}>
          {car.model} {car.year}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {car.seats} pl.
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {car.city ?? "—"}
            </Text>
          </View>
          {car.category && (
            <View style={styles.metaItem}>
              <Ionicons name="car-sport-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {CATEGORY_LABELS[car.category] ?? car.category}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(car.dailyPrice)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  imageWrap: {
    position: "relative",
    height: 170,
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  info: {
    padding: 14,
    gap: 4,
  },
  brand: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  model: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  price: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginTop: 6,
  },
});
