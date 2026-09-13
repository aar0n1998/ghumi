import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

/**
 * Invite links.
 *
 * The link is a custom-scheme deep link: `ghumi://join/ABCD2345` in a dev build,
 * `exp://…/--/join/ABCD2345` in Expo Go. That means it only opens for someone
 * who already has the app.
 *
 * Making it work for everyone else needs an `https://` universal link, which
 * needs a domain serving `/.well-known/apple-app-site-association` and
 * `assetlinks.json`. Deliberately deferred — see CLAUDE.md. The invite code is
 * always shown alongside the link so a recipient without the app can still be
 * let in by typing it.
 */

/** Where a shared invite lands. */
export function buildInviteLink(inviteCode: string): string {
  return Linking.createURL(`/join/${inviteCode}`);
}

/**
 * Pulls an invite code out of a deep link, or returns null if the URL is not
 * one of ours. Handles both `ghumi://join/CODE` and the `exp://…/--/join/CODE`
 * shape Expo Go uses.
 */
export function parseInviteCode(url: string): string | null {
  const match = /(?:^|\/)join\/([A-Za-z0-9]{4,16})(?:[/?#]|$)/.exec(url);
  return match ? match[1].toUpperCase() : null;
}

const PENDING_INVITE_KEY = 'ghumi.pending-invite';

/**
 * A signed-out user who taps an invite link has to sign in first, and the
 * route guard will have already discarded the destination by the time they
 * come back. Park the code so the app can resume the join afterwards.
 */
export async function storePendingInvite(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, code);
  } catch {
    // A failed park just means the user lands on Groups instead of the invite.
  }
}

export async function takePendingInvite(): Promise<string | null> {
  try {
    const code = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (code) await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    return code;
  } catch {
    return null;
  }
}
