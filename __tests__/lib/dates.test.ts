import {
  addDays,
  addMonths,
  covers,
  daysInRange,
  formatDay,
  formatMonth,
  formatRange,
  fromIso,
  intersect,
  isIsoDate,
  monthGrid,
  toIso,
} from '@/lib/dates';

describe('iso days', () => {
  it('round-trips a date without drifting across a time zone', () => {
    const iso = '2027-03-04';
    expect(toIso(fromIso(iso))).toBe(iso);
    // The classic off-by-one: UTC parsing would land on the 3rd west of London.
    expect(fromIso(iso).getDate()).toBe(4);
  });

  it('recognises the shape', () => {
    expect(isIsoDate('2027-03-04')).toBe(true);
    expect(isIsoDate('4 March')).toBe(false);
    expect(isIsoDate(20270304)).toBe(false);
  });

  it('walks days in both directions, across a month end', () => {
    expect(addDays('2027-02-27', 3)).toBe('2027-03-02');
    expect(addDays('2027-03-02', -3)).toBe('2027-02-27');
  });

  it('steps months without skipping February', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-01');
    expect(addMonths('2027-01-15', 12)).toBe('2028-01-01');
  });
});

describe('formatting', () => {
  it('names a single day', () => {
    expect(formatDay('2027-03-04')).toBe('4 Mar');
  });

  it('names a month', () => {
    expect(formatMonth('2027-03-04')).toBe('March 2027');
  });

  it('collapses a range inside one month', () => {
    expect(formatRange('2027-03-04', '2027-03-07')).toBe('4–7 Mar');
  });

  it('spells out a range across months', () => {
    expect(formatRange('2027-02-28', '2027-03-03')).toBe('28 Feb – 3 Mar');
  });

  it('adds years only when the range crosses one', () => {
    expect(formatRange('2027-12-30', '2028-01-02')).toBe('30 Dec 2027 – 2 Jan 2028');
  });

  it('shows a one-day trip as a day', () => {
    expect(formatRange('2027-03-04', '2027-03-04')).toBe('4 Mar');
  });
});

describe('range maths', () => {
  it('counts days inclusively', () => {
    expect(daysInRange('2027-03-04', '2027-03-07')).toBe(4);
    expect(daysInRange('2027-03-04', '2027-03-04')).toBe(1);
  });

  it('knows when one window contains another', () => {
    const trip = { startsOn: '2027-03-04', endsOn: '2027-03-07' };
    expect(covers({ startsOn: '2027-03-02', endsOn: '2027-03-14' }, trip)).toBe(true);
    expect(covers({ startsOn: '2027-03-05', endsOn: '2027-03-14' }, trip)).toBe(false);
    expect(covers(trip, trip)).toBe(true);
  });

  it('finds the window everyone shares', () => {
    expect(
      intersect([
        { startsOn: '2027-03-02', endsOn: '2027-03-14' },
        { startsOn: '2027-03-09', endsOn: '2027-03-20' },
        { startsOn: '2027-03-01', endsOn: '2027-03-16' },
      ])
    ).toEqual({ startsOn: '2027-03-09', endsOn: '2027-03-14' });
  });

  it('returns null when there is no window in common', () => {
    expect(
      intersect([
        { startsOn: '2027-03-01', endsOn: '2027-03-05' },
        { startsOn: '2027-03-06', endsOn: '2027-03-10' },
      ])
    ).toBeNull();
  });

  it('returns null for nobody', () => {
    expect(intersect([])).toBeNull();
  });
});

describe('monthGrid', () => {
  it('always returns six weeks, so the picker does not resize', () => {
    expect(monthGrid('2027-03-04')).toHaveLength(42);
    expect(monthGrid('2027-02-10')).toHaveLength(42);
  });

  it('pads the days before the first', () => {
    // 1 March 2027 is a Monday, so one blank sits before it.
    const cells = monthGrid('2027-03-04');
    expect(cells[0].iso).toBeNull();
    expect(cells[1].iso).toBe('2027-03-01');
  });

  it('runs to the end of the month and stops', () => {
    const days = monthGrid('2027-02-10').filter((cell) => cell.iso !== null);
    expect(days).toHaveLength(28);
    expect(days[27].iso).toBe('2027-02-28');
  });
});
