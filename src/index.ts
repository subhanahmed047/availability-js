import { DAY_OF_WEEK, DayOverride, TimeRange, WeeklySchedule } from "../types";
import { getAvailableTimeslots } from "./get-available-time-slots";

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

// Adding some example bookings
const bookings: TimeRange[] = [
    { start: "02:00", end: "03:00" },  // Early morning booking
    { start: "23:00", end: "23:59" }   // Late night booking
];

// Now get the time slots with bookings
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
    slotDurationMinutes: 20,
    bookings  // Adding the bookings parameter
});

console.log({ slots });