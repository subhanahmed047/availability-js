export enum DAY_OF_WEEK {
    Sunday = "Sunday",
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday"
}

export type TimeString = `${number}${number}:${number}${number}`;

export type TimeRange = {
    start: TimeString;
    end: TimeString;
};

export interface TimeSlot extends TimeRange {
    isAvailable: boolean;
}

export interface DailySchedule extends TimeRange {
    dayOfWeek: DAY_OF_WEEK;
}

export type WeeklySchedule = {
    schedule: DailySchedule[];
    timezone: string;
    options?: {
        from?: Date;
        until?: Date;
    }
};

export interface DayOverride {
    date: Date
    isAvailable: boolean;
    timeRanges: TimeRange[] | null
}

export type AvailabilityWindow = TimeRange[];

export interface Booking {
    startTime: string; // UTC ISO string (e.g., "2024-01-25T14:30:00Z")
    endTime: string;   // UTC ISO string (e.g., "2024-01-25T15:30:00Z")
}
