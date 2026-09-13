import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

/** Styles arrive as nested arrays; flatten before asserting. */
function flatStyleOf(element: { props: { style?: unknown } }) {
  return [element.props.style].flat(Infinity);
}

describe('ThemedText', () => {
  it('renders its children', () => {
    render(<ThemedText>Hello world</ThemedText>);
    expect(screen.getByText('Hello world')).toBeVisible();
  });

  it('applies title styles when type="title"', () => {
    render(<ThemedText type="title">Big title</ThemedText>);
    expect(flatStyleOf(screen.getByText('Big title'))).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 32, fontWeight: 'bold' })])
    );
  });

  it('colours links from the theme tint rather than a hardcoded value', () => {
    render(<ThemedText type="link">Click me</ThemedText>);
    expect(flatStyleOf(screen.getByText('Click me'))).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: Colors.light.tint })])
    );
  });

  it('colours captions with the muted token', () => {
    render(<ThemedText type="caption">Some metadata</ThemedText>);
    expect(flatStyleOf(screen.getByText('Some metadata'))).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: Colors.light.muted })])
    );
  });
});
