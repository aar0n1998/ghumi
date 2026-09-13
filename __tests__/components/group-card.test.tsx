import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { GroupCard } from '@/components/group-card';
import type { GroupSummary } from '@/hooks/use-groups';

const group: GroupSummary = {
  id: 'g1',
  title: 'Goa, March',
  description: 'Four days, no fixed plan',
  coverUrl: null,
  memberCount: 3,
  role: 'member',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('GroupCard', () => {
  it('shows the title, description and member count', () => {
    render(<GroupCard group={group} onPress={jest.fn()} />);

    expect(screen.getByText('Goa, March')).toBeVisible();
    expect(screen.getByText('Four days, no fixed plan')).toBeVisible();
    expect(screen.getByText('3 members')).toBeVisible();
  });

  it('uses the singular for a group of one', () => {
    render(<GroupCard group={{ ...group, memberCount: 1 }} onPress={jest.fn()} />);
    expect(screen.getByText('1 member')).toBeVisible();
  });

  it('marks the groups you host', () => {
    render(<GroupCard group={{ ...group, role: 'owner' }} onPress={jest.fn()} />);
    expect(screen.getByText('· You host')).toBeVisible();
  });

  it('opens the group when pressed', () => {
    const onPress = jest.fn();
    render(<GroupCard group={group} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Goa, March, 3 members' }));
    expect(onPress).toHaveBeenCalled();
  });
});
