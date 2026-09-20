import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import { VisibilityToggle } from '@/components/visibility-toggle';

describe('VisibilityToggle', () => {
  it('offers both options', () => {
    render(<VisibilityToggle value="private" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Private' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Public' })).toBeVisible();
  });

  it('marks the selected one for a screen reader', () => {
    render(<VisibilityToggle value="public" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Public' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Private' })).not.toBeSelected();
  });

  it('reports a change', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<VisibilityToggle value="private" onChange={onChange} />);
    await user.press(screen.getByRole('radio', { name: 'Public' }));

    expect(onChange).toHaveBeenCalledWith('public');
  });
});
