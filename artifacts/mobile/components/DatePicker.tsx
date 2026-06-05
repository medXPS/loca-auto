import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function formatDisplay(iso: string): string {
  if (!iso) return "Sélectionner une date";
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS_FR[parseInt(m, 10) - 1]} ${y}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
}

export function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const today = todayIso();
  const [y, m] = (value || today).split("-").map(Number);
  const [viewYear, setViewYear] = useState(y || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(m ? m - 1 : new Date().getMonth());

  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (minDate && iso < minDate) return;
    Haptics.selectionAsync();
    onChange(iso);
    setOpen(false);
  }

  function isoForDay(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const isSelected = (day: number) => isoForDay(day) === value;
  const isDisabled = (day: number) => minDate ? isoForDay(day) < minDate : false;
  const isToday = (day: number) => isoForDay(day) === today;

  return (
    <>
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      )}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.card,
            borderColor: open ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text
          style={[
            styles.triggerText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {formatDisplay(value)}
        </Text>
        <Ionicons name="chevron-down-outline" size={14} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.card, shadowColor: colors.secondary },
            ]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={styles.nav}>
              <Pressable
                onPress={prevMonth}
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {MONTHS_FR[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {DAYS_FR.map((d) => (
                <Text key={d} style={[styles.weekDay, { color: colors.mutedForeground }]}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.cell} />;
                }
                const selected = isSelected(day);
                const disabled = isDisabled(day);
                const tod = isToday(day);
                return (
                  <Pressable
                    key={`day-${day}`}
                    onPress={() => !disabled && selectDay(day)}
                    style={[
                      styles.cell,
                      selected && { backgroundColor: colors.primary, borderRadius: 10 },
                      tod && !selected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: disabled ? colors.border : selected ? "#fff" : colors.foreground },
                        disabled && { textDecorationLine: "line-through" },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Annuler
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  dayText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  cancelBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
});
