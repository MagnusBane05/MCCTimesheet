import { addWeeks, formatDate, isFutureDate, parseDate } from '../../utils/dates';
import { Button } from '../common/Button';

/** Shared date-range control for the admin reporting pages (By Employee, By Job). */
export function WeekRangeNav({
  fromDate,
  toDate,
  onRangeChange,
}: {
  fromDate: Date;
  toDate: Date;
  onRangeChange(fromDate: Date, toDate: Date): void;
}) {
  function shiftWeek(direction: 1 | -1) {
    const shiftedFrom = addWeeks(fromDate, direction);
    const shiftedTo = addWeeks(toDate, direction);
    onRangeChange(shiftedFrom, shiftedTo);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl">
      <Button variant="secondary" onClick={() => shiftWeek(-1)} className="!px-3">
        ‹ Previous week
      </Button>
      <Button 
        variant="secondary"
        disabled={isFutureDate(addWeeks(fromDate, 1), new Date())}
        onClick={() => shiftWeek(1)} 
        className="!px-3">
          Next week ›
      </Button>
      <div>
        <label htmlFor="range-from" className="block text-xs font-medium uppercase tracking-wide text-navy-900/60">
          From date
        </label>
        <input
          id="range-from"
          type="date"
          value={formatDate(fromDate)}
          max={formatDate(toDate)}
          onChange={(event) => onRangeChange(parseDate(event.target.value), toDate)}
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
          value={formatDate(toDate)}
          min={formatDate(fromDate)}
          onChange={(event) => onRangeChange(fromDate, parseDate(event.target.value))}
          className="mt-1 rounded-lg border border-navy-900/20 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>
    </div>
  );
}
