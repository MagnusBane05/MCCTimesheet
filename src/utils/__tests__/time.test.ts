import { describe, it, expect } from 'vitest';
import { getDurationHours, isValidTimeIncrement, generateTimeOptions } from '../time';

describe('getDurationHours', () => {
  it('computes whole-hour durations', () => {
    expect(getDurationHours('08:00', '10:00')).toBe(2);
  });

  it('computes quarter-hour durations', () => {
    expect(getDurationHours('13:00', '16:30')).toBe(3.5);
    expect(getDurationHours('08:00', '09:15')).toBe(1.25);
  });

  it('returns 0 for equal start/end', () => {
    expect(getDurationHours('08:00', '08:00')).toBe(0);
  });

  it('returns a negative value for end before start (caller must reject)', () => {
    expect(getDurationHours('10:00', '08:00')).toBeLessThan(0);
  });
});

describe('isValidTimeIncrement', () => {
  it('accepts 15-minute increments', () => {
    expect(isValidTimeIncrement('08:00')).toBe(true);
    expect(isValidTimeIncrement('08:15')).toBe(true);
    expect(isValidTimeIncrement('08:30')).toBe(true);
    expect(isValidTimeIncrement('08:45')).toBe(true);
  });

  it('rejects other minute values', () => {
    expect(isValidTimeIncrement('08:10')).toBe(false);
    expect(isValidTimeIncrement('08:05')).toBe(false);
  });
});

describe('generateTimeOptions', () => {
  it('produces 96 options covering the full day in 15-minute steps', () => {
    const options = generateTimeOptions();
    expect(options).toHaveLength(96);
    expect(options[0]).toBe('00:00');
    expect(options[options.length - 1]).toBe('23:45');
  });
});
