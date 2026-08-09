import { describe, it, expect } from 'vitest';
import { calculateWeeklyHours, calculateRegularAndOvertime, WEEKLY_OVERTIME_THRESHOLD } from '../overtime';
import type { TimeEntry } from '../../domain/timeEntry';

function entry(overrides: Partial<TimeEntry>): TimeEntry {
  return {
    id: 1,
    employeeId: 1,
    projectId: 1,
    workDate: '2026-08-10',
    startTime: '08:00',
    endTime: '16:00',
    workDescription: 'work',
    invoiceNumber: null,
    createdAt: '2026-08-10T08:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
    ...overrides,
  };
}

describe('calculateWeeklyHours', () => {
  it('sums durations across entries', () => {
    const entries = [
      entry({ startTime: '08:00', endTime: '12:00' }),
      entry({ startTime: '13:00', endTime: '16:30' }),
    ];
    expect(calculateWeeklyHours(entries)).toBe(7.5);
  });

  it('returns 0 for no entries', () => {
    expect(calculateWeeklyHours([])).toBe(0);
  });
});

describe('calculateRegularAndOvertime', () => {
  it('has no overtime at or below the threshold', () => {
    expect(calculateRegularAndOvertime(WEEKLY_OVERTIME_THRESHOLD)).toEqual({
      regularHours: WEEKLY_OVERTIME_THRESHOLD,
      overtimeHours: 0,
    });
    expect(calculateRegularAndOvertime(30)).toEqual({ regularHours: 30, overtimeHours: 0 });
  });

  it('splits hours above the threshold into regular + overtime', () => {
    expect(calculateRegularAndOvertime(48)).toEqual({
      regularHours: WEEKLY_OVERTIME_THRESHOLD,
      overtimeHours: 4,
    });
  });
});
