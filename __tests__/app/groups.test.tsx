import { render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupsScreen from '@/app/(tabs)/index';

describe('GroupsScreen', () => {
  it('shows the screen heading', () => {
    render(<GroupsScreen />);
    expect(screen.getByText('Groups')).toBeVisible();
  });

  it('shows an empty state until groups exist', () => {
    render(<GroupsScreen />);
    expect(screen.getByText('No groups yet')).toBeVisible();
  });
});
