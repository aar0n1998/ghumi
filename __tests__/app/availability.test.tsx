import { render, screen } from '@testing-library/react-native';
import React from 'react';

import AvailabilityScreen from '@/app/availability/[id]';
import { useGroupAvailability, type AvailabilityState } from '@/hooks/use-group-availability';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'g1' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

jest.mock('@/hooks/use-group-availability', () => ({ useGroupAvailability: jest.fn() }));

const mocked = useGroupAvailability as jest.MockedFunction<typeof useGroupAvailability>;

function state(overrides: Partial<AvailabilityState> = {}): AvailabilityState {
  return {
    title: 'Goa, March',
    tripDates: { startsOn: '2027-03-04', endsOn: '2027-03-07' },
    members: [
      {
        userId: 'u1',
        displayName: 'Aston',
        avatarUrl: null,
        role: 'owner',
        isYou: false,
        range: { startsOn: '2027-03-09', endsOn: '2027-03-20' },
        freeForTrip: false,
      },
      {
        userId: 'u2',
        displayName: 'Warth',
        avatarUrl: null,
        role: 'member',
        isYou: true,
        range: { startsOn: '2027-03-02', endsOn: '2027-03-14' },
        freeForTrip: true,
      },
    ],
    yours: { startsOn: '2027-03-02', endsOn: '2027-03-14' },
    freeCount: 1,
    sharedCount: 2,
    commonWindow: { startsOn: '2027-03-09', endsOn: '2027-03-14' },
    isLoading: false,
    isRefreshing: false,
    isSaving: false,
    notFound: false,
    error: null,
    refresh: jest.fn(),
    share: jest.fn(),
    clearMine: jest.fn(),
    ...overrides,
  };
}

describe('AvailabilityScreen', () => {
  it('shows the trip it is about', () => {
    mocked.mockReturnValue(state());
    render(<AvailabilityScreen />);
    expect(screen.getByText('Goa, March')).toBeVisible();
    expect(screen.getByText('4–7 Mar · 2 members')).toBeVisible();
  });

  it('counts who can make the trip dates', () => {
    mocked.mockReturnValue(state());
    render(<AvailabilityScreen />);
    expect(screen.getByText('1 of 2 free for 4–7 Mar')).toBeVisible();
  });

  it('suggests the window everyone shares', () => {
    mocked.mockReturnValue(state());
    render(<AvailabilityScreen />);
    expect(screen.getByText(/free 9–14 Mar/i)).toBeVisible();
  });

  it('does not suggest a window identical to the trip dates', () => {
    mocked.mockReturnValue(
      state({ commonWindow: { startsOn: '2027-03-04', endsOn: '2027-03-07' } })
    );
    render(<AvailabilityScreen />);
    expect(screen.queryByText(/everyone who has answered/i)).toBeNull();
  });

  it('offers to change your dates once you have shared them', () => {
    mocked.mockReturnValue(state());
    render(<AvailabilityScreen />);
    expect(screen.getByRole('button', { name: 'Change your dates' })).toBeVisible();
  });

  it('asks for them when you have not', () => {
    mocked.mockReturnValue(state({ yours: null }));
    render(<AvailabilityScreen />);
    expect(screen.getByRole('button', { name: 'Share your dates' })).toBeVisible();
  });

  it('says when the group is gone', () => {
    mocked.mockReturnValue(state({ notFound: true }));
    render(<AvailabilityScreen />);
    expect(screen.getByText('Group unavailable')).toBeVisible();
  });
});
