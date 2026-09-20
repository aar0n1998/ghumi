import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { AvailabilityRow } from '@/components/availability-row';
import type { MemberAvailability } from '@/hooks/use-group-availability';

function member(overrides: Partial<MemberAvailability> = {}): MemberAvailability {
  return {
    userId: 'u1',
    displayName: 'Warth',
    avatarUrl: null,
    role: 'member',
    isYou: false,
    range: { startsOn: '2027-03-02', endsOn: '2027-03-14' },
    freeForTrip: true,
    ...overrides,
  };
}

describe('AvailabilityRow', () => {
  it('shows someone who can make it', () => {
    render(<AvailabilityRow member={member()} />);
    expect(screen.getByText('Warth')).toBeVisible();
    expect(screen.getByText('Free')).toBeVisible();
    expect(screen.getByText('Free 2–14 Mar')).toBeVisible();
  });

  it('shows someone whose dates clash', () => {
    render(
      <AvailabilityRow
        member={member({
          displayName: 'Aston',
          range: { startsOn: '2027-03-09', endsOn: '2027-03-20' },
          freeForTrip: false,
        })}
      />
    );
    expect(screen.getByText('Clashes')).toBeVisible();
    expect(screen.getByText('Free 9–20 Mar')).toBeVisible();
  });

  it('does not count silence as a no', () => {
    render(<AvailabilityRow member={member({ range: null, freeForTrip: null })} />);
    expect(screen.getByText('No dates yet')).toBeVisible();
    expect(screen.getByText('Has not shared dates yet')).toBeVisible();
    expect(screen.queryByText('Clashes')).toBeNull();
  });

  it('marks your own row', () => {
    render(<AvailabilityRow member={member({ displayName: 'Promit', isYou: true })} />);
    expect(screen.getByText('Promit (you)')).toBeVisible();
  });
});
