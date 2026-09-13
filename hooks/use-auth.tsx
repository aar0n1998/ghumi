import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
  /** True until the persisted session has been restored. Gates the splash screen. */
  isLoading: boolean;
  /** True while a sign-in round trip is in flight. */
  isSigningIn: boolean;
  /** Human-readable failure from the last auth attempt, or null. */
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

/** Where Google sends the user back to. `exp://…` in Expo Go, `ghumi://…` in a dev build. */
const redirectTo = Linking.createURL('/auth/callback');

/**
 * Supabase returns tokens in the URL *fragment* under the implicit flow, e.g.
 * `ghumi://auth/callback#access_token=…&refresh_token=…`. `Linking.parse` only
 * reads the query string, so pull the fragment apart by hand.
 */
function parseTokensFromUrl(url: string): { accessToken: string; refreshToken: string } | null {
  const fragment = url.split('#')[1];
  if (!fragment) return null;

  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

/** Reads an error message out of an unknown throwable without resorting to `any`. */
function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against setState after unmount during the async restore below.
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted.current) return;
        setSession(data.session);
      })
      .catch(() => {
        // A restore failure just means "signed out"; the sign-in screen handles it.
        if (isMounted.current) setSession(null);
      })
      .finally(() => {
        if (isMounted.current) setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted.current) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted.current = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Supabase only refreshes tokens while the app is foregrounded; without this the
  // access token goes stale after a long background stint.
  useEffect(() => {
    const listener = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      listener.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured yet. Add your keys to .env and restart the dev server.');
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // We open the browser ourselves so we can capture the callback URL.
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('Google sign-in did not return an authorization URL.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      // The user backed out of the browser sheet — not an error worth surfacing.
      if (result.type !== 'success') return;

      const tokens = parseTokensFromUrl(result.url);
      if (!tokens) throw new Error('Google sign-in returned an unexpected response.');

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      if (sessionError) throw sessionError;
      // onAuthStateChange drives the state update from here.
    } catch (cause) {
      setError(messageFrom(cause, 'Could not sign in with Google. Please try again.'));
    } finally {
      if (isMounted.current) setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (cause) {
      setError(messageFrom(cause, 'Could not sign out. Please try again.'));
    } finally {
      // Always drop local state: a failed server call must not strand the user
      // in a signed-in shell they can no longer leave.
      if (isMounted.current) setSession(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isSigningIn,
      error,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [session, isLoading, isSigningIn, error, signInWithGoogle, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
