import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { formatShortDateLabel, isFutureDate, addMonths, getDaysInMonth, getFirstDayOfMonth, startOfDay } from "../../utils/dates";
import { Button } from "./Button";

interface DateRangePickerProps {
  fromDate: Date;
  toDate: Date;
  onRangeChange(fromDate: Date, toDate: Date): void;
}

export function DateRangePicker({ fromDate, toDate, onRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(fromDate);
  const [endDate, setEndDate] = useState<Date | null>(toDate);
  const [displayMonth, setDisplayMonth] = useState(new Date(fromDate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    setStartDate(fromDate);
    setEndDate(toDate);
    setDisplayMonth(new Date(fromDate));
  }, [fromDate, toDate]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleToggleOpen() {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  }

  function selectDate(date: Date) {
    if (!startDate) {
      setStartDate(date);
    } else if (!endDate) {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
        onRangeChange(date, startDate);
        handleClose()
      } else {
        setEndDate(date);
        onRangeChange(startDate, date);
        handleClose();
      }
    } else {
      setStartDate(date);
      setEndDate(null);
    }
  }

  function previousMonth() {
    setDisplayMonth(addMonths(displayMonth, -1));
  }

  function nextMonth() {
    setDisplayMonth(addMonths(displayMonth, 1));
  }

  function isDateInRange(date: Date): boolean {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  }

  function isDateSelected(date: Date): boolean {
    if (startDate && date.toDateString() === startDate.toDateString()) return true;
    if (endDate && date.toDateString() === endDate.toDateString()) return true;
    return false;
  }

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = displayMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Choose date"
        onClick={handleToggleOpen}
        className="rounded-lg p-1.5 text-lakehouse-900/70 hover:bg-cedar-500/10 hover:text-midnight-950"
      >
        <CalendarIcon className="h-5 w-5 text-midnight-950" />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 p-4 bg-white border border-cedar-500/50 rounded-lg shadow-lg z-50 w-80">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <h3 className="font-semibold text-midnight-950">{monthName}</h3>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-lakehouse-900/60 h-6">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const date = startOfDay(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day));
                const isSelected = isDateSelected(date);
                const isInRange = isDateInRange(date);
                const isFuture = isFutureDate(date, new Date());

                return (
                  <button
                    key={day}
                    onClick={() => !isFuture && selectDate(date)}
                    disabled={isFuture}
                    className={`h-8 text-sm rounded flex items-center justify-center ${
                      isSelected
                        ? "bg-cedar-500 text-white font-semibold"
                        : isInRange
                          ? "bg-cedar-500/10 text-midnight-950"
                          : isFuture
                            ? "text-lakehouse-900/30 cursor-not-allowed"
                            : "hover:bg-cedar-500/5 text-midnight-950"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}