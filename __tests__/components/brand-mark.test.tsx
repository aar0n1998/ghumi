import { render } from '@testing-library/react-native';
import React from 'react';

import { BrandMark } from '@/components/brand-mark';

describe('BrandMark', () => {
  it('renders at the requested size', () => {
    const { UNSAFE_root } = render(<BrandMark size={120} />);
    const svg = UNSAFE_root.findByProps({ viewBox: '0 0 100 100' });
    expect(svg.props.width).toBe(120);
    expect(svg.props.height).toBe(120);
  });

  it('defaults to a 96pt mark', () => {
    const { UNSAFE_root } = render(<BrandMark />);
    expect(UNSAFE_root.findByProps({ viewBox: '0 0 100 100' }).props.width).toBe(96);
  });
});
