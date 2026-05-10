export enum CalendarMode {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

export enum PickerTarget {
  Start = 'start',
  End = 'end',
}

export enum PickerMode {
  Date = 'date',
  Time = 'time',
}

export const DateFormat = {
  MonthYear: 'MMMM YYYY',
  MonthShort: 'MMM',
  MonthShortYear: 'MMM YYYY',
  Date: 'MMM D, YYYY',
  DateLong: 'MMMM D, YYYY',
  Time: 'h:mm A',
  DateTime: 'MMM D, YYYY h:mm A',
} as const;
