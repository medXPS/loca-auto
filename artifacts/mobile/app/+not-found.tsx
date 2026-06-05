import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="compass-outline" size={56} color={colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Page introuvable
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Cette page n'existe pas ou a été déplacée.
        </Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Retour à l'accueil
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  linkText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
