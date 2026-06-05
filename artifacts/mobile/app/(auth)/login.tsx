import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@workspace/api-client-react";

export default function LoginScreen() {
  const colors = useColors();
  const { login: saveAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const res = await login({ email: email.trim().toLowerCase(), password });
      await saveAuth(res.token, res.user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof Error ? err.message : "Identifiants incorrects.";
      Alert.alert("Connexion échouée", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>LAM</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Location Auto Maroc
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Connectez-vous à votre compte
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Adresse e-mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.ma"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: emailFocused ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Mot de passe
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoComplete="current-password"
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: passwordFocused ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: loading ? colors.primary + "88" : colors.primary,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={styles.buttonText}>
              {loading ? "Connexion…" : "Se connecter"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Pas encore de compte ?{" "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={[styles.link, { color: colors.primary }]}>
                  S'inscrire
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 32,
    paddingTop: Platform.OS === "web" ? 80 : 60,
    paddingBottom: Platform.OS === "web" ? 48 : 24,
  },
  top: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: { gap: 16 },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontWeight: "500" as const,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  link: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
});
