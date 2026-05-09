import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/themed-text';

describe('ThemedText', () => {
  it('renders its children', () => {
    render(<ThemedText>Hello world</ThemedText>);
    expect(screen.getByText('Hello world')).toBeVisible();
  });

  it('applies title styles when type="title"', () => {
    render(<ThemedText type="title">Big title</ThemedText>);
    const el = screen.getByText('Big title');
    // Flatten the style array and check the font properties
    const flatStyle = [el.props.style].flat(Infinity);
    expect(flatStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 32, fontWeight: 'bold' }),
      ])
    );
  });

  it('applies link colour when type="link"', () => {
    render(<ThemedText type="link">Click me</ThemedText>);
    const el = screen.getByText('Click me');
    const flatStyle = [el.props.style].flat(Infinity);
    expect(flatStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#0a7ea4' }),
      ])
    );
  });
});
