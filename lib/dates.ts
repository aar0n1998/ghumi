/**
 * Date helpers for trip dates and availability.
 *
 * Postgres `date` columns arrive and leave as `YYYY-MM-DD` strings, and that is
 * what the app passes around — never a `Date`. A calendar day has no time zone,
 * and turning one into a `Date` is where off-by-one bugs come from: parsing
 * "2027-03-04" with `new Date()` yields UTC midnight, which is 3 March in any
 * negative offset. Everything here builds dates from their parts instead.
 *
 * No dependency: the app needs a month grid and two label formats, not a
 * date library.
 */

/** A calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

export type DateRange = {
  startsOn: IsoDate;
  endsOn: IsoDate;
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && ISO_PATTERN.test(value);
}

/** Local calendar day for a `Date`, with no UTC round trip. */
export function toIso(date: Date): IsoDate {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local midnight for an ISO day. Built from parts — see the note above. */
export function fromIso(iso: IsoDate): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function today(): IsoDate {
  return toIso(new Date());
}

/** Negative `count` walks backwards. */
export function addDays(iso: IsoDate, count: number): IsoDate {
  const date = fromIso(iso);
  date.setDate(date.getDate() + count);
  return toIso(date);
}

export function addMonths(iso: IsoDate, count: number): IsoDate {
  const date = fromIso(iso);
  // Clamp to the first, so stepping from the 31st never skips a short month.
  date.setDate(1);
  date.setMonth(date.getMonth() + count);
  return toIso(date);
}

/** "4 Mar" */
export function formatDay(iso: IsoDate): string {
  const date = fromIso(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "March 2027" */
export function formatMonth(iso: IsoDate): string {
  const date = fromIso(iso);
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * "4–7 Mar" · "28 Feb – 3 Mar" · "30 Dec 2027 – 2 Jan 2028" · "4 Mar"
 *
 * The year only appears when the range crosses one, because a trip in a
 * fortnight does not need telling you which year it is in.
 */
export function formatRange(startsOn: IsoDate, endsOn: IsoDate): string {
  const start = fromIso(startsOn);
  const end = fromIso(endsOn);

  if (startsOn === endsOn) return formatDay(startsOn);

  if (start.getFullYear() !== end.getFullYear()) {
    return `${formatDay(startsOn)} ${start.getFullYear()} – ${formatDay(endsOn)} ${end.getFullYear()}`;
  }

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`;
  }

  return `${formatDay(startsOn)} – ${formatDay(endsOn)}`;
}

/** Inclusive day count: 4 Mar to 7 Mar is 4 nights' worth of days. */
export function daysInRange(startsOn: IsoDate, endsOn: IsoDate): number {
  const ms = fromIso(endsOn).getTime() - fromIso(startsOn).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** True when `outer` completely contains `inner`. */
export function covers(outer: DateRange, inner: DateRange): boolean {
  return outer.startsOn <= inner.startsOn && outer.endsOn >= inner.endsOn;
}

/**
 * The window every range has in common, or null when there isn't one.
 *
 * ISO days compare correctly as strings, which is the whole reason the app
 * keeps them in that shape.
 */
export function intersect(ranges: readonly DateRange[]): DateRange | null {
  if (ranges.length === 0) return null;

  let startsOn = ranges[0].startsOn;
  let endsOn = ranges[0].endsOn;

  for (const range of ranges.slice(1)) {
    if (range.startsOn > startsOn) startsOn = range.startsOn;
    if (range.endsOn < endsOn) endsOn = range.endsOn;
  }

  return startsOn <= endsOn ? { startsOn, endsOn } : null;
}

export type MonthCell = {
  /** Null for the blank cells before the first of the month. */
  iso: IsoDate | null;
  day: number | null;
};

/**
 * Six weeks of cells for a month grid, Sunday first, padded so every week has
 * seven entries. A fixed cell count keeps the picker from resizing as the user
 * pages between months.
 */
export function monthGrid(iso: IsoDate): MonthCell[] {
  const anchor = fromIso(iso);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const leading = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();

  const cells: MonthCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const day = index - leading + 1;
    cells.push(
      day >= 1 && day <= length
        ? { iso: toIso(new Date(year, month, day)), day }
        : { iso: null, day: null }
    );
  }

  return cells;
}
