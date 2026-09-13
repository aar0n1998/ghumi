import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Navigates back, falling back to a given route when there is nothing to pop.
 *
 * `router.replace('/')` reads like a back action but is not one: it swaps the
 * current route for a new entry and animates it *forward*, so the destination
 * slides in from the right and the stack never unwinds. Tapping back then feels
 * like opening another screen, and repeated trips grow the history.
 *
 * The fallback matters because these screens are not always pushed. A cold
 * start on an invite deep link can land straight on a group with no history
 * behind it, and `router.back()` would then be a no-op.
 */
export function useGoBack(fallback: Href = '/'): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
