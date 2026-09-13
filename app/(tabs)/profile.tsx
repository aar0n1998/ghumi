import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useThemeColor } from '@/hooks/use-theme-color';

/** Google puts the display name and picture in user_metadata; both are optional. */
function readProfile(metadata: Record<string, unknown> | undefined) {
  const name = metadata?.full_name ?? metadata?.name;
  const avatar = metadata?.avatar_url ?? metadata?.picture;

  return {
    name: typeof name === 'string' ? name : null,
    avatarUrl: typeof avatar === 'string' ? avatar : null,
  };
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const muted = useThemeColor({}, 'muted');

  const { name, avatarUrl } = readProfile(user?.user_metadata);
  const initial = (name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'You will need to sign in again to get back to your groups.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">Profile</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { borderColor: border }]}>
              <ThemedText type="subtitle">{initial}</ThemedText>
            </View>
          )}
          <View style={styles.identity}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {name ?? 'Traveller'}
            </ThemedText>
            {user?.email ? (
              <ThemedText type="caption" numberOfLines={1}>
                {user.email}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <ThemedText style={[styles.note, { color: muted }]}>
          Account settings, saved trips and preferences will live here.
        </ThemedText>

        <View style={styles.spacer} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={confirmSignOut}
          style={({ pressed }) => [
            styles.signOut,
            { borderColor: border },
            pressed && styles.pressed,
          ]}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={danger} />
          <ThemedText type="defaultSemiBold" style={{ color: danger }}>
            Sign out
          </ThemedText>
        </Pressable>
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
    paddingHorizontal: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  identity: {
    flex: 1,
    gap: Spacing.xs,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    paddingTop: Spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: Spacing.xl,
  },
  pressed: {
    opacity: 0.7,
  },
});
