import { describe, it, expect } from 'vitest';
import { getWeekStart, getWeekEnd, formatDate, isFutureDate, addDays } from '../dates';

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
