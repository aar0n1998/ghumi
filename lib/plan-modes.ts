import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type PlanMode = {
  /** Stable key — becomes the route segment when a mode gets its own flow. */
  id: 'group' | 'solo' | 'agency';
  label: string;
  /** One line of what the mode does, shown under the label. No trailing stop. */
  blurb: string;
  icon: IconSymbolName;
  /** `ready` modes navigate; `soon` modes say so and go nowhere. */
  status: 'ready' | 'soon';
};

/**
 * The three ways to start planning, in the order they appear on the landing
 * screen. Group is first because it is the only one that exists.
 *
 * Solo and Agency are declared here rather than hidden so the shape of the
 * product is visible before it is built — the same reason the six group
 * features in `group-features.ts` ship as placeholder tiles.
 */
export const PLAN_MODES: readonly PlanMode[] = [
  {
    id: 'group',
    label: 'Group',
    blurb: 'Invite people, split costs, stay in sync',
    icon: 'person.2.fill',
    status: 'ready',
  },
  {
    id: 'solo',
    label: 'Solo',
    blurb: 'Just for you — flexible, no coordinating',
    icon: 'person.fill',
    status: 'soon',
  },
  {
    id: 'agency',
    label: 'Agency',
    blurb: 'Register as an agency',
    icon: 'briefcase.fill',
    status: 'soon',
  },
] as const;
