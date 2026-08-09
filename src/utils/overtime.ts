import type { TimeEntry } from '../domain/timeEntry';
import { getDurationHours } from './time';

/**
 * Weekly hours above this threshold are considered overtime. Named constant
 * so the business rule can change without touching call sites.
 */
export const WEEKLY_OVERTIME_THRESHOLD = 44;

/** Sum of durations for a set of entries (caller is responsible for scoping to a week). */
export function calculateWeeklyHours(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => total + getDurationHours(entry.startTime, entry.endTime), 0);
}

export interface RegularAndOvertime {
  regularHours: number;
  overtimeHours: number;
}

/** Overtime is never stored on individual entries — always derived from weekly totals. */
export function calculateRegularAndOvertime(totalHours: number): RegularAndOvertime {
  return {
    regularHours: Math.min(totalHours, WEEKLY_OVERTIME_THRESHOLD),
    overtimeHours: Math.max(totalHours - WEEKLY_OVERTIME_THRESHOLD, 0),
  };
}
