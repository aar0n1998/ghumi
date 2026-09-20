import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import PlanScreen from '@/app/(tabs)/index';

// `mock` prefix is required: jest.mock factories cannot close over other names.
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

describe('PlanScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is the landing screen', () => {
    render(<PlanScreen />);
    expect(screen.getByText('My Plan')).toBeVisible();
    expect(screen.getByText('Choose how you want to plan this trip.')).toBeVisible();
  });

  it('offers all three ways to plan', () => {
    render(<PlanScreen />);
    expect(screen.getByText('Group')).toBeVisible();
    expect(screen.getByText('Solo')).toBeVisible();
    expect(screen.getByText('Agency')).toBeVisible();
  });

  it('marks the two modes that are not built yet', () => {
    render(<PlanScreen />);
    expect(screen.getAllByText('Soon')).toHaveLength(2);
  });

  it('sends the one working mode to the groups tab', async () => {
    const user = userEvent.setup();
    render(<PlanScreen />);

    await user.press(screen.getByRole('button', { name: /^Group\./ }));

    expect(mockPush).toHaveBeenCalledWith('/groups');
  });

  it('says so rather than navigating for a mode that does not exist yet', async () => {
    const user = userEvent.setup();
    render(<PlanScreen />);

    await user.press(screen.getByRole('button', { name: /^Solo\./ }));

    expect(mockPush).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Solo', expect.stringContaining('Not built yet'));
  });
});
