import { canEmployeeViewDate } from '../../utils/validation';
import { Button } from '../common/Button';

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const TODAY = new Date();

export function DayNav({
  date,
  onPrevious,
  onNext,
  onToday,
}: {
  date: Date;
  onPrevious(): void;
  onNext(): void;
  onToday(): void;
}) {
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
      <button
        type="button"
        onClick={onToday}
        className="flex-1 rounded-lg py-2 text-center text-base font-semibold text-navy-950 hover:bg-cream-100"
      >
        {WEEKDAY_FORMAT.format(date)}
      </button>
      <Button 
        variant="ghost" 
        aria-label="Next day" 
        onClick={onNext} 
        disabled={canEmployeeViewDate(date, TODAY) === false}
        className="!px-3 !py-3 text-lg">
      ›
      </Button>
    </div>
  );
}
