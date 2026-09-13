import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { MemberRow } from '@/components/member-row';
import type { GroupMember } from '@/hooks/use-group';

const member: GroupMember = {
  userId: 'u1',
  displayName: 'Priya',
  avatarUrl: null,
  role: 'member',
  joinedAt: '2026-01-01T00:00:00Z',
  isYou: false,
};

describe('MemberRow', () => {
  it('shows the display name', () => {
    render(<MemberRow member={member} />);
    expect(screen.getByText('Priya')).toBeVisible();
  });

  it('marks your own row', () => {
    render(<MemberRow member={{ ...member, isYou: true }} />);
    expect(screen.getByText('Priya (you)')).toBeVisible();
  });

  it('badges the host', () => {
    render(<MemberRow member={{ ...member, role: 'owner' }} />);
    expect(screen.getByText('Host')).toBeVisible();
  });

  it('falls back to a placeholder name for a profile with none', () => {
    render(<MemberRow member={{ ...member, displayName: null }} />);
    expect(screen.getByText('Traveller')).toBeVisible();
  });
});
