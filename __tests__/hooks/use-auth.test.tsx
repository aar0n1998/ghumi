import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import React, { type PropsWithChildren } from 'react';

import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => {
  const auth = {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithOAuth: jest.fn(),
    setSession: jest.fn(),
    signOut: jest.fn(),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  return { supabase: { auth }, isSupabaseConfigured: true };
});

const mockedAuth = supabase.auth as unknown as {
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
  signInWithOAuth: jest.Mock;
  setSession: jest.Mock;
  signOut: jest.Mock;
  startAutoRefresh: jest.Mock;
  stopAutoRefresh: jest.Mock;
};

const openAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock;

const fakeSession = {
  access_token: 'access-123',
  refresh_token: 'refresh-123',
  user: { id: 'user-1', email: 'traveller@example.com' },
};

/** Captures the listener Supabase registers so tests can drive auth events. */
let emitAuthChange: ((event: string, session: unknown) => void) | null = null;

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  emitAuthChange = null;

  mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockedAuth.onAuthStateChange.mockImplementation((cb: (e: string, s: unknown) => void) => {
    emitAuthChange = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  mockedAuth.signOut.mockResolvedValue({ error: null });
  mockedAuth.setSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
});

describe('useAuth', () => {
  it('starts loading, then settles signed out when there is no stored session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('restores a persisted session on launch', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.user?.email).toBe('traveller@example.com');
  });

  it('signs in through Google and stores the returned tokens', async () => {
    mockedAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth?foo=bar' },
      error: null,
    });
    openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'ghumi://auth/callback#access_token=access-123&refresh_token=refresh-123',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockedAuth.setSession).toHaveBeenCalledWith({
      access_token: 'access-123',
      refresh_token: 'refresh-123',
    });

    // Supabase drives the state change via its listener, not the call itself.
    act(() => emitAuthChange?.('SIGNED_IN', fakeSession));
    await waitFor(() => expect(result.current.session).toEqual(fakeSession));
    expect(result.current.error).toBeNull();
  });

  it('stays quiet when the user cancels the browser sheet', async () => {
    mockedAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    });
    openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockedAuth.setSession).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isSigningIn).toBe(false);
  });

  it('surfaces an error when Google returns no tokens', async () => {
    mockedAuth.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    });
    openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'ghumi://auth/callback' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(result.current.error).toMatch(/unexpected response/i);
    expect(result.current.isSigningIn).toBe(false);
  });

  it('clears the session on sign out', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(fakeSession));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockedAuth.signOut).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('clears the session even if the server sign-out fails, so the user is never stranded', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });
    mockedAuth.signOut.mockResolvedValue({ error: new Error('network down') });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.session).toEqual(fakeSession));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.error).toMatch(/network down/i);
  });

  it('throws when used outside of an AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within an <AuthProvider>/);
    consoleError.mockRestore();
  });
});
