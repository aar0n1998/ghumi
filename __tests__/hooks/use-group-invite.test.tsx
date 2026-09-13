import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGroupInvite } from '@/hooks/use-group-invite';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
  isSupabaseConfigured: true,
  GROUP_COVERS_BUCKET: 'group-covers',
}));

const rpc = supabase.rpc as unknown as jest.Mock;

const previewRow = {
  id: 'g1',
  title: 'Goa, March',
  description: 'Four days',
  cover_url: null,
  member_count: 3,
  host_name: 'Aaron',
  created_at: '2026-01-01T00:00:00Z',
  already_member: false,
};

beforeEach(() => rpc.mockReset());

describe('useGroupInvite', () => {
  it('resolves the code through the preview RPC', async () => {
    rpc.mockResolvedValue({ data: [previewRow], error: null });

    const { result } = renderHook(() => useGroupInvite('ABCD2345'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(rpc).toHaveBeenCalledWith('get_group_preview', { p_invite_code: 'ABCD2345' });
    expect(result.current.preview).toEqual({
      id: 'g1',
      title: 'Goa, March',
      description: 'Four days',
      coverUrl: null,
      memberCount: 3,
      hostName: 'Aaron',
      createdAt: '2026-01-01T00:00:00Z',
      alreadyMember: false,
    });
  });

  it('flags an unknown code as invalid rather than erroring', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useGroupInvite('NOPENOPE'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isInvalid).toBe(true);
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('treats a missing code as invalid without calling out', async () => {
    const { result } = renderHook(() => useGroupInvite(undefined));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isInvalid).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('joins through the RPC and returns the group id', async () => {
    rpc.mockResolvedValueOnce({ data: [previewRow], error: null });

    const { result } = renderHook(() => useGroupInvite('ABCD2345'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rpc.mockResolvedValueOnce({ data: 'g1', error: null });

    let joined: string | undefined;
    await act(async () => {
      joined = await result.current.join();
    });

    expect(rpc).toHaveBeenLastCalledWith('join_group', { p_invite_code: 'ABCD2345' });
    expect(joined).toBe('g1');
  });

  it('surfaces the database message when the join is refused', async () => {
    rpc.mockResolvedValueOnce({ data: [previewRow], error: null });

    const { result } = renderHook(() => useGroupInvite('ABCD2345'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rpc.mockResolvedValueOnce({
      data: null,
      error: new Error('That invite link is not valid any more.'),
    });

    await act(async () => {
      await expect(result.current.join()).rejects.toThrow('That invite link is not valid any more.');
    });

    expect(result.current.error).toBe('That invite link is not valid any more.');
  });
});
