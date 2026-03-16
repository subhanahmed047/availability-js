import { TimeString } from '../types';

export const timeStringToDate = (timeString: TimeString): Date => {
  const [hoursString, minutesString] = timeString.split(':');

  const hours = Number.parseInt(hoursString, 10);
  const minutes = Number.parseInt(minutesString, 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time string: "${timeString}"`);
  }

  const now = new Date();

  const result = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  );

  return result;
};
