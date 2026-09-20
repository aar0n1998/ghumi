import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { covers, intersect, type DateRange } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

export type MemberAvailability = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  isYou: boolean;
  /** Null when this person has not shared dates yet — not "unavailable". */
  range: DateRange | null;
  /** True when their window contains the whole trip. Null when unknown. */
  freeForTrip: boolean | null;
};

export type AvailabilityState = {
  title: string | null;
  /** The trip's own dates, or null if the group has none set. */
  tripDates: DateRange | null;
  members: MemberAvailability[];
  /** Your own shared window, for pre-filling the picker. */
  yours: DateRange | null;
  /** How many of the people who shared can make the trip dates. */
  freeCount: number;
  sharedCount: number;
  /**
   * The window everyone who has shared could all travel in. Null when they do
   * not overlap at all, or when nobody has shared yet.
   */
  commonWindow: DateRange | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  notFound: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Adds or replaces your own window. */
  share: (range: DateRange) => Promise<void>;
  /** Withdraws it, back to "hasn't shared". */
  clearMine: () => Promise<void>;
};

function messageFrom(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/**
 * Who can make the trip, and when everyone could go instead.
 *
 * Availability is per group rather than global on purpose: "free in March" is
 * an answer about one trip, not a calendar the app has to keep in sync with
 * anyone's real one. A member with no row has not answered — the screen says
 * so rather than counting them out.
 */
export function useGroupAvailability(groupId: string | undefined): AvailabilityState {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [title, setTitle] = useState<string | null>(null);
  const [tripDates, setTripDates] = useState<DateRange | null>(null);
  const [members, setMembers] = useState<MemberAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

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
        const [groupResult, memberResult, availabilityResult] = await Promise.all([
          supabase
            .from('groups')
            .select('title, starts_on, ends_on')
            .eq('id', groupId)
            .maybeSingle(),
          supabase
            .from('group_members')
            .select('user_id, role, profiles(display_name, avatar_url)')
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true }),
          supabase
            .from('group_availability')
            .select('user_id, starts_on, ends_on')
            .eq('group_id', groupId),
        ]);

        if (groupResult.error) throw groupResult.error;
        if (memberResult.error) throw memberResult.error;
        if (availabilityResult.error) throw availabilityResult.error;

        if (!groupResult.data) {
          if (isMounted.current) {
            setNotFound(true);
            setMembers([]);
          }
          return;
        }

        const { starts_on: startsOn, ends_on: endsOn } = groupResult.data;
        const trip = startsOn && endsOn ? { startsOn, endsOn } : null;

        const shared = new Map<string, DateRange>();
        for (const row of availabilityResult.data ?? []) {
          shared.set(row.user_id, { startsOn: row.starts_on, endsOn: row.ends_on });
        }

        const nextMembers: MemberAvailability[] = (memberResult.data ?? []).map((row) => {
          const range = shared.get(row.user_id) ?? null;

          return {
            userId: row.user_id,
            displayName: row.profiles?.display_name ?? null,
            avatarUrl: row.profiles?.avatar_url ?? null,
            role: row.role,
            isYou: row.user_id === currentUserId,
            range,
            freeForTrip: range && trip ? covers(range, trip) : null,
          };
        });

        if (!isMounted.current) return;

        setTitle(groupResult.data.title);
        setTripDates(trip);
        setMembers(nextMembers);
        setNotFound(false);
        setError(null);
      } catch (cause) {
        if (isMounted.current) {
          setError(messageFrom(cause, 'Could not load who is free.'));
        }
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

  const share = useCallback(
    async (range: DateRange): Promise<void> => {
      if (!groupId || !currentUserId) throw new Error('You need to be in this group to add dates.');

      setIsSaving(true);
      setError(null);

      try {
        const { error: writeError } = await supabase.from('group_availability').upsert(
          {
            group_id: groupId,
            user_id: currentUserId,
            starts_on: range.startsOn,
            ends_on: range.endsOn,
          },
          { onConflict: 'group_id,user_id' }
        );

        if (writeError) throw writeError;
        await load('refresh');
      } catch (cause) {
        const message = messageFrom(cause, 'Could not save your dates.');
        if (isMounted.current) setError(message);
        throw new Error(message);
      } finally {
        if (isMounted.current) setIsSaving(false);
      }
    },
    [groupId, currentUserId, load]
  );

  const clearMine = useCallback(async (): Promise<void> => {
    if (!groupId || !currentUserId) return;

    setIsSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('group_availability')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId);

      if (deleteError) throw deleteError;
      await load('refresh');
    } catch (cause) {
      const message = messageFrom(cause, 'Could not remove your dates.');
      if (isMounted.current) setError(message);
      throw new Error(message);
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, [groupId, currentUserId, load]);

  const sharedRanges = members
    .map((member) => member.range)
    .filter((range): range is DateRange => range !== null);

  return {
    title,
    tripDates,
    members,
    yours: members.find((member) => member.isYou)?.range ?? null,
    freeCount: members.filter((member) => member.freeForTrip === true).length,
    sharedCount: sharedRanges.length,
    commonWindow: intersect(sharedRanges),
    isLoading,
    isRefreshing,
    isSaving,
    notFound,
    error,
    refresh,
    share,
    clearMine,
  };
}
