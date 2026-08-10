import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeLabel, generateHourOptions, generateMinuteOptions } from '../../utils/time';

export interface TimeSelectProps {
  id?: string;
  /** Accessible label for this control, e.g. "Start time" — used to label the hour and minute columns individually. */
  label: string;
  /** Current time as an "HH:mm" 24-hour string, or '' when unset. */
  value: string;
  onChange(time: string): void;
  /** Increment between minute options. Defaults to 1 (every minute). */
  minuteStep?: number;
  className?: string;
  disabled?: boolean;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A single time field that opens a two-column (hour, minute) picker, combining the selection into one "HH:mm" value. */
export function TimeSelect({ id, label, value, onChange, minuteStep = 1, className, disabled }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourItemRef = useRef<HTMLButtonElement>(null);
  const minuteItemRef = useRef<HTMLButtonElement>(null);

  const [hour, minute] = value ? value.split(':') : ['', ''];
  const hourOptions = useMemo(() => generateHourOptions(), []);
  const minuteOptions = useMemo(() => generateMinuteOptions(minuteStep), [minuteStep]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    hourItemRef.current?.scrollIntoView({ block: 'center' });
    minuteItemRef.current?.scrollIntoView({ block: 'center' });
  }, [open]);

  function selectHour(newHour: string) {
    onChange(`${newHour}:${minute || '00'}`);
  }

  function selectMinute(newMinute: string) {
    onChange(`${hour || '00'}:${newMinute}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex items-center justify-between gap-2 text-left ${className ?? ''}`}
      >
        <span>{value ? formatTimeLabel(value) : '--:--'}</span>
        <ClockIcon />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1 grid w-full grid-cols-2 divide-x divide-navy-900/10 rounded-lg border border-navy-900/20 bg-white shadow-lg"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {hourOptions.map((option) => {
              const selected = option === hour;
              return (
                <button
                  key={option}
                  ref={selected ? hourItemRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectHour(option)}
                  className={`w-full px-3 py-1.5 text-center text-sm ${
                    selected ? 'bg-accent-500 font-semibold text-white' : 'text-navy-900 hover:bg-cream-100'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {minuteOptions.map((option) => {
              const selected = option === minute;
              return (
                <button
                  key={option}
                  ref={selected ? minuteItemRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectMinute(option)}
                  className={`w-full px-3 py-1.5 text-center text-sm ${
                    selected ? 'bg-accent-500 font-semibold text-white' : 'text-navy-900 hover:bg-cream-100'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
