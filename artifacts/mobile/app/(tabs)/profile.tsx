import React, { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetMe,
  useGetMyCustomerProfile,
  updateMe,
  updateMyCustomerProfile,
} from "@workspace/api-client-react";
import type { CustomerDetail } from "@workspace/api-client-react";

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editing: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  readOnly?: boolean;
}

function FieldRow({
  label,
  value,
  onChangeText,
  editing,
  keyboardType = "default",
  readOnly = false,
}: FieldRowProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const isEditable = editing && !readOnly;

  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {isEditable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={[
            styles.fieldInput,
            {
              borderColor: focused ? colors.primary : colors.border,
              backgroundColor: colors.background,
              color: colors.foreground,
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <Text
          style={[
            styles.fieldValue,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {value || "—"}
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const { logout, token } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: meData } = useGetMe({
    query: { queryKey: ["/api/me"], enabled: !!token },
  });
  const { data: profileData } = useGetMyCustomerProfile({
    query: { queryKey: ["/api/customers/me"], enabled: !!token },
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cin, setCin] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (meData) {
      setFullName(meData.fullName ?? "");
      setPhone(meData.phone ?? "");
    }
  }, [meData]);

  useEffect(() => {
    if (profileData) {
      const p = profileData as CustomerDetail & { cin?: string };
      setCin(p.cin ?? "");
      setDrivingLicenseNumber(p.drivingLicenseNumber ?? "");
      setAddress(p.address ?? "");
    }
  }, [profileData]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateMe({ fullName: fullName || undefined, phone: phone || undefined });
      await updateMyCustomerProfile({
        cin: cin || undefined,
        drivingLicenseNumber: drivingLicenseNumber || undefined,
        address: address || undefined,
      });
      setEditing(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  const email = meData?.email ?? "";
  const displayName = fullName || (meData?.fullName ?? "Utilisateur");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.secondary, paddingTop: topPad + 20 },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerName}>{displayName}</Text>
          <Text style={styles.headerEmail}>{email}</Text>
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Informations personnelles
            </Text>
            {!editing ? (
              <Pressable
                onPress={() => setEditing(true)}
                style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={[styles.editBtnText, { color: colors.primary }]}>
                  Modifier
                </Text>
              </Pressable>
            ) : (
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)}>
                  <Ionicons name="close-outline" size={22} color={colors.mutedForeground} />
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={[
                    styles.saveBtn,
                    { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.saveBtnText}>{saving ? "…" : "Sauvegarder"}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <FieldRow
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            editing={editing}
          />
          <FieldRow
            label="Téléphone"
            value={phone}
            onChangeText={setPhone}
            editing={editing}
            keyboardType="phone-pad"
          />
          <FieldRow
            label="E-mail"
            value={email}
            onChangeText={() => {}}
            editing={editing}
            readOnly
            keyboardType="email-address"
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Documents
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <FieldRow label="CIN" value={cin} onChangeText={setCin} editing={editing} />
          <FieldRow
            label="Permis de conduire"
            value={drivingLicenseNumber}
            onChangeText={setDrivingLicenseNumber}
            editing={editing}
          />
          <FieldRow
            label="Adresse"
            value={address}
            onChangeText={setAddress}
            editing={editing}
          />
        </View>

        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View
              style={[styles.logoutIcon, { backgroundColor: colors.destructive + "15" }]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
            </View>
            <Text style={[styles.logoutText, { color: colors.destructive }]}>
              Se déconnecter
            </Text>
          </Pressable>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 90 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 32, gap: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  headerName: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  headerEmail: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  card: { margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  editActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  saveBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const },
  divider: { height: 1, marginHorizontal: 16 },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontFamily: "Inter_400Regular" },
  fieldInput: {
    height: 42,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  logoutRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  logoutIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoutText: { fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
});
