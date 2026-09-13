import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

/** A group as it appears in the list on the Groups tab. */
export type GroupSummary = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  memberCount: number;
  role: 'owner' | 'member';
  createdAt: string;
};

export type GroupsState = {
  groups: GroupSummary[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/**
 * Every group the signed-in user belongs to.
 *
 * Reads through `group_members` rather than `groups` so one query returns both
 * the group and the caller's role in it. RLS limits the rows to the caller's
 * own memberships either way.
 *
 * Refetches whenever the screen regains focus, which is what keeps the list
 * current after creating a group, joining one from a link, or leaving one —
 * none of which happen on this screen.
 */
export function useGroups(): GroupsState {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'background') => {
    if (mode === 'refresh') setIsRefreshing(true);

    try {
      const { data, error: queryError } = await supabase
        .from('group_members')
        .select('role, groups!inner(id, title, description, cover_url, created_at)')
        .order('joined_at', { ascending: false });

      if (queryError) throw queryError;

      const rows = data ?? [];

      // Member counts need a second query: PostgREST cannot aggregate a sibling
      // relationship inside the same select without a view to hang it on.
      const ids = rows.map((row) => row.groups.id);
      const counts = new Map<string, number>();

      if (ids.length > 0) {
        const { data: memberRows, error: countError } = await supabase
          .from('group_members')
          .select('group_id')
          .in('group_id', ids);

        if (countError) throw countError;

        for (const member of memberRows ?? []) {
          counts.set(member.group_id, (counts.get(member.group_id) ?? 0) + 1);
        }
      }

      if (!isMounted.current) return;

      setGroups(
        rows.map((row) => ({
          id: row.groups.id,
          title: row.groups.title,
          description: row.groups.description,
          coverUrl: row.groups.cover_url,
          memberCount: counts.get(row.groups.id) ?? 1,
          role: row.role,
          createdAt: row.groups.created_at,
        }))
      );
      setError(null);
    } catch (cause) {
      if (isMounted.current) setError(messageFrom(cause, 'Could not load your groups.'));
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // The first focus is the initial load and shows a spinner; later ones run
      // silently so returning to the tab does not flash a loading state.
      void load(hasLoadedOnce.current ? 'background' : 'initial');
      hasLoadedOnce.current = true;
    }, [load])
  );

  const refresh = useCallback(() => load('refresh'), [load]);

  return { groups, isLoading, isRefreshing, error, refresh };
}
