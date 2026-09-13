import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

/** The safe, pre-join view of a group. Deliberately less than a full row. */
export type GroupPreview = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  memberCount: number;
  hostName: string | null;
  createdAt: string;
  alreadyMember: boolean;
};

export type GroupInviteState = {
  preview: GroupPreview | null;
  isLoading: boolean;
  /** True when the code matched no group — revoked, mistyped, or deleted. */
  isInvalid: boolean;
  isJoining: boolean;
  error: string | null;
  /** Joins the group and resolves with its id. */
  join: () => Promise<string>;
};

function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/**
 * Resolves an invite code to the preview shown before joining, and performs
 * the join.
 *
 * Both go through security-definer RPCs rather than table reads: a non-member
 * has no select access to `groups` at all, which is what stops a guessed code
 * from leaking anything beyond the fields on this screen.
 */
export function useGroupInvite(inviteCode: string | undefined): GroupInviteState {
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!inviteCode) {
      setIsLoading(false);
      setIsInvalid(true);
      return;
    }

    setIsLoading(true);

    // The query builder is a thenable, not a real Promise — no `.finally`.
    void (async () => {
      const { data, error: rpcError } = await supabase.rpc('get_group_preview', {
        p_invite_code: inviteCode,
      });

      if (!isMounted.current) return;

      if (rpcError) {
        setError(rpcError.message);
      } else {
        const row = data?.[0];

        if (!row) {
          setIsInvalid(true);
        } else {
          setPreview({
            id: row.id,
            title: row.title,
            description: row.description,
            coverUrl: row.cover_url,
            memberCount: Number(row.member_count),
            hostName: row.host_name,
            createdAt: row.created_at,
            alreadyMember: row.already_member,
          });
        }
      }

      setIsLoading(false);
    })();

    return () => {
      isMounted.current = false;
    };
  }, [inviteCode]);

  const join = useCallback(async (): Promise<string> => {
    if (!inviteCode) throw new Error('There is no invite code to join with.');

    setIsJoining(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('join_group', {
        p_invite_code: inviteCode,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('That invite link is not valid any more.');

      return data;
    } catch (cause) {
      const message = messageFrom(cause, 'Could not join this group.');
      if (isMounted.current) setError(message);
      throw new Error(message);
    } finally {
      if (isMounted.current) setIsJoining(false);
    }
  }, [inviteCode]);

  return { preview, isLoading, isInvalid, isJoining, error, join };
}
