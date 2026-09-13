import { useColorScheme as useRNColorScheme } from 'react-native';

/** The two schemes the Horizon theme actually defines tokens for. */
export type AppColorScheme = 'light' | 'dark';

/**
 * The current colour scheme, always resolved to one the theme has tokens for.
 *
 * React Native returns `'unspecified'` when the platform has no preference (and
 * used to return null), which cannot index `Colors`. Collapsing it to `'light'`
 * here means callers can use the result directly instead of each one repeating
 * a `?? 'light'` that no longer narrows.
 */
export function useColorScheme(): AppColorScheme {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
