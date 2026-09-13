import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import ProfileScreen from '@/app/(tabs)/profile';
import { useAuth, type AuthState } from '@/hooks/use-auth';

jest.mock('@/hooks/use-auth', () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function mockAuth(user: AuthState['user']) {
  mockedUseAuth.mockReturnValue({
    session: null,
    user,
    isLoading: false,
    isSigningIn: false,
    error: null,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
  });
}

/** Minimal stand-in for a Supabase user; the screen only reads these fields. */
function fakeUser(metadata: Record<string, unknown>, email = 'traveller@example.com') {
  return { id: 'user-1', email, user_metadata: metadata } as unknown as AuthState['user'];
}

describe('ProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the signed-in name and email from Google metadata', () => {
    mockAuth(fakeUser({ full_name: 'Aaron Ghumi' }));
    render(<ProfileScreen />);

    expect(screen.getByText('Aaron Ghumi')).toBeVisible();
    expect(screen.getByText('traveller@example.com')).toBeVisible();
  });

  it('falls back to an initial when Google supplies no avatar', () => {
    mockAuth(fakeUser({ full_name: 'Aaron Ghumi' }));
    render(<ProfileScreen />);

    expect(screen.getByText('A')).toBeVisible();
  });

  it('falls back to a generic name when metadata is empty', () => {
    mockAuth(fakeUser({}));
    render(<ProfileScreen />);

    expect(screen.getByText('Traveller')).toBeVisible();
  });

  it('confirms before signing out rather than doing it immediately', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockAuth(fakeUser({ full_name: 'Aaron Ghumi' }));
    render(<ProfileScreen />);

    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Sign out',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Sign out' })])
    );
    alertSpy.mockRestore();
  });
});
