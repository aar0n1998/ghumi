import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import EnterInviteCodeScreen from '@/app/join/index';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

describe('EnterInviteCodeScreen', () => {
  beforeEach(() => mockReplace.mockClear());

  it('takes a code straight to the invite preview', async () => {
    const user = userEvent.setup();
    render(<EnterInviteCodeScreen />);

    await user.type(screen.getByLabelText('Invite code'), 'ABCD2345');
    await user.press(screen.getByRole('button', { name: 'Continue' }));

    expect(mockReplace).toHaveBeenCalledWith('/join/ABCD2345');
  });

  it('accepts a code typed in lower case', async () => {
    const user = userEvent.setup();
    render(<EnterInviteCodeScreen />);

    await user.type(screen.getByLabelText('Invite code'), 'abcd2345');
    await user.press(screen.getByRole('button', { name: 'Continue' }));

    expect(mockReplace).toHaveBeenCalledWith('/join/ABCD2345');
  });

  it('refuses something that is not a code, without navigating', async () => {
    const user = userEvent.setup();
    render(<EnterInviteCodeScreen />);

    await user.type(screen.getByLabelText('Invite code'), 'OI0');
    await user.press(screen.getByRole('button', { name: 'Continue' }));

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText(/does not look like an invite code/i)).toBeVisible();
  });
});
