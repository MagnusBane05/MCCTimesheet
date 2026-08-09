import type { TimeEntry } from '../domain/timeEntry';
import { getWeekStart, addDays, formatDate, daysBetween } from '../utils/dates';

/**
 * Seed data is generated relative to `new Date()` (not hardcoded dates) so
 * the employee-editing-window and overtime examples stay valid no matter
 * when the prototype is actually run.
 */
const today = new Date();
const currentWeekStart = getWeekStart(today);
const previousWeekStart = addDays(currentWeekStart, -7);
const twoWeeksAgoStart = addDays(currentWeekStart, -14);
const maxCurrentWeekOffset = daysBetween(currentWeekStart, today);

type WeekName = 'twoWeeksAgo' | 'previous' | 'current';

const weekStarts: Record<WeekName, Date> = {
  twoWeeksAgo: twoWeeksAgoStart,
  previous: previousWeekStart,
  current: currentWeekStart,
};

interface EntryPlan {
  employeeId: number;
  week: WeekName;
  dayOffset: number; // 0 = Monday ... 6 = Sunday
  startTime: string;
  endTime: string;
  projectId: number;
  workDescription: string;
  invoiceNumber?: string | null;
}

let nextId = 1;

function buildEntry(plan: EntryPlan): TimeEntry {
  const date = addDays(weekStarts[plan.week], plan.dayOffset);
  const workDate = formatDate(date);
  const timestamp = new Date(`${workDate}T${plan.startTime}:00`).toISOString();
  return {
    id: nextId++,
    employeeId: plan.employeeId,
    projectId: plan.projectId,
    workDate,
    startTime: plan.startTime,
    endTime: plan.endTime,
    workDescription: plan.workDescription,
    invoiceNumber: plan.invoiceNumber ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const plans: EntryPlan[] = [
  // --- Employee 1 (Jamie Rivera): typical ~40hr week, split by lunch, mixed invoicing ---
  ...[0, 1, 2, 3, 4].flatMap((dayOffset) => [
    { employeeId: 1, week: 'previous' as const, dayOffset, startTime: '08:00', endTime: '12:00', projectId: 1, workDescription: 'Framing ICU wing cabinet boxes', invoiceNumber: 'INV-1042' },
    { employeeId: 1, week: 'previous' as const, dayOffset, startTime: '12:30', endTime: '16:30', projectId: 2, workDescription: 'Installing lobby reception desk trim' },
  ]),
  { employeeId: 1, week: 'current', dayOffset: 0, startTime: '08:00', endTime: '12:00', projectId: 3, workDescription: 'Prepping library casework panels' },
  { employeeId: 1, week: 'current', dayOffset: 1, startTime: '08:00', endTime: '11:30', projectId: 3, workDescription: 'Prepping library casework panels' },

  // --- Employee 2 (Sam Okafor): over the 44hr weekly overtime threshold ---
  ...[0, 1, 2, 3, 4].map((dayOffset) => ({
    employeeId: 2,
    week: 'previous' as const,
    dayOffset,
    startTime: '07:00',
    endTime: '17:00',
    projectId: 6,
    workDescription: 'Boardroom table glue-up and clamping',
    invoiceNumber: dayOffset < 3 ? 'INV-1055' : null,
  })),
  { employeeId: 2, week: 'current', dayOffset: 0, startTime: '07:00', endTime: '15:30', projectId: 6, workDescription: 'Boardroom table sanding' },
  { employeeId: 2, week: 'twoWeeksAgo', dayOffset: 2, startTime: '08:00', endTime: '16:00', projectId: 6, workDescription: 'Boardroom table layout', invoiceNumber: 'INV-0991' },

  // --- Employee 3 (Casey Nguyen): multiple entries/day, adjacent non-overlapping entries ---
  { employeeId: 3, week: 'previous', dayOffset: 1, startTime: '08:00', endTime: '10:00', projectId: 7, workDescription: 'Sanding guest room vanity tops' },
  { employeeId: 3, week: 'previous', dayOffset: 1, startTime: '10:00', endTime: '12:00', projectId: 9, workDescription: 'Loading delivery truck for teller line casework' },
  { employeeId: 3, week: 'previous', dayOffset: 1, startTime: '13:00', endTime: '16:30', projectId: 7, workDescription: 'Sanding guest room vanity tops (cont.)', invoiceNumber: 'INV-1061' },
  { employeeId: 3, week: 'previous', dayOffset: 3, startTime: '08:00', endTime: '16:00', projectId: 9, workDescription: 'Installing teller line casework' },
  { employeeId: 3, week: 'current', dayOffset: 0, startTime: '08:00', endTime: '13:00', projectId: 12, workDescription: 'Assembling open office workstations' },

  // --- Employee 4 (Morgan Ellis): weekend entry, all seven days supported ---
  { employeeId: 4, week: 'previous', dayOffset: 0, startTime: '08:00', endTime: '16:00', projectId: 13, workDescription: 'Cafeteria servery counter fabrication' },
  { employeeId: 4, week: 'previous', dayOffset: 6, startTime: '09:00', endTime: '13:00', projectId: 10, workDescription: 'Emergency delivery prep for dining hall built-ins' },
  { employeeId: 4, week: 'current', dayOffset: 0, startTime: '08:00', endTime: '15:00', projectId: 13, workDescription: 'Cafeteria servery counter fabrication' },

  // --- Employee 5 (Taylor Brooks): entries right at the editing-window boundary ---
  // Last day of the (closed) week before last — should render read-only.
  { employeeId: 5, week: 'twoWeeksAgo', dayOffset: 6, startTime: '08:00', endTime: '12:00', projectId: 5, workDescription: 'Executive suite paneling delivery', invoiceNumber: 'INV-0972' },
  // First day of last week — the earliest date still inside the employee edit window.
  { employeeId: 5, week: 'previous', dayOffset: 0, startTime: '08:00', endTime: '12:00', projectId: 5, workDescription: 'Executive suite paneling install' },
  { employeeId: 5, week: 'current', dayOffset: 0, startTime: '08:00', endTime: '11:00', projectId: 14, workDescription: 'Tasting room bar touch-ups' },

  // --- Employee 6 (Riley Chen, inactive): historical-only, references an inactive project ---
  { employeeId: 6, week: 'twoWeeksAgo', dayOffset: 2, startTime: '08:00', endTime: '15:00', projectId: 8, workDescription: 'Finishing rooftop bar millwork installation', invoiceNumber: 'INV-0980' },
  { employeeId: 6, week: 'twoWeeksAgo', dayOffset: 3, startTime: '08:00', endTime: '14:00', projectId: 11, workDescription: 'Activity room cabinet touch-ups' },
];

export const mockTimeEntries: TimeEntry[] = plans
  .filter((plan) => plan.week !== 'current' || plan.dayOffset <= maxCurrentWeekOffset)
  .map(buildEntry);
