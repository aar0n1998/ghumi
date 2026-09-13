import { decode } from 'base64-arraybuffer';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { GroupSummary } from '@/hooks/use-groups';
import { GROUP_COVERS_BUCKET, supabase } from '@/lib/supabase';

export type NewGroup = {
  title: string;
  description: string;
  /** Base64 payload from the image picker, or null for no cover. */
  cover: { base64: string; mimeType: string } | null;
};

export type CreateGroupState = {
  isCreating: boolean;
  error: string | null;
  createGroup: (input: NewGroup) => Promise<GroupSummary>;
  clearError: () => void;
};

function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/** `image/jpeg` → `jpg`, so the stored object keeps a sensible extension. */
function extensionFor(mimeType: string): string {
  const subtype = mimeType.split('/')[1] ?? 'jpg';
  return subtype === 'jpeg' ? 'jpg' : subtype;
}

/**
 * Uploads a cover and returns its public URL.
 *
 * The image arrives as base64 rather than a blob on purpose: `fetch(fileUri)`
 * followed by `.blob()` silently uploads a zero-byte object under Hermes, which
 * is a genuinely horrible bug to chase. base64 → ArrayBuffer is the reliable
 * path in React Native.
 *
 * The object is keyed by uploader id, not group id, because the group row does
 * not exist yet at this point — see the storage policies in migration 0002.
 */
async function uploadCover(
  userId: string,
  cover: NonNullable<NewGroup['cover']>
): Promise<string> {
  const suffix = Math.random().toString(36).slice(2, 10);
  const path = `${userId}/${Date.now()}-${suffix}.${extensionFor(cover.mimeType)}`;

  const { error } = await supabase.storage
    .from(GROUP_COVERS_BUCKET)
    .upload(path, decode(cover.base64), { contentType: cover.mimeType, upsert: false });

  if (error) {
    // "Bucket not found" means the storage migration has not been applied. Say
    // so, rather than making the user decode a Supabase internal string.
    if (/bucket not found/i.test(error.message)) {
      throw new Error(
        `Cover images are not set up yet — the "${GROUP_COVERS_BUCKET}" storage bucket is missing. ` +
          'Create a group without a cover, or apply supabase/migrations/0002_group_covers_storage.sql.'
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from(GROUP_COVERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Creates a group.
 *
 * Separate from `useGroups` so the create screen does not also run the list
 * query on mount. Membership is not inserted here — the `on_group_created`
 * trigger enrols the creator as owner, which keeps it atomic with the insert.
 */
export function useCreateGroup(): CreateGroupState {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  const createGroup = useCallback(
    async (input: NewGroup): Promise<GroupSummary> => {
      const userId = user?.id;
      if (!userId) throw new Error('You need to be signed in to create a group.');

      setIsCreating(true);
      setError(null);

      try {
        // Uploaded first so a storage failure surfaces before a group exists.
        const coverUrl = input.cover ? await uploadCover(userId, input.cover) : null;

        // Goes through an RPC rather than `.insert().select()` on purpose.
        // That compiles to `INSERT ... RETURNING`, and Postgres will only hand
        // back a row that already satisfies the table's SELECT policy — which
        // here is `is_group_member(id)`, satisfied only once the AFTER INSERT
        // trigger has enrolled the creator. The row was invisible to its own
        // creator and every create failed with "new row violates row-level
        // security policy". See supabase/migrations/0003_create_group_rpc.sql.
        const { data, error: rpcError } = await supabase.rpc('create_group', {
          p_title: input.title.trim(),
          p_description: input.description.trim() || null,
          p_cover_url: coverUrl,
        });

        if (rpcError) throw rpcError;

        const created = data?.[0];
        if (!created) throw new Error('The group was not created. Please try again.');

        return {
          id: created.id,
          title: created.title,
          description: created.description,
          coverUrl: created.cover_url,
          // create_group() enrols the caller as owner, so it is never empty.
          memberCount: 1,
          role: 'owner',
          createdAt: created.created_at,
        };
      } catch (cause) {
        const message = messageFrom(cause, 'Could not create the group.');
        if (isMounted.current) setError(message);
        throw new Error(message);
      } finally {
        if (isMounted.current) setIsCreating(false);
      }
    },
    [user?.id]
  );

  const clearError = useCallback(() => setError(null), []);

  return { isCreating, error, createGroup, clearError };
}
