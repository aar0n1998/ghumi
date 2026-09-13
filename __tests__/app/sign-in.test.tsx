import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import SignInScreen from '@/app/(auth)/sign-in';
import { useAuth, type AuthState } from '@/hooks/use-auth';

jest.mock('@/hooks/use-auth', () => ({ useAuth: jest.fn() }));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function mockAuth(overrides: Partial<AuthState> = {}) {
  mockedUseAuth.mockReturnValue({
    session: null,
    user: null,
    isLoading: false,
    isSigningIn: false,
    error: null,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
    clearError: jest.fn(),
    ...overrides,
  });
}

describe('SignInScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the wordmark and tagline', () => {
    mockAuth();
    render(<SignInScreen />);

    expect(screen.getByText('Ghumi')).toBeVisible();
    expect(screen.getByText(/your travel companion/i)).toBeVisible();
  });

  it('starts Google sign-in when the button is pressed', () => {
    const signInWithGoogle = jest.fn();
    mockAuth({ signInWithGoogle });
    render(<SignInScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when sign-in failed', () => {
    mockAuth({ error: 'Could not sign in with Google. Please try again.' });
    render(<SignInScreen />);

    expect(screen.getByText(/could not sign in with google/i)).toBeVisible();
  });

  it('shows no error region on a clean load', () => {
    mockAuth();
    render(<SignInScreen />);

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
