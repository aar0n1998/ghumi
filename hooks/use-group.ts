import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { DateRange } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

export type GroupMember = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string;
  /** True for the signed-in user's own row. */
  isYou: boolean;
};

export type GroupDetail = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  inviteCode: string;
  createdAt: string;
  /** The trip window, once it has one. */
  dates: DateRange | null;
  location: string | null;
  isPublic: boolean;
  members: GroupMember[];
  /** The signed-in user's role, or null if they somehow are not a member. */
  yourRole: 'owner' | 'member' | null;
};

export type GroupState = {
  group: GroupDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  /** Set when the group is gone, or the user is not a member of it. */
  notFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Rotates the invite code, invalidating any link already shared. */
  resetInviteLink: () => Promise<string>;
  /** Removes the signed-in user from the group. */
  leaveGroup: () => Promise<void>;
};

function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/** One group and its members. RLS returns nothing unless the caller is in it. */
export function useGroup(groupId: string | undefined): GroupState {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const currentUserId = user?.id ?? null;

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!groupId) {
        if (isMounted.current) {
          setIsLoading(false);
          setNotFound(true);
        }
        return;
      }

      if (mode === 'refresh') setIsRefreshing(true);

      try {
        const [groupResult, memberResult] = await Promise.all([
          supabase
            .from('groups')
            .select(
              'id, title, description, cover_url, invite_code, created_at, starts_on, ends_on, location, is_public'
            )
            .eq('id', groupId)
            .maybeSingle(),
          supabase
            .from('group_members')
            .select('user_id, role, joined_at, profiles(display_name, avatar_url)')
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true }),
        ]);

        if (groupResult.error) throw groupResult.error;
        if (memberResult.error) throw memberResult.error;

        if (!groupResult.data) {
          if (isMounted.current) {
            setGroup(null);
            setNotFound(true);
          }
          return;
        }

        const members: GroupMember[] = (memberResult.data ?? []).map((row) => ({
          userId: row.user_id,
          displayName: row.profiles?.display_name ?? null,
          avatarUrl: row.profiles?.avatar_url ?? null,
          role: row.role,
          joinedAt: row.joined_at,
          isYou: row.user_id === currentUserId,
        }));

        if (!isMounted.current) return;

        const { starts_on: startsOn, ends_on: endsOn } = groupResult.data;

        setGroup({
          id: groupResult.data.id,
          title: groupResult.data.title,
          description: groupResult.data.description,
          coverUrl: groupResult.data.cover_url,
          inviteCode: groupResult.data.invite_code,
          createdAt: groupResult.data.created_at,
          // Both columns are nullable independently, but a half-set range is
          // not a range — treat anything but a complete pair as "no dates".
          dates: startsOn && endsOn ? { startsOn, endsOn } : null,
          location: groupResult.data.location,
          isPublic: groupResult.data.is_public,
          members,
          yourRole: members.find((member) => member.isYou)?.role ?? null,
        });
        setNotFound(false);
        setError(null);
      } catch (cause) {
        if (isMounted.current) setError(messageFrom(cause, 'Could not load this group.'));
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [groupId, currentUserId]
  );

  useEffect(() => {
    isMounted.current = true;
    void load('initial');
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);

  const resetInviteLink = useCallback(async (): Promise<string> => {
    if (!groupId) throw new Error('No group to reset.');

    const { data, error: rpcError } = await supabase.rpc('regenerate_invite_code', {
      p_group_id: groupId,
    });

    if (rpcError) throw rpcError;
    if (!data) throw new Error('Could not reset the invite link.');

    if (isMounted.current) {
      setGroup((current) => (current ? { ...current, inviteCode: data } : current));
    }

    return data;
  }, [groupId]);

  const leaveGroup = useCallback(async (): Promise<void> => {
    if (!groupId || !currentUserId) throw new Error('No group to leave.');

    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', currentUserId);

    if (deleteError) throw deleteError;
  }, [groupId, currentUserId]);

  return { group, isLoading, isRefreshing, notFound, error, refresh, resetInviteLink, leaveGroup };
}
