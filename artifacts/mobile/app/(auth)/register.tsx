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
import { register } from "@workspace/api-client-react";

export default function RegisterScreen() {
  const colors = useColors();
  const { login: saveAuth } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });
      await saveAuth(res.token, res.user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err instanceof Error ? err.message : "Inscription échouée.";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (focused: boolean) => [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: focused ? colors.primary : colors.border,
      color: colors.foreground,
    },
  ];

  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

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
            Créer un compte
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Rejoignez Location Auto Maroc
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nom complet *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Mohammed Alami"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              style={inputStyle(nameFocus)}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Adresse e-mail *
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.ma"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle(emailFocus)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Téléphone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+212 6XX XXX XXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              style={inputStyle(phoneFocus)}
              onFocus={() => setPhoneFocus(true)}
              onBlur={() => setPhoneFocus(false)}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Mot de passe *
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 caractères"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={inputStyle(passwordFocus)}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
            />
          </View>

          <Pressable
            onPress={handleRegister}
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
              {loading ? "Inscription…" : "Créer mon compte"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Déjà inscrit ?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.link, { color: colors.primary }]}>
                  Se connecter
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
    gap: 28,
    paddingTop: Platform.OS === "web" ? 80 : 48,
    paddingBottom: Platform.OS === "web" ? 48 : 24,
  },
  top: { alignItems: "center", gap: 10 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  form: { gap: 14 },
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
    marginTop: 6,
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
  },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  link: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
});
