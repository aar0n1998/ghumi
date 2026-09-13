import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { GroupCover } from '@/components/group-cover';

// The fallback initials are decorative and hidden from assistive tech, so the
// queries have to opt into hidden elements to see them at all.
describe('GroupCover', () => {
  it('falls back to initials when there is no image', () => {
    render(<GroupCover uri={null} title="Goa With The Boys" />);
    expect(screen.getByText('GW', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('uses a single initial for a one-word title', () => {
    render(<GroupCover uri={null} title="Goa" />);
    expect(screen.getByText('G', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('does not render initials over a real cover image', () => {
    render(<GroupCover uri="https://example.com/cover.jpg" title="Goa" />);
    expect(screen.queryByText('G', { includeHiddenElements: true })).toBeNull();
  });
});
