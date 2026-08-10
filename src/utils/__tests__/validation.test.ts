import { describe, it, expect } from 'vitest';
import { doEntriesOverlap, canEmployeeModifyDate, validateTimeEntry, canEmployeeViewDate } from '../validation';
import type { TimeEntry } from '../../domain/timeEntry';

function entry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 1,
    employeeId: 1,
    projectId: 1,
    workDate: '2026-08-10',
    startTime: '08:00',
    endTime: '10:00',
    workDescription: 'work',
    invoiceNumber: null,
    createdAt: '2026-08-10T08:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
    ...overrides,
  };
}

describe('doEntriesOverlap', () => {
  it('is false for entries on different dates', () => {
    expect(doEntriesOverlap({ workDate: '2026-08-10', startTime: '08:00', endTime: '10:00' }, { workDate: '2026-08-11', startTime: '08:00', endTime: '10:00' })).toBe(false);
  });

  it('is false for adjacent entries', () => {
    expect(doEntriesOverlap({ workDate: '2026-08-10', startTime: '08:00', endTime: '10:00' }, { workDate: '2026-08-10', startTime: '10:00', endTime: '12:00' })).toBe(false);
  });

  it('is true when intervals overlap', () => {
    expect(doEntriesOverlap({ workDate: '2026-08-10', startTime: '09:00', endTime: '11:00' }, { workDate: '2026-08-10', startTime: '08:00', endTime: '10:00' })).toBe(true);
  });

  it('is true when one interval contains the other', () => {
    expect(doEntriesOverlap({ workDate: '2026-08-10', startTime: '08:00', endTime: '17:00' }, { workDate: '2026-08-10', startTime: '09:00', endTime: '10:00' })).toBe(true);
  });
});

describe('canEmployeeModifyDate', () => {
  const today = new Date(2026, 7, 11); // Tuesday Aug 11 2026

  it('allows any day in the previous Mon-Sun week', () => {
    expect(canEmployeeModifyDate('2026-08-03', today)).toBe(true); // previous Monday
    expect(canEmployeeModifyDate('2026-08-09', today)).toBe(true); // previous Sunday
  });

  it('allows the current week through today', () => {
    expect(canEmployeeModifyDate('2026-08-10', today)).toBe(true); // this Monday
    expect(canEmployeeModifyDate('2026-08-11', today)).toBe(true); // today
  });

  it('disallows before the previous week', () => {
    expect(canEmployeeModifyDate('2026-08-02', today)).toBe(false);
  });

  it('disallows future dates, including later this week', () => {
    expect(canEmployeeModifyDate('2026-08-12', today)).toBe(false);
    expect(canEmployeeModifyDate('2026-08-16', today)).toBe(false);
  });
});

describe('canEmployeeViewDate', () => {
  const today = new Date(2026, 7, 11); // Tuesday Aug 11 2026

  it('allows any day in the past', () => {
    expect(canEmployeeViewDate(new Date(2026, 7, 10), today)).toBe(true);
  });
  it('disallows future dates', () => {
    expect(canEmployeeViewDate(new Date(2026, 7, 12), today)).toBe(false);
  });
  it('allows today', () => {
    expect(canEmployeeViewDate(new Date(2026, 7, 11), today)).toBe(true);
  });
});

describe('validateTimeEntry', () => {
  const today = new Date(2026, 7, 11);
  const baseInput = {
    workDate: '2026-08-11',
    startTime: '08:00',
    endTime: '10:00',
    projectId: 1,
    workDescription: 'Cutting panels',
  };

  it('passes for a valid entry with no conflicts', () => {
    const errors = validateTimeEntry(baseInput, { today, otherEntries: [], enforceEditWindow: true });
    expect(errors).toEqual({});
  });

  it('requires project and description', () => {
    const errors = validateTimeEntry({ ...baseInput, projectId: null, workDescription: '  ' }, {
      today,
      otherEntries: [],
      enforceEditWindow: true,
    });
    expect(errors.projectId).toBeTruthy();
    expect(errors.workDescription).toBeTruthy();
  });

  it('rejects future dates', () => {
    const errors = validateTimeEntry({ ...baseInput, workDate: '2026-08-20' }, {
      today,
      otherEntries: [],
      enforceEditWindow: true,
    });
    expect(errors.workDate).toBeTruthy();
  });

  it('rejects dates outside the employee edit window, but allows admins', () => {
    const outOfWindow = { ...baseInput, workDate: '2026-07-01' };
    const employeeErrors = validateTimeEntry(outOfWindow, { today, otherEntries: [], enforceEditWindow: true });
    expect(employeeErrors.workDate).toBeTruthy();

    const adminErrors = validateTimeEntry(outOfWindow, { today, otherEntries: [], enforceEditWindow: false });
    expect(adminErrors.workDate).toBeUndefined();
  });

  it('rejects end time at or before start time', () => {
    const errors = validateTimeEntry({ ...baseInput, endTime: '08:00' }, { today, otherEntries: [], enforceEditWindow: true });
    expect(errors.endTime).toBeTruthy();
  });

  it('rejects overlapping entries and excludes the entry being edited', () => {
    const existing = entry({ id: 42, workDate: '2026-08-11', startTime: '09:00', endTime: '11:00' });
    const overlapping = validateTimeEntry(baseInput, { today, otherEntries: [existing], enforceEditWindow: true });
    expect(overlapping.startTime).toBeTruthy();

    const editingSelf = validateTimeEntry(baseInput, {
      today,
      otherEntries: [existing],
      enforceEditWindow: true,
      excludeEntryId: 42,
    });
    expect(editingSelf.startTime).toBeUndefined();
  });
});
