import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import { PlanModeCard } from '@/components/plan-mode-card';
import type { PlanMode } from '@/lib/plan-modes';

const ready: PlanMode = {
  id: 'group',
  label: 'Group',
  blurb: 'Invite people, split costs, stay in sync',
  icon: 'person.2.fill',
  status: 'ready',
};

const soon: PlanMode = {
  id: 'agency',
  label: 'Agency',
  blurb: 'Register as an agency',
  icon: 'briefcase.fill',
  status: 'soon',
};

describe('PlanModeCard', () => {
  it('shows the label and blurb', () => {
    render(<PlanModeCard mode={ready} onPress={jest.fn()} />);
    expect(screen.getByText('Group')).toBeVisible();
    expect(screen.getByText('Invite people, split costs, stay in sync')).toBeVisible();
  });

  it('badges a mode that is not built yet', () => {
    render(<PlanModeCard mode={soon} onPress={jest.fn()} />);
    expect(screen.getByText('Soon')).toBeVisible();
  });

  it('leaves a working mode unbadged', () => {
    render(<PlanModeCard mode={ready} onPress={jest.fn()} />);
    expect(screen.queryByText('Soon')).toBeNull();
  });

  it('tells a screen reader which modes are still coming', () => {
    render(<PlanModeCard mode={soon} onPress={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Agency. Register as an agency. Coming soon.' })
    ).toBeVisible();
  });

  it('calls back when pressed', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(<PlanModeCard mode={ready} onPress={onPress} />);
    await user.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
