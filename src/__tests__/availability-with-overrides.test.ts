import { describe, test, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { DAY_OF_WEEK, DayOverride, WeeklySchedule } from '../types';
import { getAvailabilityWindow } from '../get-availability-window';

describe('Availability Windows with Overrides', () => {
    describe('Tokyo-based Professional (Regular Office Hours) with Overrides', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Friday, start: "09:00", end: "15:00" }
            ],
            timezone: 'Asia/Tokyo'
        };

        describe('December 8th (Sunday)', () => {
            const date = parseISO("2024-12-08");
            const eveningOverride: DayOverride = {
                date: parseISO("2024-12-08"),
                isAvailable: true,
                timeRanges: [
                    { start: "20:00", end: "22:00" }
                ]
            };

            test('Tokyo viewer sees evening override hours', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "20:00", end: "22:00" }]);
            });

            test('Sydney viewer sees shifted evening override', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "22:00", end: "23:59" }]);
            });

            test('New York viewer sees override in morning hours', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "06:00", end: "08:00" }]);
            });
        });

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Tokyo viewer sees no availability with full-day unavailable override', () => {
                const fullDayUnavailable: DayOverride = {
                    date: parseISO("2024-12-09"),
                    isAvailable: false,
                    timeRanges: null
                };

                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: fullDayUnavailable
                });
                expect(result).toBeNull();
            });

            test('Tokyo viewer sees split shifts override', () => {
                const splitShiftsOverride: DayOverride = {
                    date: parseISO("2024-12-09"),
                    isAvailable: true,
                    timeRanges: [
                        { start: "07:00", end: "11:00" },
                        { start: "13:00", end: "16:00" }
                    ]
                };

                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: splitShiftsOverride
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "13:00", end: "16:00" }
                ]);
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = parseISO("2024-12-10");
            const morningShiftOverride: DayOverride = {
                date: parseISO("2024-12-10"),
                isAvailable: true,
                timeRanges: [
                    { start: "06:00", end: "10:00" }
                ]
            };

            test('Tokyo viewer sees morning shift override', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: morningShiftOverride
                });
                expect(result).toEqual([{ start: "06:00", end: "10:00" }]);
            });

            test('New York viewer sees shifted morning override', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    override: morningShiftOverride
                });
                expect(result).toEqual([{ start: "16:00", end: "20:00" }]);
            });
        });
    });

    describe('New York-based Professional (Late Shifts) with Overrides', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "16:00", end: "23:59" }
            ],
            timezone: 'America/New_York'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");
            const normalHoursOverride: DayOverride = {
                date: parseISO("2024-12-09"),
                isAvailable: true,
                timeRanges: [
                    { start: "09:00", end: "17:00" }
                ]
            };

            test('New York viewer sees override during normal business hours', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    override: normalHoursOverride
                });
                expect(result).toEqual([{ start: "09:00", end: "17:00" }]);
            });

            test('Tokyo viewer sees parts of NY normal hours override', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: normalHoursOverride
                });
                expect(result).toEqual([
                    { start: "00:00", end: "07:00" },
                    { start: "23:00", end: "23:59" }
                ]);
            });
        });
    });
});