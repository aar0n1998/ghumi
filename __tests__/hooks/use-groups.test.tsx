import { renderHook, waitFor } from '@testing-library/react-native';

import { useGroups } from '@/hooks/use-groups';
import { supabase } from '@/lib/supabase';

// useFocusEffect needs a navigator; the hook only uses it to schedule the load,
// so run the effect straight away instead of standing up a navigation tree.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = require('react');
    useEffect(effect, [effect]);
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  isSupabaseConfigured: true,
  GROUP_COVERS_BUCKET: 'group-covers',
}));

const from = supabase.from as unknown as jest.Mock;

/** `group_members` is queried twice per load: the join, then the member counts. */
function mockQueries(membership: unknown, counts: unknown) {
  from.mockReset();
  from
    .mockReturnValueOnce({
      select: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue(membership) }),
    })
    .mockReturnValueOnce({
      select: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue(counts) }),
    });
}

describe('useGroups', () => {
  it('maps membership rows into group summaries', async () => {
    mockQueries(
      {
        data: [
          {
            role: 'owner',
            groups: {
              id: 'g1',
              title: 'Goa, March',
              description: 'Four days',
              cover_url: 'https://example.com/c.jpg',
              created_at: '2026-01-01T00:00:00Z',
            },
          },
        ],
        error: null,
      },
      { data: [{ group_id: 'g1' }, { group_id: 'g1' }, { group_id: 'g1' }], error: null }
    );

    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toEqual([
      {
        id: 'g1',
        title: 'Goa, March',
        description: 'Four days',
        coverUrl: 'https://example.com/c.jpg',
        memberCount: 3,
        role: 'owner',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);
  });

  it('skips the count query when there are no groups', async () => {
    mockQueries({ data: [], error: null }, { data: [], error: null });

    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('reports a query failure instead of showing an empty list', async () => {
    mockQueries({ data: null, error: new Error('permission denied') }, { data: [], error: null });

    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('permission denied');
    expect(result.current.groups).toEqual([]);
  });
});
