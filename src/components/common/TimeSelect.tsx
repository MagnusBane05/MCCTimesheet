import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatTimeLabel, generateHourOptions, generateMinuteOptions, getHours, getMinutes } from '../../utils/time';

const BUTTON_VARIANTS = {
  default: '',
  inline:
    'rounded border border-navy-900/20 bg-white px-2 py-1.5 ' +
    'hover:border-navy-900/30 ' +
    'focus:outline-none focus:ring-1 focus:ring-accent-500',
};

const OPTION_VARIANTS = {
  default: {
    selected: 'bg-accent-500 font-semibold text-white',
    unselected: 'text-navy-900 hover:bg-cream-100',
  },
  inline: {
    selected: 'bg-accent-500 font-semibold text-white',
    unselected: 'text-navy-900 hover:bg-cream-100',
  },
};

export interface TimeSelectProps {
  id?: string;
  /** Accessible label for this control, e.g. "Start time" — used to label the hour and minute columns individually. */
  label: string;
  /** Selected time as an "HH:mm" 24-hour string, or '' when unset. */
  value: string;
  timeVariant?: '12' | '24';
  today: Date;
  onChange(time: string): void;
  /** Increment between minute options. Defaults to 1 (every minute). */
  minuteStep?: number;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'inline';
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
export function TimeSelect({ id, label, value, timeVariant = '12', today, onChange, minuteStep = 1, className, disabled, variant = 'default' }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({top: 0, left: 0, width: 0,});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const hourItemRef = useRef<HTMLButtonElement>(null);
  const minuteItemRef = useRef<HTMLButtonElement>(null);

  const [hour, minute] = value ? value.split(':') : ['', ''];
  const hourOptions = useMemo(() => generateHourOptions(), []);
  const minuteOptions = useMemo(() => generateMinuteOptions(minuteStep), [minuteStep]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      const insideTrigger = containerRef.current?.contains(target);
      const insidePicker = pickerRef.current?.contains(target);

      if (!insideTrigger && !insidePicker) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
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

    function handlePositionChange() {
      updatePickerPosition();
    }

    window.addEventListener('resize', handlePositionChange);
    return () => {
      window.removeEventListener('resize', handlePositionChange);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePickerPosition();
    hourItemRef.current?.scrollIntoView({ block: 'center' });
    minuteItemRef.current?.scrollIntoView({ block: 'center' });
  }, [open]);

  const currHour = getHours(today);
  const currMin = getMinutes(today, minuteStep);

  function selectHour(newHour: string) {
    onChange(`${newHour}:${minute || currMin}`);
  }

  function selectMinute(newMinute: string) {
    onChange(`${hour || currHour}:${newMinute}`);
  }

  function updatePickerPosition() {
    if (!buttonRef.current || !containerRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setPickerPosition({
      top: buttonRect.bottom + window.scrollY  + 4,
      left: buttonRect.left + window.scrollX,
      width: variant === 'inline' ? 160 : containerRect.width,
    });
  }

  return (
    <div ref={containerRef} className={variant === 'inline' ? 'relative inline-block' : 'relative'}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`
          flex items-center justify-between gap-2 text-left
          ${BUTTON_VARIANTS[variant]}
          ${className ?? ''}
        `}
      >
        <span>{value ? formatTimeLabel(value, timeVariant) : '--:--'}</span>
        <ClockIcon />
      </button>

      {open && 
        createPortal(
          <div
            ref={pickerRef}
            role="listbox"
            aria-label={label}
            style={{
              position: 'absolute',
              top: pickerPosition.top,
              left: pickerPosition.left,
              width: pickerPosition.width,
            }}
            className="
              z-50 grid grid-cols-2 divide-x divide-navy-900/10 rounded-lg border border-navy-900/20 bg-white shadow-lg"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {hourOptions.map((option) => {
                const selected = option === hour || (hour === '' && option === currHour);
                return (
                  <button
                    key={option}
                    ref={selected ? hourItemRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectHour(option)}
                    className={`w-full px-3 py-1.5 text-center text-sm ${
                      selected
                        ? OPTION_VARIANTS[variant].selected
                        : OPTION_VARIANTS[variant].unselected
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {minuteOptions.map((option) => {
                const selected = option === minute || (minute === '' && option === currMin);
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
          </div>,
          document.body
      )}
    </div>
  );
}
