import { addWeeks, formatDate, getWeekEnd, getWeekStart, isFutureDate, parseDate } from '../../utils/dates';
import { Button } from '../common/Button';
import { DateField } from '../form/DateField';

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
    const shiftedFrom = addWeeks(getWeekStart(fromDate), direction);
    const shiftedTo = addWeeks(getWeekEnd(fromDate), direction);
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
        <DateField
          id="range-from"
          ariaLabel="From date"
          type="date"
          value={formatDate(fromDate)}
          max={formatDate(toDate)}
          onChange={(event) => onRangeChange(parseDate(event.target.value), toDate)}
          label='From date'
          labelVariant="small"
          className="w-auto"
        />
      </div>
      <div>
        <DateField
          id="range-to"
          ariaLabel="To date"
          type="date"
          value={formatDate(toDate)}
          min={formatDate(fromDate)}
          onChange={(event) => onRangeChange(fromDate, parseDate(event.target.value))}
          label='To date'
          labelVariant="small"
          className="w-auto"
        />
      </div>
    </div>
  );
}
