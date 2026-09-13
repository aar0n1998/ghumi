import { act, renderHook } from '@testing-library/react-native';

import { useCreateGroup } from '@/hooks/use-create-group';
import { supabase } from '@/lib/supabase';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn(), storage: { from: jest.fn() } },
  isSupabaseConfigured: true,
  GROUP_COVERS_BUCKET: 'group-covers',
}));

const rpc = supabase.rpc as unknown as jest.Mock;
const storageFrom = supabase.storage.from as unknown as jest.Mock;

const createdRow = {
  id: 'g1',
  title: 'Goa, March',
  description: 'Four days',
  cover_url: null,
  invite_code: 'ABCD2345',
  created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  rpc.mockReset();
  storageFrom.mockReset();
});

describe('useCreateGroup', () => {
  /**
   * Regression guard. This used to be `.insert().select().single()`, which
   * compiles to `INSERT ... RETURNING`. Postgres only returns a row that already
   * satisfies the table's SELECT policy, and membership is created by an AFTER
   * INSERT trigger — so every create failed with "new row violates row-level
   * security policy". Creation must go through the security-definer RPC.
   */
  it('creates through the create_group RPC, not a direct insert', async () => {
    rpc.mockResolvedValue({ data: [createdRow], error: null });

    const { result } = renderHook(() => useCreateGroup());

    await act(async () => {
      await result.current.createGroup({ title: 'Goa, March', description: 'Four days', cover: null });
    });

    expect(rpc).toHaveBeenCalledWith('create_group', {
      p_title: 'Goa, March',
      p_description: 'Four days',
      p_cover_url: null,
    });
  });

  it('maps the returned row into a group summary', async () => {
    rpc.mockResolvedValue({ data: [createdRow], error: null });

    const { result } = renderHook(() => useCreateGroup());

    let created;
    await act(async () => {
      created = await result.current.createGroup({
        title: 'Goa, March',
        description: 'Four days',
        cover: null,
      });
    });

    expect(created).toEqual({
      id: 'g1',
      title: 'Goa, March',
      description: 'Four days',
      coverUrl: null,
      memberCount: 1,
      role: 'owner',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('trims the title and sends an empty description as null', async () => {
    rpc.mockResolvedValue({ data: [createdRow], error: null });

    const { result } = renderHook(() => useCreateGroup());

    await act(async () => {
      await result.current.createGroup({ title: '  Goa  ', description: '   ', cover: null });
    });

    expect(rpc).toHaveBeenCalledWith('create_group', {
      p_title: 'Goa',
      p_description: null,
      p_cover_url: null,
    });
  });

  it('surfaces the database message when the RPC fails', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('A group needs a title.') });

    const { result } = renderHook(() => useCreateGroup());

    await act(async () => {
      await expect(
        result.current.createGroup({ title: 'x', description: '', cover: null })
      ).rejects.toThrow('A group needs a title.');
    });

    expect(result.current.error).toBe('A group needs a title.');
  });

  it('explains a missing storage bucket instead of leaking "Bucket not found"', async () => {
    storageFrom.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: new Error('Bucket not found') }),
      getPublicUrl: jest.fn(),
    });

    const { result } = renderHook(() => useCreateGroup());

    await act(async () => {
      await expect(
        result.current.createGroup({
          title: 'Goa',
          description: '',
          cover: { base64: 'AAAA', mimeType: 'image/jpeg' },
        })
      ).rejects.toThrow(/storage bucket is missing/i);
    });

    expect(rpc).not.toHaveBeenCalled();
  });

  it('uploads the cover and passes its public URL to the RPC', async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    storageFrom.mockReturnValue({
      upload,
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://x/c.jpg' } }),
    });
    rpc.mockResolvedValue({ data: [{ ...createdRow, cover_url: 'https://x/c.jpg' }], error: null });

    const { result } = renderHook(() => useCreateGroup());

    await act(async () => {
      await result.current.createGroup({
        title: 'Goa',
        description: '',
        cover: { base64: 'AAAA', mimeType: 'image/jpeg' },
      });
    });

    expect(upload).toHaveBeenCalled();
    // Objects are keyed by uploader id; the group does not exist yet.
    expect(upload.mock.calls[0][0]).toMatch(/^u1\//);
    expect(rpc).toHaveBeenCalledWith(
      'create_group',
      expect.objectContaining({ p_cover_url: 'https://x/c.jpg' })
    );
  });
});
