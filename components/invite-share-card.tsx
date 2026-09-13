import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radii, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { buildInviteLink } from '@/lib/invite-link';

export type InviteShareCardProps = {
  groupTitle: string;
  inviteCode: string;
  /** Only the host may reset the link, so this is absent for members. */
  onReset?: () => Promise<string>;
};

/**
 * The invite block inside a group.
 *
 * Shows the code as well as the link, because the link is a `ghumi://` deep
 * link that only opens for someone who already has the app.
 */
export function InviteShareCard({ groupTitle, inviteCode, onReset }: InviteShareCardProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  const [justCopied, setJustCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const link = buildInviteLink(inviteCode);

  const share = async () => {
    try {
      await Share.share({
        message: `Join "${groupTitle}" on Ghumi: ${link}\n\nOr enter the code ${inviteCode} in the app.`,
      });
    } catch {
      Alert.alert('Could not open the share sheet', 'Copy the link instead.');
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  };

  const confirmReset = () => {
    if (!onReset) return;

    Alert.alert(
      'Reset invite link?',
      'The current link and code stop working. Anyone already in the group stays in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await onReset();
            } catch (cause) {
              Alert.alert(
                'Could not reset the link',
                cause instanceof Error ? cause.message : 'Please try again.'
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: surface, borderColor: border }]}>
      <View style={styles.heading}>
        <IconSymbol name="person.badge.plus" size={18} color={tint} />
        <ThemedText type="defaultSemiBold">Invite people</ThemedText>
      </View>

      <ThemedText type="caption">
        Share the link with anyone who already has Ghumi, or give them this code to enter in the app.
      </ThemedText>

      <View style={[styles.codeWell, { borderColor: border }]}>
        <ThemedText type="subtitle" style={styles.code} accessibilityLabel={`Invite code ${inviteCode.split('').join(' ')}`}>
          {inviteCode}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share invite link"
          onPress={share}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: tint },
            pressed && styles.pressed,
          ]}>
          <IconSymbol name="square.and.arrow.up" size={17} color={surface} />
          <ThemedText type="defaultSemiBold" style={{ color: surface }}>
            Share link
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={justCopied ? 'Link copied' : 'Copy invite link'}
          onPress={copy}
          style={({ pressed }) => [
            styles.action,
            styles.secondaryAction,
            { borderColor: border },
            pressed && styles.pressed,
          ]}>
          <IconSymbol
            name={justCopied ? 'checkmark.circle.fill' : 'doc.on.doc'}
            size={17}
            color={justCopied ? tint : muted}
          />
          <ThemedText type="defaultSemiBold">{justCopied ? 'Copied' : 'Copy'}</ThemedText>
        </Pressable>
      </View>

      {onReset ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset invite link"
          disabled={isResetting}
          onPress={confirmReset}
          style={({ pressed }) => [styles.reset, (pressed || isResetting) && styles.pressed]}>
          <IconSymbol name="arrow.clockwise" size={14} color={muted} />
          <ThemedText type="caption">
            {isResetting ? 'Resetting…' : 'Reset link'}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  codeWell: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderStyle: 'dashed',
  },
  code: {
    letterSpacing: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 46,
    borderRadius: Radii.pill,
  },
  secondaryAction: {
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
