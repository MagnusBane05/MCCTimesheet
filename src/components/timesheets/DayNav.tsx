import { useRef } from 'react';
import { formatDate, formatLongDateLabel, addDays } from '../../utils/dates';
import { canEmployeeViewDate } from '../../utils/validation';
import { Button } from '../common/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { CalendarIcon } from "@heroicons/react/24/outline";

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
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <div className="relative flex flex-1 items-center justify-center gap-1.5">
        <h2 className="text-base font-semibold text-midnight-950">{formatLongDateLabel(date)}</h2>
        <Button
          type="button"
          aria-label="Choose date"
          onClick={openDatePicker}
          variant="ghost"
          className="!px-2 !py-2"
        >
          <CalendarIcon className="h-5 w-5 text-midnight-950" />
        </Button>
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
        disabled={canEmployeeViewDate(addDays(date, 1), today) === false}
        className="!px-3 !py-3 text-lg">
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
