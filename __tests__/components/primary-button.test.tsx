import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PrimaryButton } from '@/components/primary-button';

describe('PrimaryButton', () => {
  it('renders its label', () => {
    render(<PrimaryButton label="Join group" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Join group' })).toBeVisible();
  });

  it('does not fire while loading', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Join group" onPress={onPress} isLoading />);

    fireEvent.press(screen.getByRole('button', { name: 'Join group' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Create group" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
