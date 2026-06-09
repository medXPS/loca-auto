import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  doesIsoRangeOverlapBlocked,
  getBlockedIsoDates,
  getIsoYearMonth,
  isIsoRangeValid,
  todayIso,
} from "@workspace/api-client-react/availability";
import type { AvailabilityBlock } from "@workspace/api-client-react";
import {
  DAYS_FR,
  buildMonthCells,
  formatDisplayDate,
  formatMonthLabel,
  formatRangeSummary,
} from "@workspace/api-client-react/calendar";

interface AvailabilityRangePickerProps {
  label?: string;
  startDate: string;
  returnDate: string;
  blocks?: AvailabilityBlock[];
  onChange: (next: { startDate: string; returnDate: string }) => void;
}

export function AvailabilityRangePicker({
  label = "Calendrier",
  startDate,
  returnDate,
  blocks = [],
  onChange,
}: AvailabilityRangePickerProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const blockedDates = useMemo(() => getBlockedIsoDates(blocks), [blocks]);
  const minIso = todayIso();
  const anchorIso = startDate || minIso;
  const { year: initialYear, month: initialMonth } = getIsoYearMonth(anchorIso);
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const cells = buildMonthCells(viewYear, viewMonth);
  const isBeforeMin = (iso: string) => iso < minIso;
  const isBlocked = (iso: string) => blockedDates.has(iso);
  const isSelected = (iso: string) => Boolean(startDate && iso >= startDate && iso <= (returnDate || startDate));
  const summaryLabel = formatRangeSummary(startDate, returnDate);

  useEffect(() => {
    const { year, month } = getIsoYearMonth(anchorIso);
    setViewYear(year);
    setViewMonth(month);
  }, [anchorIso]);

  useEffect(() => {
    if (!open) {
      setWarningMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!startDate && !returnDate) {
      setWarningMessage(null);
    }
  }, [startDate, returnDate]);

  const pickDay = async (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (isBeforeMin(iso) || isBlocked(iso)) return;

    if (!startDate || returnDate) {
      setWarningMessage(null);
      onChange({ startDate: iso, returnDate: "" });
      await Haptics.selectionAsync();
      return;
    }

    if (iso <= startDate) {
      setWarningMessage(null);
      onChange({ startDate: iso, returnDate: "" });
      await Haptics.selectionAsync();
      return;
    }

    if (!isIsoRangeValid(startDate, iso)) {
      setWarningMessage("La date de retour doit être après la date de départ.");
      onChange({ startDate: iso, returnDate: "" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (doesIsoRangeOverlapBlocked({ startDate, endDate: iso }, blocks)) {
      setWarningMessage("Cette période traverse des dates réservées. Choisissez une autre plage.");
      onChange({ startDate: iso, returnDate: "" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setWarningMessage(null);
    onChange({ startDate, returnDate: iso });
    await Haptics.selectionAsync();
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <>
      {label && <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>}

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.triggerText, { color: colors.foreground }]}>
            {startDate ? formatDisplayDate(startDate) : "Départ"}
          </Text>
          <Text style={[styles.triggerSubText, { color: colors.mutedForeground }]}>
            {returnDate ? formatDisplayDate(returnDate) : "Retour"}
          </Text>
        </View>
        <Ionicons name="chevron-down-outline" size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.nav}>
              <Pressable onPress={prevMonth} style={styles.navBtn} accessibilityLabel="Mois précédent">
                <Ionicons name="chevron-back" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {formatMonthLabel(viewYear, viewMonth)}
              </Text>
              <Pressable onPress={nextMonth} style={styles.navBtn} accessibilityLabel="Mois suivant">
                <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {DAYS_FR.map((day) => (
                <Text key={day} style={[styles.weekLabel, { color: colors.mutedForeground }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.cell} />;
                }

                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const blocked = isBeforeMin(iso) || isBlocked(iso);
                const selected = isSelected(iso);
                const current = iso === todayIso();
                const isStart = iso === startDate;
                const isEnd = iso === returnDate;

                return (
                  <Pressable
                    key={iso}
                    onPress={() => pickDay(day)}
                    style={[
                      styles.cell,
                      blocked && styles.cellBlocked,
                      selected && { backgroundColor: colors.primary + "18", borderRadius: 10 },
                      isStart || isEnd ? { backgroundColor: colors.primary, borderRadius: 10 } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: blocked ? colors.border : isStart || isEnd ? "#fff" : colors.foreground },
                        blocked && { textDecorationLine: "line-through" },
                      ]}
                    >
                      {day}
                    </Text>
                    <Text
                      style={[
                        styles.dayMeta,
                        { color: blocked ? colors.border : selected ? colors.primary : colors.mutedForeground },
                      ]}
                    >
                      {blocked ? "Réservé" : selected ? (isStart ? "Début" : isEnd ? "Retour" : "Sélectionné") : "Libre"}
                    </Text>
                    {current && !selected && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {summaryLabel}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {startDate ? formatDisplayDate(startDate) : "Départ"}
                {returnDate ? ` - ${formatDisplayDate(returnDate)}` : ""}
              </Text>
            </View>

            {warningMessage && (
              <View
                style={[
                  styles.warningBox,
                  { borderColor: colors.destructive, backgroundColor: `${colors.destructive}12` },
                ]}
              >
                <Text style={[styles.warningText, { color: colors.destructive }]}>
                  {warningMessage}
                </Text>
              </View>
            )}

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Période sélectionnée</Text>
              </View>
              <View style={styles.legendItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Réservé</Text>
              </View>
            </View>

            <Pressable onPress={() => setOpen(false)} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeText, { color: colors.foreground }]}>Fermer</Text>
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
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  triggerSubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
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
  weekLabel: {
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
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    paddingVertical: 4,
  },
  cellBlocked: {
    opacity: 0.45,
  },
  dayText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  dayMeta: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  todayDot: {
    marginTop: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendRow: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    marginTop: 2,
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    lineHeight: 17,
  },
  legend: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },
  closeBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
});
