import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { AvailabilityWindow, DayOverride, TimeRange, WeeklySchedule } from '../types';
import { dateToTimeString } from './utils';

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

    // If there's an override marking the day as unavailable, return null
    if (override && !override.isAvailable) {
        return null;
    }

    const { schedule, timezone: sourceTimezone, options } = weeklySchedule;
    let availableFrom = null; // Optional earliest available time
    let availableUntil = null; // Optional latest available time

    if (options) {
        availableFrom = options.from;
        availableUntil = options.until;
    }

    // Calculate the start and end of the day in the target timezone
    const targetDayStart = startOfDay(date);
    const targetDayEnd = endOfDay(date);

    // Calculate the start of the day in the source timezone
    const sourceDayStart = toZonedTime(fromZonedTime(targetDayStart, targetTimezone), sourceTimezone);

    // Convert availability bounds (if defined) from source to target timezone
    const targetAvailableFrom = availableFrom ?
        toZonedTime(availableFrom, targetTimezone) :
        null;

    const targetAvailableUntil = availableUntil ?
        toZonedTime(availableUntil, targetTimezone) :
        null;

    const availableWindows: { start: Date; end: Date; }[] = [];

    // Iterate over the day and the next day to consider overlapping schedules
    for (const sourceDate of [sourceDayStart, addDays(sourceDayStart, 1)]) {
        // Get time ranges from the override or default schedule for the day
        const timeRanges = override?.timeRanges ?? schedule.filter(s =>
            s.dayOfWeek === format(sourceDate, 'EEEE')
        );

        for (const timeRange of timeRanges ?? []) {
            const [startHour, startMinute] = timeRange.start.split(':');
            const [endHour, endMinute] = timeRange.end.split(':');

            // Create date objects for the start and end times in the source timezone
            const startDate = new Date(sourceDate);
            startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

            const endDate = new Date(sourceDate);
            endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

            // Convert the source start and end times to the target timezone
            const startInTarget = toZonedTime(fromZonedTime(startDate, sourceTimezone), targetTimezone);
            const endInTarget = toZonedTime(fromZonedTime(endDate, sourceTimezone), targetTimezone);

            // Check if the time range overlaps with the target day
            if (startInTarget <= targetDayEnd && endInTarget >= targetDayStart) {
                // Clamp the start and end times to the day boundaries
                let clampedStart = startInTarget < targetDayStart ? targetDayStart : startInTarget;
                let clampedEnd = endInTarget > targetDayEnd ? targetDayEnd : endInTarget;

                // Apply optional availability constraints
                if (targetAvailableFrom && targetAvailableFrom > clampedStart) {
                    clampedStart = targetAvailableFrom;
                }

                if (targetAvailableUntil && targetAvailableUntil < clampedEnd) {
                    clampedEnd = targetAvailableUntil;
                }

                // Add the window if it's valid after all adjustments
                if (clampedStart < clampedEnd) {
                    availableWindows.push({
                        start: clampedStart,
                        end: clampedEnd
                    });
                }
            }
        }
    }

    // Return null if no valid availability windows were found
    if (availableWindows.length === 0) return null;

    // Sort and format the availability windows before returning
    return availableWindows
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map(window => ({
            start: dateToTimeString(window.start),
            end: dateToTimeString(window.end)
        }) as TimeRange);
};
