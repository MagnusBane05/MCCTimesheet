import { addDays, formatDate, parseDate } from '../../utils/dates';
import { Button } from '../common/Button';

/** Shared date-range control for the admin reporting pages (By Employee, By Job). */
export function WeekRangeNav({
  fromDate,
  toDate,
  onRangeChange,
}: {
  fromDate: string;
  toDate: string;
  onRangeChange(fromDate: string, toDate: string): void;
}) {
  function shiftWeek(direction: 1 | -1) {
    const shiftedFrom = formatDate(addDays(parseDate(fromDate), 7 * direction));
    const shiftedTo = formatDate(addDays(parseDate(toDate), 7 * direction));
    onRangeChange(shiftedFrom, shiftedTo);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1">
        <Button variant="ghost" onClick={() => shiftWeek(-1)} className="!px-3">
          ‹ Previous week
        </Button>
        <Button variant="ghost" onClick={() => shiftWeek(1)} className="!px-3">
          Next week ›
        </Button>
      </div>
      <div>
        <label htmlFor="range-from" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
          From date
        </label>
        <input
          id="range-from"
          type="date"
          value={fromDate}
          max={toDate}
          onChange={(event) => onRangeChange(event.target.value, toDate)}
          className="mt-1 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>
      <div>
        <label htmlFor="range-to" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
          To date
        </label>
        <input
          id="range-to"
          type="date"
          value={toDate}
          min={fromDate}
          onChange={(event) => onRangeChange(fromDate, event.target.value)}
          className="mt-1 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>
    </div>
  );
}
