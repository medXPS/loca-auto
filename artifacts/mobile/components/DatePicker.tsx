import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  buildMonthCells,
  DAYS_FR,
  formatDisplayDate,
  formatMonthLabel,
} from "@workspace/api-client-react/calendar";
import { getIsoYearMonth, todayIso } from "@workspace/api-client-react/availability";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
}

export function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const minIso = minDate || todayIso();
  const anchorIso = value || minIso;
  const { year: initialYear, month: initialMonth } = getIsoYearMonth(anchorIso);
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    const { year, month } = getIsoYearMonth(anchorIso);
    setViewYear(year);
    setViewMonth(month);
  }, [anchorIso]);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayIso();

  function prevMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
    } else {
      setViewMonth((month) => month - 1);
    }
  }

  function nextMonth() {
    Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
    } else {
      setViewMonth((month) => month + 1);
    }
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (iso < minIso) return;
    Haptics.selectionAsync();
    onChange(iso);
    setOpen(false);
  }

  const isSelected = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === value;
  const isDisabled = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` < minIso;
  const isToday = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === today;

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
          {formatDisplayDate(value)}
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
                {formatMonthLabel(viewYear, viewMonth)}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {DAYS_FR.map((day) => (
                <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.cell} />;
                }

                const selected = isSelected(day);
                const disabled = isDisabled(day);
                const current = isToday(day);

                return (
                  <Pressable
                    key={`day-${day}`}
                    onPress={() => !disabled && selectDay(day)}
                    style={[
                      styles.cell,
                      selected && { backgroundColor: colors.primary, borderRadius: 10 },
                      current && !selected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10 },
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
