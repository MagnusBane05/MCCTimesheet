import { describe, it, expect } from 'vitest';
import { getDurationHours, isValidTimeIncrement, generateTimeOptions, generateHourOptions, generateMinuteOptions, getHours, getMinutes } from '../time';

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

describe('generateHourOptions', () => {
  it('produces 24 zero-padded options from 00 through 23', () => {
    const options = generateHourOptions();
    expect(options).toHaveLength(24);
    expect(options[0]).toBe('00');
    expect(options[options.length - 1]).toBe('23');
  });
});

describe('generateMinuteOptions', () => {
  it('steps by 1 minute by default range', () => {
    const options = generateMinuteOptions(1);
    expect(options).toHaveLength(60);
    expect(options[0]).toBe('00');
    expect(options[options.length - 1]).toBe('59');
  });

  it('steps by 15 minutes for quarter-hour increments', () => {
    expect(generateMinuteOptions(15)).toEqual(['00', '15', '30', '45']);
  });
});

describe('getHours', () => {
  it('returns the hour of a date as a zero-padded string', () => {
    const date = new Date('2024-06-01T08:30:00');
    expect(getHours(date)).toBe('08');
    expect(getHours(date, 3)).toBe('06'); // 8 rounded down to nearest multiple of 3 is 6
  });
});

describe('getMinutes', () => {
  it('returns the minutes of a date as a zero-padded string', () => {
    const date = new Date('2024-06-01T08:33:00');
    expect(getMinutes(date)).toBe('33');
    expect(getMinutes(date, 15)).toBe('30');
  });
});
