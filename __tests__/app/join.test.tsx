import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import JoinGroupScreen from '@/app/join/[code]';
import { useGroupInvite, type GroupInviteState, type GroupPreview } from '@/hooks/use-group-invite';

// Must be `mock`-prefixed: jest.mock factories are hoisted above this file's
// own bindings and only allow out-of-scope variables named that way.
const mockReplace = jest.fn();
const mockDismiss = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: 'ABCD2345' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockDismiss,
    canGoBack: () => true,
  }),
}));

jest.mock('@/hooks/use-group-invite', () => ({ useGroupInvite: jest.fn() }));

const mockedUseGroupInvite = useGroupInvite as jest.MockedFunction<typeof useGroupInvite>;

const preview: GroupPreview = {
  id: 'g1',
  title: 'Goa, March',
  description: 'Four days, no fixed plan',
  coverUrl: null,
  memberCount: 3,
  hostName: 'Aaron',
  createdAt: '2026-01-01T00:00:00Z',
  alreadyMember: false,
};

function state(overrides: Partial<GroupInviteState> = {}): GroupInviteState {
  return {
    preview,
    isLoading: false,
    isInvalid: false,
    isJoining: false,
    error: null,
    join: jest.fn().mockResolvedValue('g1'),
    ...overrides,
  };
}

beforeEach(() => {
  mockReplace.mockClear();
  mockDismiss.mockClear();
});

describe('JoinGroupScreen', () => {
  it('shows what the group is about before joining', () => {
    mockedUseGroupInvite.mockReturnValue(state());
    render(<JoinGroupScreen />);

    expect(screen.getByText('Goa, March')).toBeVisible();
    expect(screen.getByText('Four days, no fixed plan')).toBeVisible();
    expect(screen.getByText('Aaron invited you to')).toBeVisible();
    expect(screen.getByText('3 people are in')).toBeVisible();
  });

  it('previews the features the group comes with', () => {
    mockedUseGroupInvite.mockReturnValue(state());
    render(<JoinGroupScreen />);

    expect(screen.getByText('What you get access to')).toBeVisible();
    expect(screen.getByText('Chat')).toBeVisible();
    expect(screen.getByText('Itinerary')).toBeVisible();
  });

  it('joins and opens the group', async () => {
    const join = jest.fn().mockResolvedValue('g1');
    mockedUseGroupInvite.mockReturnValue(state({ join }));

    render(<JoinGroupScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Join group' }));

    await waitFor(() => expect(join).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/group/g1'));
  });

  it('offers to open the group rather than join it twice', () => {
    mockedUseGroupInvite.mockReturnValue(
      state({ preview: { ...preview, alreadyMember: true } })
    );

    render(<JoinGroupScreen />);

    expect(screen.getByRole('button', { name: 'Open group' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Join group' })).toBeNull();
  });

  it('dismisses rather than pushing the list when closed', () => {
    mockedUseGroupInvite.mockReturnValue(state());
    render(<JoinGroupScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('explains a revoked or unknown invite', () => {
    mockedUseGroupInvite.mockReturnValue(state({ preview: null, isInvalid: true }));
    render(<JoinGroupScreen />);
    expect(screen.getByText('Invite not valid')).toBeVisible();
  });

  it('keeps the user on the screen when joining fails', async () => {
    const join = jest.fn().mockRejectedValue(new Error('nope'));
    mockedUseGroupInvite.mockReturnValue(state({ join, error: 'That invite link is not valid any more.' }));

    render(<JoinGroupScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Join group' }));

    await waitFor(() => expect(join).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('That invite link is not valid any more.')).toBeVisible();
  });
});
