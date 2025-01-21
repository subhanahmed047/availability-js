import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { AvailabilityWindow, DayOverride, TimeRange, WeeklySchedule } from '../types';
import { dateToTimeString } from './utils';

export interface AvailabilityParams {
    date: Date,
    timezone: string;
    weeklySchedule: WeeklySchedule;
    override?: DayOverride;
}

export const getAvailabilityWindow = ({
    weeklySchedule,
    date,
    timezone: targetTimezone,
    override
}: AvailabilityParams): AvailabilityWindow | null => {

    // If there's an override and it marks the day as unavailable, return null
    if (override && !override.isAvailable) {
        return null;
    }

    const { schedule, timezone: sourceTimezone, options } = weeklySchedule;
    let availableFrom = null;
    let availableUntil = null;
    if (options) {
        availableFrom = options.from;
        availableUntil = options.until;
    }

    // start of the day in the target timezone
    const targetDayStart = startOfDay(date);
    const targetDayEnd = endOfDay(date);

    // start of the day in the source timezone
    const sourceDayStart = toZonedTime(fromZonedTime(targetDayStart, targetTimezone), sourceTimezone);

    // Convert availability bounds from source to target timezone if they exist
    const targetAvailableFrom = availableFrom ?
        toZonedTime(availableFrom, targetTimezone) : // directly convert UTC to target timezone
        null;

    const targetAvailableUntil = availableUntil ?
        toZonedTime(availableUntil, targetTimezone) :
        null;


    const availableWindows: { start: Date; end: Date; }[] = [];

    // check for the given day and also the next day for the possible timeslots
    for (const sourceDate of [sourceDayStart, addDays(sourceDayStart, 1)]) {
        // check the schedule for the given day of the week
        // If we have an override with time ranges, use those instead of the schedule
        const timeRanges = override?.timeRanges ?? schedule.filter(s =>
            s.dayOfWeek === format(sourceDate, 'EEEE')
        );

        for (const timeRange of timeRanges ?? []) {
            const [startHour, startMinute] = timeRange.start.split(':');
            const [endHour, endMinute] = timeRange.end.split(':');

            // create a date object for the start and end time for each time range in the source timezone
            const startDate = new Date(sourceDate);
            startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

            const endDate = new Date(sourceDate);
            endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

            // convert the source start and end time in the target timezone
            const startInTarget = toZonedTime(fromZonedTime(startDate, sourceTimezone), targetTimezone);
            const endInTarget = toZonedTime(fromZonedTime(endDate, sourceTimezone), targetTimezone);

            // First check if the time range falls within the target day
            if (startInTarget <= targetDayEnd && endInTarget >= targetDayStart) {
                // Initial clamping to the day boundaries
                let clampedStart = startInTarget < targetDayStart ? targetDayStart : startInTarget;
                let clampedEnd = endInTarget > targetDayEnd ? targetDayEnd : endInTarget;

                // Then apply availability window constraints if they exist
                if (targetAvailableFrom && targetAvailableFrom > clampedStart) {
                    clampedStart = targetAvailableFrom;
                }

                if (targetAvailableUntil && targetAvailableUntil < clampedEnd) {
                    clampedEnd = targetAvailableUntil;
                }

                // Only add the window if it's valid after all clamping
                if (clampedStart < clampedEnd) {
                    availableWindows.push({
                        start: clampedStart,
                        end: clampedEnd
                    });
                }
            }
        }
    }

    if (availableWindows.length === 0) return null;

    return availableWindows
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map(window => ({
            start: dateToTimeString(window.start),
            end: dateToTimeString(window.end)
        }) as TimeRange);
};