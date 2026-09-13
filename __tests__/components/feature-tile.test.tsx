import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { FeatureTile } from '@/components/feature-tile';
import { GROUP_FEATURES } from '@/lib/group-features';

describe('FeatureTile', () => {
  it('shows the label and its one-line blurb', () => {
    render(<FeatureTile feature={GROUP_FEATURES[0]} onPress={jest.fn()} />);

    expect(screen.getByText(GROUP_FEATURES[0].label)).toBeVisible();
    expect(screen.getByText(GROUP_FEATURES[0].blurb)).toBeVisible();
  });

  it('calls back when pressed', () => {
    const onPress = jest.fn();
    render(<FeatureTile feature={GROUP_FEATURES[0]} onPress={onPress} />);

    fireEvent.press(screen.getByText(GROUP_FEATURES[0].label));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('GROUP_FEATURES', () => {
  it('fills the two-column grid exactly', () => {
    expect(GROUP_FEATURES).toHaveLength(6);
  });

  it('has unique ids, since they become route segments', () => {
    const ids = GROUP_FEATURES.map((feature) => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
