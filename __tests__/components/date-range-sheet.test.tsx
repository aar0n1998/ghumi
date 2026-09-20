import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import { DateRangeSheet } from '@/components/date-range-sheet';

describe('DateRangeSheet', () => {
  it('opens on the month of the current value', () => {
    render(
      <DateRangeSheet
        visible
        value={{ startsOn: '2027-03-04', endsOn: '2027-03-07' }}
        onDismiss={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    expect(screen.getByText('March 2027')).toBeVisible();
    expect(screen.getByText('4–7 Mar')).toBeVisible();
  });

  it('pages to another month', async () => {
    const user = userEvent.setup();
    render(
      <DateRangeSheet
        visible
        value={{ startsOn: '2027-03-04', endsOn: '2027-03-07' }}
        onDismiss={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    await user.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('April 2027')).toBeVisible();
  });

  it('takes two taps to make a range', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(
      <DateRangeSheet
        visible
        value={{ startsOn: '2027-03-04', endsOn: '2027-03-07' }}
        onDismiss={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.press(screen.getByRole('button', { name: '2027-03-10' }));
    await user.press(screen.getByRole('button', { name: '2027-03-12' }));
    await user.press(screen.getByRole('button', { name: 'Done' }));

    expect(onConfirm).toHaveBeenCalledWith({ startsOn: '2027-03-10', endsOn: '2027-03-12' });
  });

  it('restarts the range when the second tap is earlier than the first', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    // A value only sets which month opens here; both taps below replace it.
    render(
      <DateRangeSheet
        visible
        value={{ startsOn: '2027-03-01', endsOn: '2027-03-01' }}
        onDismiss={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.press(screen.getByRole('button', { name: '2027-03-12' }));
    await user.press(screen.getByRole('button', { name: '2027-03-10' }));
    await user.press(screen.getByRole('button', { name: 'Done' }));

    // The earlier day becomes the new start, not an invalid backwards range.
    expect(onConfirm).toHaveBeenCalledWith({ startsOn: '2027-03-10', endsOn: '2027-03-10' });
  });

  it('can clear the dates entirely', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(
      <DateRangeSheet
        visible
        value={{ startsOn: '2027-03-04', endsOn: '2027-03-07' }}
        onDismiss={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.press(screen.getByRole('button', { name: 'Clear dates' }));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });
});
