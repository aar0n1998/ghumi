import { useRootNavigationState, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { parseInviteCode, storePendingInvite, takePendingInvite } from '@/lib/invite-link';

/**
 * Keeps an invite link alive across sign-in.
 *
 * `/join/[code]` sits inside the signed-in half of the route guard, so a
 * signed-out user tapping an invite is bounced to the sign-in screen and the
 * destination is lost. This listens for the incoming URL, parks the code, and
 * replays it once a session exists.
 *
 * This is not the imperative auth redirect CLAUDE.md warns against — the guard
 * still picks the route group declaratively. This only pushes a screen *within*
 * the group the guard already chose.
 */
export function usePendingInvite(): void {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const isSignedIn = session !== null;
  // Read inside the listener without making it a dependency, so the
  // subscription is set up exactly once.
  const isSignedInRef = useRef(isSignedIn);
  isSignedInRef.current = isSignedIn;

  useEffect(() => {
    const capture = (url: string | null) => {
      if (!url) return;
      const code = parseInviteCode(url);
      // When signed in, Expo Router routes the deep link itself.
      if (code && !isSignedInRef.current) void storePendingInvite(code);
    };

    void Linking.getInitialURL().then(capture);
    const subscription = Linking.addEventListener('url', ({ url }) => capture(url));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Pushing before the navigator has mounted is a no-op that loses the invite.
    if (isLoading || !isSignedIn || !navigationState?.key) return;

    let cancelled = false;

    void takePendingInvite().then((code) => {
      if (!cancelled && code) router.push(`/join/${code}`);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, isSignedIn, navigationState?.key, router]);
}
