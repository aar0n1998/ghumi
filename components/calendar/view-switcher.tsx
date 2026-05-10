import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarMode } from '@/constants/calendar';

export { CalendarMode };

type ViewSwitcherProps = {
  mode: CalendarMode;
  onChange: (mode: CalendarMode) => void;
};

const MODES = [CalendarMode.Month, CalendarMode.Week, CalendarMode.Day];

export function ViewSwitcher({ mode, onChange }: ViewSwitcherProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { borderColor: colors.icon + '40' }]}>
      {MODES.map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={[
            styles.button,
            mode === m && { backgroundColor: colors.tint },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: mode === m ? '#fff' : colors.icon },
            ]}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
