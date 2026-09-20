import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import GroupStartScreen from '@/app/group/start';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

describe('GroupStartScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('offers both ways into a group', () => {
    render(<GroupStartScreen />);
    expect(screen.getByText('Create Group')).toBeVisible();
    expect(screen.getByText('Join a Group')).toBeVisible();
  });

  it('marks neither as coming soon — both work today', () => {
    render(<GroupStartScreen />);
    expect(screen.queryByText('Soon')).toBeNull();
  });

  it('opens the create form', async () => {
    const user = userEvent.setup();
    render(<GroupStartScreen />);

    await user.press(screen.getByRole('button', { name: /^Create Group\./ }));
    expect(mockPush).toHaveBeenCalledWith('/group/create');
  });

  it('opens the invite code form', async () => {
    const user = userEvent.setup();
    render(<GroupStartScreen />);

    await user.press(screen.getByRole('button', { name: /^Join a Group\./ }));
    expect(mockPush).toHaveBeenCalledWith('/join');
  });
});
