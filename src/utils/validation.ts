import type { TimeEntry } from '../domain/timeEntry';
import { getDurationHours, isValidTimeIncrement } from './time';
import { getWeekStart, getWeekEnd, isFutureDate, startOfDay } from './dates';

export interface OverlapCandidate {
  workDate: string;
  startTime: string;
  endTime: string;
}

/** True when two same-day intervals overlap. Adjacent intervals (end === start) are NOT overlapping. */
export function doEntriesOverlap(entryA: OverlapCandidate, entryB: OverlapCandidate): boolean {
  if (entryA.workDate !== entryB.workDate) return false;
  return entryA.startTime < entryB.endTime && entryA.endTime > entryB.startTime;
}

/**
 * Employee editing window: any day in the previous Monday-Sunday week, any
 * day in the current Monday-Sunday week through today, never a future date.
 * Admins bypass this entirely (see callers) — kept as a single function so
 * the rule is easy to change later if the client's requirement shifts.
 */
export function canEmployeeModifyDate(workDate: string, today: Date): boolean {
  const [year, month, day] = workDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const todayStart = startOfDay(today);

  if (date.getTime() > todayStart.getTime()) return false;

  const previousWeekStart = getWeekStart(new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  return date.getTime() >= previousWeekStart.getTime() && date.getTime() <= getWeekEnd(todayStart).getTime();
}

export interface TimeEntryInput {
  workDate: string;
  startTime: string;
  endTime: string;
  projectId: number | null;
  workDescription: string;
}

export interface ValidateTimeEntryOptions {
  today: Date;
  /** This employee's other entries (any date) — used to check overlap on the same day. */
  otherEntries: TimeEntry[];
  /** When editing, exclude the entry itself from overlap checks. */
  excludeEntryId?: number;
  /** Employees are bound by the edit window; admins are not. */
  enforceEditWindow: boolean;
}

export type TimeEntryValidationErrors = Partial<Record<'workDate' | 'startTime' | 'endTime' | 'projectId' | 'workDescription', string>>;

/** Runs every business rule for a time-entry submission and returns field -> error message. */
export function validateTimeEntry(input: TimeEntryInput, options: ValidateTimeEntryOptions): TimeEntryValidationErrors {
  const errors: TimeEntryValidationErrors = {};

  if (!input.projectId) {
    errors.projectId = 'Project is required.';
  }

  if (!input.workDescription.trim()) {
    errors.workDescription = 'Work description is required.';
  }

  if (!input.workDate) {
    errors.workDate = 'Date is required.';
  } else if (isFutureDate(input.workDate, options.today)) {
    errors.workDate = 'Future dates are not allowed.';
  } else if (options.enforceEditWindow && !canEmployeeModifyDate(input.workDate, options.today)) {
    errors.workDate = 'This date is outside the editing window.';
  }

  if (!input.startTime || !isValidTimeIncrement(input.startTime)) {
    errors.startTime = 'Start time must be in 15-minute increments.';
  }
  if (!input.endTime || !isValidTimeIncrement(input.endTime)) {
    errors.endTime = 'End time must be in 15-minute increments.';
  }

  if (!errors.startTime && !errors.endTime) {
    if (getDurationHours(input.startTime, input.endTime) <= 0) {
      errors.endTime = 'End time must be after start time.';
    } else if (!errors.workDate) {
      const overlaps = options.otherEntries.some(
        (entry) =>
          entry.id !== options.excludeEntryId &&
          doEntriesOverlap(
            { workDate: input.workDate, startTime: input.startTime, endTime: input.endTime },
            entry,
          ),
      );
      if (overlaps) {
        errors.startTime = 'This overlaps with another entry on this date.';
      }
    }
  }

  return errors;
}
