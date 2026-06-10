import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface CountdownTimerProps {
  deadline: string;
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const colors = useColors();
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const urgent = !expired && timeLeft.h < 2;
  const bg = expired ? colors.destructive + "14" : urgent ? colors.primary + "14" : colors.secondary + "14";
  const fg = expired ? colors.destructive : urgent ? colors.primary : colors.secondary;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: fg + "40" }]}>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color={fg} />
        <Text style={[styles.label, { color: fg }]}>
          {expired ? "Délai expiré" : "Délai de paiement"}
        </Text>
      </View>
      {!expired && (
        <Text style={[styles.time, { color: fg }]}>
          {String(timeLeft.h).padStart(2, "0")}:
          {String(timeLeft.m).padStart(2, "0")}:
          {String(timeLeft.s).padStart(2, "0")}
        </Text>
      )}
      <Text style={[styles.hint, { color: fg }]}>
        {expired
          ? "La réservation peut être annulée"
          : "Passez à l'agence pour effectuer le paiement"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  time: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.8,
  },
});
