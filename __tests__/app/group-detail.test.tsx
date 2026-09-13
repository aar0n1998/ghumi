import { render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupScreen from '@/app/group/[id]';
import { useGroup, type GroupDetail, type GroupState } from '@/hooks/use-group';
import { GROUP_FEATURES } from '@/lib/group-features';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'g1' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/hooks/use-group', () => ({ useGroup: jest.fn() }));

const mockedUseGroup = useGroup as jest.MockedFunction<typeof useGroup>;

const detail: GroupDetail = {
  id: 'g1',
  title: 'Goa, March',
  description: 'Four days, no fixed plan',
  coverUrl: null,
  inviteCode: 'ABCD2345',
  createdAt: '2026-01-01T00:00:00Z',
  yourRole: 'owner',
  members: [
    {
      userId: 'u1',
      displayName: 'Aaron',
      avatarUrl: null,
      role: 'owner',
      joinedAt: '2026-01-01T00:00:00Z',
      isYou: true,
    },
    {
      userId: 'u2',
      displayName: 'Priya',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2026-01-02T00:00:00Z',
      isYou: false,
    },
  ],
};

function state(overrides: Partial<GroupState> = {}): GroupState {
  return {
    group: detail,
    isLoading: false,
    isRefreshing: false,
    notFound: false,
    error: null,
    refresh: jest.fn(),
    resetInviteLink: jest.fn(),
    leaveGroup: jest.fn(),
    ...overrides,
  };
}

describe('GroupScreen', () => {
  it('shows the group title and description', () => {
    mockedUseGroup.mockReturnValue(state());
    render(<GroupScreen />);

    expect(screen.getByText('Goa, March')).toBeVisible();
    expect(screen.getByText('Four days, no fixed plan')).toBeVisible();
  });

  it('shows a tile for every feature', () => {
    mockedUseGroup.mockReturnValue(state());
    render(<GroupScreen />);

    for (const feature of GROUP_FEATURES) {
      expect(screen.getByText(feature.label)).toBeVisible();
    }
  });

  it('lists the members, marking you and the host', () => {
    mockedUseGroup.mockReturnValue(state());
    render(<GroupScreen />);

    expect(screen.getByText('Aaron (you)')).toBeVisible();
    expect(screen.getByText('Priya')).toBeVisible();
    expect(screen.getByText('Host')).toBeVisible();
    expect(screen.getByText('2 members')).toBeVisible();
  });

  it('shows the invite code so it can be shared', () => {
    mockedUseGroup.mockReturnValue(state());
    render(<GroupScreen />);

    expect(screen.getByText('ABCD2345')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Share invite link' })).toBeVisible();
  });

  it('offers the link reset to the host only', () => {
    mockedUseGroup.mockReturnValue(state());
    render(<GroupScreen />);
    expect(screen.getByRole('button', { name: 'Reset invite link' })).toBeVisible();
  });

  it('hides the link reset from ordinary members', () => {
    mockedUseGroup.mockReturnValue(
      state({ group: { ...detail, yourRole: 'member' } })
    );

    render(<GroupScreen />);
    expect(screen.queryByRole('button', { name: 'Reset invite link' })).toBeNull();
  });

  it('explains a group it cannot load rather than rendering blank', () => {
    mockedUseGroup.mockReturnValue(state({ group: null, notFound: true }));
    render(<GroupScreen />);
    expect(screen.getByText('Group unavailable')).toBeVisible();
  });
});
