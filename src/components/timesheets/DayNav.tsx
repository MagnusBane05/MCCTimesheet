import { useRef } from 'react';
import { formatDate, formatLongDateLabel } from '../../utils/dates';
import { canEmployeeViewDate } from '../../utils/validation';
import { Button } from '../common/Button';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DayNav({
  date,
  today,
  onPrevious,
  onNext,
  onDateChange,
}: {
  date: Date;
  today: Date;
  onPrevious(): void;
  onNext(): void;
  onDateChange(newDate: string): void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 shadow-sm">
      <Button
        variant="ghost"
        aria-label="Previous day"
        onClick={onPrevious}
        className="!px-3 !py-3 text-lg"
      >
        ‹
      </Button>
      <div className="relative flex flex-1 items-center justify-center gap-1.5">
        <span className="text-base font-semibold text-navy-950">{formatLongDateLabel(date)}</span>
        <button
          type="button"
          aria-label="Choose date"
          onClick={openDatePicker}
          className="rounded-lg p-1.5 text-navy-900/70 hover:bg-cream-100 hover:text-navy-950"
        >
          <CalendarIcon />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          aria-hidden="true"
          tabIndex={-1}
          value={formatDate(date)}
          max={formatDate(today)}
          onChange={(event) => onDateChange(event.target.value)}
          className="sr-only"
        />
      </div>
      <Button
        variant="ghost"
        aria-label="Next day"
        onClick={onNext}
        disabled={canEmployeeViewDate(date, today) === false}
        className="!px-3 !py-3 text-lg">
      ›
      </Button>
    </div>
  );
}
