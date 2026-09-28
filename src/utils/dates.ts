/**
 * Date utilities. All "week" calculations use the company's definition of a
 * week: Monday 00:00 through Sunday 23:59. Keep all week math here rather
 * than scattering it across components.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', { day: 'numeric', month: 'long' });

/** Formats a "YYYY-MM-DD" work date for display, e.g. "August 11" — used to label a time entry by day. */
export function formatShortDateLabel(date: Date): string {
  return SHORT_DATE_FORMAT.format(date);
}

const DATE_LABEL_FORMAT = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const DATE_LABEL_FORMAT_WITHOUT_YEAR = new Intl.DateTimeFormat('en-CA', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}); 

export function formatLongDateLabel(date: Date, includeYear: boolean = true): string {
  return includeYear ? DATE_LABEL_FORMAT.format(date) : DATE_LABEL_FORMAT_WITHOUT_YEAR.format(date);
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** JavaScript's getDay() returns 0 for Sunday ... 6 for Saturday. This function converts it to Monday = 0 ... Sunday = 6. */
function jsFirstDayToCompanyFirstDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/** First day of the month containing `date`, where Monday = 0 and Sunday = 6. */
export function getFirstDayOfMonth(date: Date): number {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  return jsFirstDayToCompanyFirstDay(first.getDay());
}

/** Monday 00:00 of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const start = startOfDay(date);
  const dayIndex = jsFirstDayToCompanyFirstDay(start.getDay());
  return addDays(start, -dayIndex);
}

/** Sunday 23:59:59.999 of the week containing `date`. */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isFutureDate(dateStr: Date, today: Date): boolean {
  return dateStr.getTime() > startOfDay(today).getTime();
}

export function isSameOrBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() <= startOfDay(b).getTime();
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function areSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}