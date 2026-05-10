import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ICalendarEventBase } from 'react-native-big-calendar';
import dayjs from 'dayjs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEvents, DbEvent } from '@/hooks/use-events';
import { ViewSwitcher } from '@/components/calendar/view-switcher';
import { CalendarMode, DateFormat } from '@/constants/calendar';
import { EventFormModal } from '@/components/calendar/event-form-modal';
import { EventDetailModal } from '@/components/calendar/event-detail-modal';

type CalEvent = ICalendarEventBase & {
  color: string;
  _raw: DbEvent;
};

const HEADER_HEIGHT = Platform.OS === 'ios' ? 56 : 60;
const SWITCHER_HEIGHT = 44;

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { height } = useWindowDimensions();

  const { events, createEvent, deleteEvent } = useEvents();
  const [mode, setMode] = useState<CalendarMode>(CalendarMode.Month);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarHeight, setCalendarHeight] = useState(500);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null);

  const calendarEvents = useMemo<CalEvent[]>(
    () =>
      events.map((e) => ({
        title: e.title,
        start: new Date(e.start_date),
        end: new Date(e.end_date),
        color: e.color,
        _raw: e,
      })),
    [events],
  );

  function navigate(dir: 1 | -1) {
    setCurrentDate((prev) => {
      const d = dayjs(prev);
      if (mode === CalendarMode.Month) return d.add(dir, 'month').toDate();
      if (mode === CalendarMode.Week) return d.add(dir * 7, 'day').toDate();
      return d.add(dir, 'day').toDate();
    });
  }

  function headerLabel() {
    if (mode === CalendarMode.Month) return dayjs(currentDate).format(DateFormat.MonthYear);
    if (mode === CalendarMode.Week) {
      const start = dayjs(currentDate).startOf('week');
      const end = start.add(6, 'day');
      if (start.month() === end.month()) {
        return start.format(DateFormat.MonthYear);
      }
      return `${start.format(DateFormat.MonthShort)} – ${end.format(DateFormat.MonthShortYear)}`;
    }
    return dayjs(currentDate).format(DateFormat.DateLong);
  }

  const handlePressEvent = useCallback((event: CalEvent) => {
    setSelectedEvent(event._raw);
  }, []);

  const handlePressCell = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      if (mode === CalendarMode.Month) setMode(CalendarMode.Day);
    },
    [mode],
  );

  const handlePressDateHeader = useCallback((date: Date) => {
    setCurrentDate(date);
    setMode(CalendarMode.Day);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.navRow}>
        <Pressable onPress={() => navigate(-1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.tint }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setCurrentDate(new Date())}>
          <Text style={[styles.navLabel, { color: colors.text }]}>{headerLabel()}</Text>
        </Pressable>
        <Pressable onPress={() => navigate(1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.tint }]}>›</Text>
        </Pressable>
      </View>

      <ViewSwitcher mode={mode} onChange={setMode} />

      <View
        style={styles.calendarWrapper}
        onLayout={(e) => setCalendarHeight(e.nativeEvent.layout.height)}
      >
        <Calendar<CalEvent>
          events={calendarEvents}
          height={calendarHeight}
          mode={mode as 'month' | 'week' | 'day'}
          date={currentDate}
          swipeEnabled={false}
          weekStartsOn={1}
          eventCellStyle={(event) => ({ backgroundColor: event.color })}
          onPressEvent={handlePressEvent}
          onPressCell={handlePressCell}
          onPressDateHeader={handlePressDateHeader}
          showTime
          ampm
        />
      </View>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => setShowForm(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <EventFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={createEvent}
        initialDate={currentDate}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={deleteEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navBtn: { padding: 4, minWidth: 40, alignItems: 'center' },
  navArrow: { fontSize: 32, lineHeight: 36, fontWeight: '300' },
  navLabel: { fontSize: 17, fontWeight: '600' },
  calendarWrapper: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '300',
  },
});
