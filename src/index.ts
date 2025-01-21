import { parseISO } from "date-fns";
import { DAY_OF_WEEK, DayOverride, WeeklySchedule } from "../types";
import { getAvailableTimeslots } from "./get-available-time-slots";
import { getAvailabilityWindow } from "./get-availability-window";

const weeklySchedule: WeeklySchedule = {
    schedule: [
        { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "23:59" },
        { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "16:00", end: "23:59" }
    ],
    timezone: 'America/New_York'
};

const date = new Date("2024-12-09");
const normalHoursOverride: DayOverride = {
    date: new Date("2024-12-09"),
    isAvailable: true,
    timeRanges: [
        { start: "09:00", end: "17:00" }
    ]
};

const window = getAvailabilityWindow({
    weeklySchedule: {
        ...weeklySchedule,
        options: {
            from: new Date("2024-12-09T02:00:00+09:00")
        }
    },
    date,
    timezone: "Asia/Tokyo",
    override: normalHoursOverride,
});

const slots = getAvailableTimeslots({
    weeklySchedule: {
        ...weeklySchedule,
        options: {
            from: new Date("2024-12-09T02:00:00+09:00")
        }
    },
    date,
    timezone: "Asia/Tokyo",
    override: normalHoursOverride,
    slotDurationMinutes: 20
});


console.log({ window, slots });