import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import dayjs from 'dayjs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORIES } from '@/constants/categories';
import { DateFormat } from '@/constants/calendar';
import type { DbEvent } from '@/hooks/use-events';

type EventDetailModalProps = {
  event: DbEvent | null;
  onClose: () => void;
  onDelete: (id: number) => void;
};

export function EventDetailModal({ event, onClose, onDelete }: EventDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!event) return null;

  const category = CATEGORIES.find((c) => c.id === event.category_id);
  const sameDay = dayjs(event.start_date).isSame(dayjs(event.end_date), 'day');

  function handleDelete() {
    Alert.alert('Delete event', `Delete "${event!.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDelete(event!.id);
          onClose();
        },
      },
    ]);
  }

  return (
    <Modal
      visible={!!event}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.icon + '30' }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.headerAction, { color: colors.tint }]}>Close</Text>
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Text style={[styles.headerAction, { color: '#EA4335' }]}>Delete</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.colorBar, { backgroundColor: event.color }]} />
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>When</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {sameDay
                ? `${dayjs(event.start_date).format(DateFormat.Date)}  ·  ${dayjs(event.start_date).format(DateFormat.Time)} – ${dayjs(event.end_date).format(DateFormat.Time)}`
                : `${dayjs(event.start_date).format(DateFormat.DateTime)} – ${dayjs(event.end_date).format(DateFormat.DateTime)}`}
            </Text>
          </View>

          {category && (
            <View style={styles.detail}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Category</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: category.color + '18', borderColor: category.color },
                ]}
              >
                <Text style={[styles.badgeLabel, { color: category.color }]}>{category.name}</Text>
              </View>
            </View>
          )}

          {!!event.description && (
            <View style={styles.detail}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>Notes</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{event.description}</Text>
            </View>
          )}
        </ScrollView>
      </View>
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
  headerAction: { fontSize: 17 },
  body: { padding: 20, gap: 20 },
  colorBar: { height: 4, width: 40, borderRadius: 2 },
  title: { fontSize: 26, fontWeight: '600', marginTop: 4 },
  detail: { gap: 4 },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 16, lineHeight: 22 },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeLabel: { fontSize: 14, fontWeight: '500' },
});
