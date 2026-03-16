import { AvailabilityWindow, DayOverride, TimeRange, WeeklySchedule } from './types';
import { dateToTimeString } from './utils';
import { startOfDay, endOfDay, addDays, fromZonedTime, toZonedTime } from './utils/date-helpers';
import { getWeekdayName } from './utils/get-weekday-name';

export interface AvailabilityParams {
    date: Date, // The date for which availability is being checked
    timezone: string; // The target timezone to consider
    weeklySchedule: WeeklySchedule; // Weekly schedule containing default availability rules
    override?: DayOverride; // Optional override for the specific day
}

/**
 * Calculates the availability window for a specific day based on a weekly schedule and optional overrides.
 *
 * @param weeklySchedule - The weekly schedule containing default rules.
 * @param date - The date for which availability is being calculated.
 * @param timezone - The target timezone for availability calculation.
 * @param override - Optional override providing custom rules for the day.
 * @returns An array of time ranges (availability windows) or null if unavailable.
 */
export const getAvailabilityWindow = ({
    weeklySchedule,
    date,
    timezone: targetTimezone,
    override
}: AvailabilityParams): AvailabilityWindow | null => {
    if (override && !override.isAvailable) {
        return null;
    }

    const { schedule, timezone: sourceTimezone, options } = weeklySchedule;

    // Precompute bounds
    const targetDayStart = startOfDay(date);
    const targetDayEnd = endOfDay(date);
    const sourceDayStart = toZonedTime(fromZonedTime(targetDayStart, targetTimezone), sourceTimezone);

    const targetAvailableFrom = options?.from
        ? toZonedTime(options.from, targetTimezone)
        : null;

    const targetAvailableUntil = options?.until
        ? toZonedTime(options.until, targetTimezone)
        : null;

    // Precompute day schedule map
    const dayScheduleMap = schedule.reduce((map, s) => {
        map[s.dayOfWeek] = map[s.dayOfWeek] || [];
        map[s.dayOfWeek].push(s);
        return map;
    }, {} as Record<string, TimeRange[]>);

    const availableWindows: { start: Date; end: Date }[] = [];

    const sourceDates = [sourceDayStart, addDays(sourceDayStart, 1)]; // Overnight support
    for (const sourceDate of sourceDates) {
        const timeRanges = override?.timeRanges ?? dayScheduleMap[getWeekdayName(sourceDate)];

        for (const timeRange of timeRanges ?? []) {
            const [startHour, startMinute] = timeRange.start.split(':');
            const [endHour, endMinute] = timeRange.end.split(':');

            const startDate = new Date(sourceDate);
            startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

            const endDate = new Date(sourceDate);
            endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

            const startInTarget = toZonedTime(fromZonedTime(startDate, sourceTimezone), targetTimezone);
            const endInTarget = toZonedTime(fromZonedTime(endDate, sourceTimezone), targetTimezone);

            if (startInTarget <= targetDayEnd && endInTarget >= targetDayStart) {
                let clampedStart = startInTarget < targetDayStart ? targetDayStart : startInTarget;
                let clampedEnd = endInTarget > targetDayEnd ? targetDayEnd : endInTarget;

                if (targetAvailableFrom && targetAvailableFrom > clampedStart) {
                    clampedStart = targetAvailableFrom;
                }

                if (targetAvailableUntil && targetAvailableUntil < clampedEnd) {
                    clampedEnd = targetAvailableUntil;
                }

                if (clampedStart < clampedEnd) {
                    availableWindows.push({ start: clampedStart, end: clampedEnd });
                }
            }
        }
    }

    if (availableWindows.length === 0) return null;

    return availableWindows
        .map(window => ({
            start: dateToTimeString(window.start),
            end: dateToTimeString(window.end)
        }) as TimeRange);
};
