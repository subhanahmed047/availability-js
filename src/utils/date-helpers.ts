/**
 * Minimal date helpers to avoid heavy date libraries while keeping behavior
 * consistent with the original implementation.
 */

export const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
};

export const endOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const isBefore = (a: Date, b: Date): boolean => {
  return a.getTime() < b.getTime();
};

export const parseISO = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Convert an instant to a wall-clock Date in the given IANA timezone.
 * The returned Date has the same local-time components in that zone, but
 * still represents a moment in time in the JS environment.
 */
export const toZonedTime = (date: Date, timeZone: string): Date => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number.parseInt(part.value, 10) : 0;
  };

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  return new Date(year, month - 1, day, hour, minute, second, date.getMilliseconds());
};

/**
 * Convert a wall-clock time in a specific timezone to a UTC Date.
 * This is implemented via iterative refinement using Intl timezone formatting.
 */
export const fromZonedTime = (localDate: Date, timeZone: string): Date => {
  const utcGuess = new Date(
    Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds(),
      localDate.getMilliseconds(),
    ),
  );

  const refine = (utcDate: Date): Date => {
    const zoned = toZonedTime(utcDate, timeZone);
    const diff = localDate.getTime() - zoned.getTime();
    return new Date(utcDate.getTime() + diff);
  };

  // One refinement step is usually enough; perform twice for safety around DST transitions.
  const first = refine(utcGuess);
  const second = refine(first);
  return second;
};

