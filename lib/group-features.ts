import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type GroupFeature = {
  /** Stable key — becomes the route segment when these get built out. */
  id: string;
  label: string;
  /** One line of what the tile will do, shown under the label. */
  blurb: string;
  icon: IconSymbolName;
  /** Which theme colour token tints the tile's icon. */
  tone: 'tint' | 'accent';
};

/**
 * The six things a group can hold. All placeholders today — tapping one says
 * so rather than navigating, so the shape of the product is visible before any
 * of it is built.
 *
 * Adding a seventh breaks the two-column grid's symmetry; prefer replacing one.
 */
export const GROUP_FEATURES: readonly GroupFeature[] = [
  {
    id: 'chat',
    label: 'Chat',
    blurb: 'Plan out loud, together',
    icon: 'bubble.left.and.bubble.right.fill',
    tone: 'tint',
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    blurb: 'Dates, flights and stays',
    icon: 'calendar',
    tone: 'accent',
  },
  {
    id: 'places',
    label: 'Places',
    blurb: 'The shortlist, pinned',
    icon: 'mappin.and.ellipse',
    tone: 'tint',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    blurb: 'Who paid, who owes',
    icon: 'creditcard.fill',
    tone: 'accent',
  },
  {
    id: 'documents',
    label: 'Documents',
    blurb: 'Tickets, visas, bookings',
    icon: 'doc.text.fill',
    tone: 'tint',
  },
  {
    id: 'packing',
    label: 'Packing',
    blurb: 'Nobody forgets the adapter',
    icon: 'suitcase.fill',
    tone: 'accent',
  },
] as const;
