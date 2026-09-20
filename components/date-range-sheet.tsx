import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Radii, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  addMonths,
  formatRange,
  monthGrid,
  formatMonth,
  today,
  type DateRange,
  type IsoDate,
} from "@/lib/dates";

export type DateRangeSheetProps = {
  visible: boolean;
  /** Pre-selects a range when reopening. */
  value: DateRange | null;
  title?: string;
  onDismiss: () => void;
  /** Null means the range was cleared. */
  onConfirm: (range: DateRange | null) => void;
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * A two-tap date range picker.
 *
 * First tap sets the start and clears any end; the second sets the end. Tapping
 * a day before the pending start restarts the range there rather than refusing,
 * which is what people do when they realise they picked the wrong end first.
 */
export function DateRangeSheet({
  visible,
  value,
  title = "Pick your dates",
  onDismiss,
  onConfirm,
}: DateRangeSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.scrim}
        onPress={onDismiss}
      />

      {/* Mounted only while open, so every open starts from the saved value
          rather than from the last half-finished pick. */}
      {visible ? (
        <RangePicker
          value={value}
          title={title}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
        />
      ) : null}
    </Modal>
  );
}

function RangePicker({
  value,
  title,
  onDismiss,
  onConfirm,
}: Omit<DateRangeSheetProps, "visible"> & { title: string }) {
  const surface = useThemeColor({}, "surface");
  const background = useThemeColor({}, "background");
  const border = useThemeColor({}, "border");
  const muted = useThemeColor({}, "muted");
  const tint = useThemeColor({}, "tint");
  const onTint = useThemeColor({}, "onTint");
  const text = useThemeColor({}, "text");

  const [month, setMonth] = useState<IsoDate>(value?.startsOn ?? today());
  const [startsOn, setStartsOn] = useState<IsoDate | null>(
    value?.startsOn ?? null,
  );
  const [endsOn, setEndsOn] = useState<IsoDate | null>(value?.endsOn ?? null);

  const pick = (iso: IsoDate) => {
    if (startsOn === null || endsOn !== null || iso < startsOn) {
      setStartsOn(iso);
      setEndsOn(null);
      return;
    }
    setEndsOn(iso);
  };

  const summary = startsOn
    ? formatRange(startsOn, endsOn ?? startsOn)
    : "Tap a day to start, then tap the last day";

  return (
    <View
      style={[styles.sheet, { backgroundColor: surface, borderColor: border }]}
    >
      <View style={styles.header}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onDismiss}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <IconSymbol name="xmark" size={20} color={muted} />
        </Pressable>
      </View>

      <ThemedText type="caption">{summary}</ThemedText>

      <View style={styles.monthBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setMonth(addMonths(month, -1))}
          style={({ pressed }) => [styles.monthStep, pressed && styles.pressed]}
        >
          <IconSymbol
            name="chevron.right"
            size={18}
            color={muted}
            style={styles.flip}
          />
        </Pressable>

        <ThemedText type="defaultSemiBold">{formatMonth(month)}</ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setMonth(addMonths(month, 1))}
          style={({ pressed }) => [styles.monthStep, pressed && styles.pressed]}
        >
          <IconSymbol name="chevron.right" size={18} color={muted} />
        </Pressable>
      </View>

      <View style={styles.weekdays}>
        {WEEKDAYS.map((label, index) => (
          <ThemedText
            key={`${label}-${index}`}
            type="caption"
            style={styles.cellLabel}
          >
            {label}
          </ThemedText>
        ))}
      </View>

      <View style={styles.grid}>
        {monthGrid(month).map((cell, index) => {
          if (cell.iso === null) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }

          const isStart = cell.iso === startsOn;
          const isEnd = cell.iso === endsOn;
          const isBetween =
            startsOn !== null &&
            endsOn !== null &&
            cell.iso > startsOn &&
            cell.iso < endsOn;
          const isSelected = isStart || isEnd || isBetween;

          return (
            <Pressable
              key={cell.iso}
              accessibilityRole="button"
              accessibilityLabel={cell.iso}
              accessibilityState={{ selected: isSelected }}
              onPress={() => pick(cell.iso as IsoDate)}
              style={({ pressed }) => [
                styles.cell,
                isSelected && {
                  backgroundColor: isBetween ? `${tint}26` : tint,
                },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                style={{
                  color: isStart || isEnd ? onTint : isBetween ? tint : text,
                }}
              >
                {cell.day}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear dates"
          onPress={() => onConfirm(null)}
          style={({ pressed }) => [
            styles.clear,
            { backgroundColor: background },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="caption">Clear</ThemedText>
        </Pressable>

        <PrimaryButton
          label="Done"
          style={styles.done}
          disabled={startsOn === null}
          onPress={() =>
            onConfirm(
              startsOn ? { startsOn, endsOn: endsOn ?? startsOn } : null,
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    // Not a theme colour: a scrim dims whatever is behind it in either scheme,
    // so it stays a plain black wash rather than a token.
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    gap: Spacing.sm,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
  },
  monthStep: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  flip: {
    transform: [{ rotate: "180deg" }],
  },
  weekdays: {
    flexDirection: "row",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    // Seven to a row, whatever the screen width.
    width: `${100 / 7}%`,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
  },
  cellLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  clear: {
    height: 52,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  done: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
