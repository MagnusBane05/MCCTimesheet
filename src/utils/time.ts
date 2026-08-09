/** Time-of-day utilities. Times are always "HH:mm" 24-hour strings. */

export const MINUTE_INCREMENT = 15;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Duration in hours between two "HH:mm" times, same day only (no overnight support). */
export function getDurationHours(startTime: string, endTime: string): number {
  const minutes = toMinutes(endTime) - toMinutes(startTime);
  return minutes / 60;
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(2)} hrs`;
}

export function isValidTimeIncrement(time: string): boolean {
  const [, minutes] = time.split(':').map(Number);
  return minutes % MINUTE_INCREMENT === 0;
}

/** All valid "HH:mm" options in 15-minute increments, for use in <select> controls. */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += MINUTE_INCREMENT) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return options;
}

export function formatTimeLabel(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}
