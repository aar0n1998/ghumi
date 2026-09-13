import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether the app has been given Supabase credentials.
 *
 * `EXPO_PUBLIC_*` values are inlined at build time, so a missing `.env` yields
 * `undefined` here rather than a runtime lookup failure. The sign-in screen
 * reads this to show setup guidance instead of failing on a tap.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[ghumi] Supabase is not configured. Copy .env.example to .env and fill in ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.'
  );
}

/**
 * Supabase client singleton.
 *
 * Only `hooks/use-auth.tsx` should touch `supabase.auth`, and only the hooks in
 * `hooks/` should touch the data methods — screens consume hooks instead, per
 * the layering rule in CLAUDE.md.
 *
 * Sessions persist in AsyncStorage. `expo-secure-store` would be Keychain-backed
 * and stronger, but it caps values at 2048 bytes and Supabase sessions can exceed
 * that; revisit with a chunking adapter before shipping to production.
 */
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Tokens arrive via a deep link we parse ourselves, never via a web URL bar.
      detectSessionInUrl: false,
    },
  }
);

/** The storage bucket holding group cover images. See migration 0002. */
export const GROUP_COVERS_BUCKET = 'group-covers';
