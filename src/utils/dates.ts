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

/** Monday 00:00 of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const start = startOfDay(date);
  // getDay(): 0 = Sunday ... 6 = Saturday. Convert so Monday = 0.
  const dayIndex = (start.getDay() + 6) % 7;
  return addDays(start, -dayIndex);
}

/** Sunday 23:59:59.999 of the week containing `date`. */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isFutureDate(dateStr: string, today: Date): boolean {
  return parseDate(dateStr).getTime() > startOfDay(today).getTime();
}

export function isSameOrBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() <= startOfDay(b).getTime();
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}
