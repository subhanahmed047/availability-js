import { DAY_OF_WEEK } from '../types';

export const getWeekdayName = (date: Date): DAY_OF_WEEK => {
  const dayIndex = date.getDay();

  switch (dayIndex) {
    case 0:
      return DAY_OF_WEEK.Sunday;
    case 1:
      return DAY_OF_WEEK.Monday;
    case 2:
      return DAY_OF_WEEK.Tuesday;
    case 3:
      return DAY_OF_WEEK.Wednesday;
    case 4:
      return DAY_OF_WEEK.Thursday;
    case 5:
      return DAY_OF_WEEK.Friday;
    case 6:
      return DAY_OF_WEEK.Saturday;
    default:
      // Fallback should be unreachable but keeps the function total.
      return DAY_OF_WEEK.Sunday;
  }
};

