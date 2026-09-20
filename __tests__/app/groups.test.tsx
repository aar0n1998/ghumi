import { render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupsScreen from '@/app/(tabs)/groups';
import { useGroups, type GroupsState } from '@/hooks/use-groups';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/hooks/use-groups', () => ({ useGroups: jest.fn() }));

const mockedUseGroups = useGroups as jest.MockedFunction<typeof useGroups>;

function state(overrides: Partial<GroupsState> = {}): GroupsState {
  return {
    groups: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: jest.fn(),
    ...overrides,
  };
}

describe('GroupsScreen', () => {
  it('shows the screen heading', () => {
    mockedUseGroups.mockReturnValue(state());
    render(<GroupsScreen />);
    expect(screen.getByText('Groups')).toBeVisible();
  });

  it('shows an empty state when the user has no groups', () => {
    mockedUseGroups.mockReturnValue(state());
    render(<GroupsScreen />);
    expect(screen.getByText('No groups yet')).toBeVisible();
  });

  it('offers a way to create one', () => {
    mockedUseGroups.mockReturnValue(state());
    render(<GroupsScreen />);
    expect(screen.getByRole('button', { name: 'Create a group' })).toBeVisible();
  });

  it('lists the groups the user belongs to', () => {
    mockedUseGroups.mockReturnValue(
      state({
        groups: [
          {
            id: 'g1',
            title: 'Goa, March',
            description: 'Four days, no fixed plan',
            coverUrl: null,
            memberCount: 3,
            role: 'owner',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      })
    );

    render(<GroupsScreen />);

    expect(screen.getByText('Goa, March')).toBeVisible();
    expect(screen.getByText('3 members')).toBeVisible();
    expect(screen.queryByText('No groups yet')).toBeNull();
  });

  it('surfaces a load failure instead of pretending the list is empty', () => {
    mockedUseGroups.mockReturnValue(state({ error: 'Could not load your groups.' }));
    render(<GroupsScreen />);
    expect(screen.getByText('Could not load your groups.')).toBeVisible();
  });
});
