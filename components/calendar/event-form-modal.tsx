import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORIES, Category } from '@/constants/categories';
import { PickerTarget, PickerMode, DateFormat } from '@/constants/calendar';
import type { CreateEventInput } from '@/hooks/use-events';

type EventFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (event: CreateEventInput) => void;
  initialDate?: Date;
};

type PickerState = { target: PickerTarget; mode: PickerMode } | null;

export function EventFormModal({ visible, onClose, onSave, initialDate }: EventFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  function makeDefaults() {
    const start = initialDate ? new Date(initialDate) : new Date();
    start.setSeconds(0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [startDate, setStartDate] = useState(makeDefaults().start);
  const [endDate, setEndDate] = useState(makeDefaults().end);
  const [picker, setPicker] = useState<PickerState>(null);

  function reset() {
    const { start, end } = makeDefaults();
    setTitle('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setStartDate(start);
    setEndDate(end);
    setPicker(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the event.');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      color: category.color,
      category_id: category.id,
    });
    reset();
    onClose();
  }

  function handlePickerChange(_: unknown, date?: Date) {
    if (Platform.OS === 'android') setPicker(null);
    if (!date || !picker) return;

    const base = picker.target === PickerTarget.Start ? startDate : endDate;
    const next = new Date(base);

    if (picker.mode === PickerMode.Date) {
      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    }

    if (picker.target === PickerTarget.Start) {
      setStartDate(next);
    } else {
      setEndDate(next);
    }
  }

  const pickerValue = picker
    ? picker.target === PickerTarget.Start
      ? startDate
      : endDate
    : new Date();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.icon + '30' }]}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={[styles.headerAction, { color: colors.tint }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Event</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={[styles.headerActionBold, { color: colors.tint }]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.icon + '40' }]}
            placeholder="Title"
            placeholderTextColor={colors.icon}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <TextInput
            style={[styles.descInput, { color: colors.text, borderBottomColor: colors.icon + '40' }]}
            placeholder="Description"
            placeholderTextColor={colors.icon}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Starts</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.pill, { borderColor: colors.tint }]}
                onPress={() => setPicker({ target: PickerTarget.Start, mode: PickerMode.Date })}
              >
                <Text style={{ color: colors.tint }}>{dayjs(startDate).format(DateFormat.Date)}</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, { borderColor: colors.tint }]}
                onPress={() => setPicker({ target: PickerTarget.Start, mode: PickerMode.Time })}
              >
                <Text style={{ color: colors.tint }}>{dayjs(startDate).format(DateFormat.Time)}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Ends</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.pill, { borderColor: colors.tint }]}
                onPress={() => setPicker({ target: PickerTarget.End, mode: PickerMode.Date })}
              >
                <Text style={{ color: colors.tint }}>{dayjs(endDate).format(DateFormat.Date)}</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, { borderColor: colors.tint }]}
                onPress={() => setPicker({ target: PickerTarget.End, mode: PickerMode.Time })}
              >
                <Text style={{ color: colors.tint }}>{dayjs(endDate).format(DateFormat.Time)}</Text>
              </Pressable>
            </View>
          </View>

          {picker !== null && (
            <DateTimePicker
              value={pickerValue}
              mode={picker.mode as 'date' | 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
            />
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => {
                const active = category.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryChip,
                      {
                        borderColor: cat.color,
                        backgroundColor: active ? cat.color : cat.color + '18',
                      },
                    ]}
                  >
                    <Text style={[styles.categoryLabel, { color: active ? '#fff' : cat.color }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerAction: { fontSize: 17 },
  headerActionBold: { fontSize: 17, fontWeight: '600' },
  body: { padding: 16, gap: 20 },
  titleInput: {
    fontSize: 22,
    fontWeight: '500',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  descInput: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryLabel: { fontSize: 14, fontWeight: '500' },
});
