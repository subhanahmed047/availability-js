import { DAY_OF_WEEK, DayOverride, WeeklySchedule } from "../types";
import { getAvailability } from "./get-availability";

const schedule: WeeklySchedule = {
    timezone: 'Australia/Sydney',
    schedule: [
        { dayOfWeek: DAY_OF_WEEK.Saturday, start: "09:00", end: "17:00" },
        { dayOfWeek: DAY_OF_WEEK.Sunday, start: "09:00", end: "17:00" },
    ],
    options: {
        from: new Date('2025-01-19'),
        until: new Date('2025-12-31'),
    }
}

const override: DayOverride = {
    date: new Date('2025-01-20'),
    isAvailable: true,
    timeRanges: [
        { start: '09:00', end: '12:00' },
        { start: '02:00', end: '17:00' }
    ]
}

const availability = getAvailability({
    weeklySchedule: schedule,
    // override,
    date: new Date('2025-01-19'),
    timezone: 'Australia/Sydney'
});

console.log(availability);