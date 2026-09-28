import { describe, it, expect } from 'vitest';
import { getWeekStart, getWeekEnd, formatDate, formatShortDateLabel, formatLongDateLabel, isFutureDate, addDays, addWeeks, addMonths, getDaysInMonth, getFirstDayOfMonth, areSameDay } from '../dates';

describe('addDays', () => {
  it('adds days to a date', () => {
    const date = new Date(2026, 7, 11); // Aug 11 2026
    expect(formatDate(addDays(date, 5))).toBe('2026-08-16');
    expect(formatDate(addDays(date, -3))).toBe('2026-08-08');
  });
});

describe('addWeeks', () => {
  it('adds weeks to a date', () => {
    const date = new Date(2026, 7, 11); // Aug 11 2026
    expect(formatDate(addWeeks(date, 2))).toBe('2026-08-25');
    expect(formatDate(addWeeks(date, -1))).toBe('2026-08-04');
  });
});

describe('getWeekStart / getWeekEnd', () => {
  it('treats Monday as the start of the week', () => {
    const wednesday = new Date(2026, 7, 12); // Aug 12 2026 is a Wednesday
    expect(formatDate(getWeekStart(wednesday))).toBe('2026-08-10');
    expect(formatDate(getWeekEnd(wednesday))).toBe('2026-08-16');
  });

  it('returns the same Monday when given a Monday', () => {
    const monday = new Date(2026, 7, 10);
    expect(formatDate(getWeekStart(monday))).toBe('2026-08-10');
  });

  it('returns the same Sunday when given a Sunday', () => {
    const sunday = new Date(2026, 7, 16);
    expect(formatDate(getWeekEnd(sunday))).toBe('2026-08-16');
    expect(formatDate(getWeekStart(sunday))).toBe('2026-08-10');
  });
});

describe('isFutureDate', () => {
  const today = new Date(2026, 7, 11); // Aug 11 2026

  it('is true for tomorrow', () => {
    expect(isFutureDate(addDays(today, 1), today)).toBe(true);
  });

  it('is false for today', () => {
    expect(isFutureDate(today, today)).toBe(false);
  });

  it('is false for a past date', () => {
    expect(isFutureDate(addDays(today, -1), today)).toBe(false);
  });
});

describe('formatShortDateLabel', () => {
  it('formats a "YYYY-MM-DD" date as month and day', () => {
    expect(formatShortDateLabel(new Date(2026, 7, 11))).toBe('August 11');
  });

  it('formats single-digit days without a leading zero', () => {
    expect(formatShortDateLabel(new Date(2026, 7, 5))).toBe('August 5');
  });
});

describe('formatLongDateLabel', () => {
  it('formats a "YYYY-MM-DD" date as weekday, month and day', () => {
    expect(formatLongDateLabel(new Date(2026, 7, 11))).toBe('Tuesday, August 11, 2026');
  });

  it('formats single-digit days without a leading zero', () => {
    expect(formatLongDateLabel(new Date(2026, 7, 5))).toBe('Wednesday, August 5, 2026');
  });
});

describe('addMonths', () => {
  it('adds months to a date', () => {
    const date = new Date(2026, 7, 11); // Aug 11 2026
    expect(formatDate(addMonths(date, 1))).toBe('2026-09-11');
    expect(formatDate(addMonths(date, -1))).toBe('2026-07-11');
  });

  it('handles month overflow to next year', () => {
    const date = new Date(2026, 11, 15); // Dec 15 2026
    expect(formatDate(addMonths(date, 1))).toBe('2027-01-15');
  });

  it('handles month underflow to previous year', () => {
    const date = new Date(2026, 0, 15); // Jan 15 2026
    expect(formatDate(addMonths(date, -1))).toBe('2025-12-15');
  });
});

describe('getDaysInMonth', () => {
  it('returns correct days for August (31 days)', () => {
    const date = new Date(2026, 7); // August 2026
    expect(getDaysInMonth(date)).toBe(31);
  });

  it('returns correct days for February in non-leap year (28 days)', () => {
    const date = new Date(2026, 1); // February 2026
    expect(getDaysInMonth(date)).toBe(28);
  });

  it('returns correct days for February in leap year (29 days)', () => {
    const date = new Date(2024, 1); // February 2024
    expect(getDaysInMonth(date)).toBe(29);
  });

  it('returns correct days for April (30 days)', () => {
    const date = new Date(2026, 3); // April 2026
    expect(getDaysInMonth(date)).toBe(30);
  });
});

describe('getFirstDayOfMonth', () => {
  it('returns 1 (Tuesday) when first of month is a Tuesday', () => {
    const date = new Date(2026, 8); // September 2026 starts on Tuesday
    expect(getFirstDayOfMonth(date)).toBe(1);
  });

  it('returns 5 (Saturday) when first of month is a Saturday', () => {
    const date = new Date(2026, 7); // August 2026 starts on Saturday
    expect(getFirstDayOfMonth(date)).toBe(5);
  });

  it('uses Monday=0 Sunday=6 convention', () => {
    const date = new Date(2026, 0); // January 2026 starts on Thursday
    // Jan 1 2026 is a Thursday, so (4 + 6) % 7 = 3
    expect(getFirstDayOfMonth(date)).toBe(3);
  });
});

describe('areSameDay', () => {
  it('returns true for the same day', () => {
    const date1 = new Date(2026, 7, 11);
    const date2 = new Date(2026, 7, 11);
    expect(areSameDay(date1, date2)).toBe(true);
  });

  it('returns false for different days', () => {
    const date1 = new Date(2026, 7, 11);
    const date2 = new Date(2026, 7, 12);
    expect(areSameDay(date1, date2)).toBe(false);
  });

  it('returns true for the same day but different times', () => {
    const date1 = new Date(2026, 7, 11, 10, 30);
    const date2 = new Date(2026, 7, 11, 15, 45);
    expect(areSameDay(date1, date2)).toBe(true);
  });
});