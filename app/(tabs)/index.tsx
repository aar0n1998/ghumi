import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupCard } from '@/components/group-card';
import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useGroups } from '@/hooks/use-groups';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, isLoading, isRefreshing, error, refresh } = useGroups();

  const tint = useThemeColor({}, 'tint');
  const onTint = useThemeColor({}, 'onTint');
  const danger = useThemeColor({}, 'danger');

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText type="title">Groups</ThemedText>
            <ThemedText type="caption">Trips you are planning with other people.</ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a group"
            onPress={() => router.push('/group/create')}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: tint },
              pressed && styles.pressed,
            ]}>
            <IconSymbol name="plus" size={22} color={onTint} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <IconSymbol name="exclamationmark.triangle.fill" size={15} color={danger} />
            <ThemedText type="caption" style={{ color: danger }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centred}>
            <ActivityIndicator color={tint} />
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(group) => group.id}
            contentContainerStyle={[styles.list, groups.length === 0 && styles.listEmpty]}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={tint} />
            }
            renderItem={({ item }) => (
              <GroupCard group={item} onPress={() => router.push(`/group/${item.id}`)} />
            )}
            ListEmptyComponent={
              <ScreenPlaceholder
                icon="person.2.fill"
                title="No groups yet"
                description="Create a group to start planning a trip, then share the link so everyone else can join."
              />
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  list: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
    padding: 0,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
