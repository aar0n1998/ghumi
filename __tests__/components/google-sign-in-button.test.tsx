import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { GoogleSignInButton } from '@/components/google-sign-in-button';

describe('GoogleSignInButton', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<GoogleSignInButton onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    render(<GoogleSignInButton loading onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marks itself busy for screen readers while loading', () => {
    render(<GoogleSignInButton loading />);
    const button = screen.getByRole('button', { name: 'Continue with Google' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });
});
