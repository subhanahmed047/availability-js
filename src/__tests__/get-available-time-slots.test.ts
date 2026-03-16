import { describe, test, expect } from 'vitest';
import { DAY_OF_WEEK, DayOverride, WeeklySchedule } from '../types';
import { getAvailableTimeslots } from '../get-available-time-slots';
import { parseISO } from 'date-fns';

describe('getAvailableTimeslots', () => {
    describe('Tokyo-based Professional with Regular Hours', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Friday, start: "09:00", end: "15:00" }
            ],
            timezone: 'Asia/Tokyo'
        };

        test('generates 30-minute slots for evening override in Tokyo', () => {
            const eveningOverride: DayOverride = {
                date: new Date("2024-12-08"),
                isAvailable: true,
                timeRanges: [
                    { start: "20:00", end: "22:00" }
                ]
            };

            const result = getAvailableTimeslots({
                weeklySchedule,
                date: new Date("2024-12-08"),
                timezone: "Asia/Tokyo",
                override: eveningOverride,
                slotDurationMinutes: 30
            });

            // 20:00-22:00 = 4 slots of 30 minutes
            expect(result).toEqual([
                { start: "20:00", end: "20:30", isAvailable: true },
                { start: "20:30", end: "21:00", isAvailable: true },
                { start: "21:00", end: "21:30", isAvailable: true },
                { start: "21:30", end: "22:00", isAvailable: true }
            ]);
        });

        test('handles split shifts with 15-minute slots', () => {
            const splitShiftsOverride: DayOverride = {
                date: new Date("2024-12-09"),
                isAvailable: true,
                timeRanges: [
                    { start: "07:00", end: "11:00" },
                    { start: "13:00", end: "16:00" }
                ]
            };

            const result = getAvailableTimeslots({
                weeklySchedule,
                date: new Date("2024-12-09"),
                timezone: "Asia/Tokyo",
                override: splitShiftsOverride,
                slotDurationMinutes: 15
            });

            // First slot should be 07:00-07:15
            expect(result?.[0]).toEqual({
                start: "07:00",
                end: "07:15",
                isAvailable: true
            });

            // Should have gap between 11:00-13:00 marked as unavailable
            const noonSlot = result?.find(slot => slot.start === "12:00");
            expect(noonSlot?.isAvailable).toBe(false);

            // Last slot should be 15:45-16:00
            expect(result?.[result.length - 1]).toEqual({
                start: "15:45",
                end: "16:00",
                isAvailable: true
            });
        });

        test('handles availableFrom constraint with hourly slots', () => {
            const eveningOverride: DayOverride = {
                date: new Date("2024-12-08"),
                isAvailable: true,
                timeRanges: [
                    { start: "20:00", end: "22:00" }
                ]
            };

            const result = getAvailableTimeslots({
                weeklySchedule: {
                    ...weeklySchedule,
                    options: {
                        from: new Date("2024-12-08T12:00:00Z") // 21:00 JST
                    }
                },
                date: new Date("2024-12-08"),
                timezone: "Asia/Tokyo",
                override: eveningOverride,
                slotDurationMinutes: 60
            });

            // Should only have one slot from 21:00-22:00
            expect(result).toEqual([
                { start: "21:00", end: "22:00", isAvailable: true }
            ]);
        });
    });

    describe('Cross-timezone Slot Generation', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "16:00", end: "23:59" }
            ],
            timezone: 'America/New_York'
        };

        test('Tokyo viewer sees correct slots for NY business hours', () => {
            const normalHoursOverride: DayOverride = {
                date: new Date("2024-12-09"),
                isAvailable: true,
                timeRanges: [
                    { start: "09:00", end: "17:00" }
                ]
            };

            const result = getAvailableTimeslots({
                weeklySchedule,
                date: new Date("2024-12-09"),
                timezone: "Asia/Tokyo",
                override: normalHoursOverride,
                slotDurationMinutes: 60
            });

            // When it's 9:00-17:00 in NY, it's 23:00 previous day to 07:00 current day in Tokyo
            expect(result).toEqual([
                { start: "00:00", end: "01:00", isAvailable: true },
                { start: "01:00", end: "02:00", isAvailable: true },
                { start: "02:00", end: "03:00", isAvailable: true },
                { start: "03:00", end: "04:00", isAvailable: true },
                { start: "04:00", end: "05:00", isAvailable: true },
                { start: "05:00", end: "06:00", isAvailable: true },
                { start: "06:00", end: "07:00", isAvailable: true },
                { start: "07:00", end: "08:00", isAvailable: false },
                { start: "08:00", end: "09:00", isAvailable: false },
                { start: "09:00", end: "10:00", isAvailable: false },
                { start: "10:00", end: "11:00", isAvailable: false },
                { start: "11:00", end: "12:00", isAvailable: false },
                { start: "12:00", end: "13:00", isAvailable: false },
                { start: "13:00", end: "14:00", isAvailable: false },
                { start: "14:00", end: "15:00", isAvailable: false },
                { start: "15:00", end: "16:00", isAvailable: false },
                { start: "16:00", end: "17:00", isAvailable: false },
                { start: "17:00", end: "18:00", isAvailable: false },
                { start: "18:00", end: "19:00", isAvailable: false },
                { start: "19:00", end: "20:00", isAvailable: false },
                { start: "20:00", end: "21:00", isAvailable: false },
                { start: "21:00", end: "22:00", isAvailable: false },
                { start: "22:00", end: "23:00", isAvailable: false },
                { start: "23:00", end: "23:59", isAvailable: true }
            ]);
        });
    });


    describe('Tokyo-based Professional (Regular Office Hours)', () => {
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

            test('Tokyo viewer sees no availability', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    slotDurationMinutes: 30
                });
                expect(result).toBeNull();
            });

            test('Sydney viewer sees no availability', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney",
                    slotDurationMinutes: 30
                });
                expect(result).toBeNull();
            });

            test('New York viewer sees start of Tokyo Monday workday with 30-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    slotDurationMinutes: 30
                });

                expect(result).toEqual([
                    { start: "19:00", end: "19:30", isAvailable: true },
                    { start: "19:30", end: "20:00", isAvailable: true },
                    { start: "20:00", end: "20:30", isAvailable: true },
                    { start: "20:30", end: "21:00", isAvailable: true },
                    { start: "21:00", end: "21:30", isAvailable: true },
                    { start: "21:30", end: "22:00", isAvailable: true },
                    { start: "22:00", end: "22:30", isAvailable: true },
                    { start: "22:30", end: "23:00", isAvailable: true },
                    { start: "23:00", end: "23:30", isAvailable: true },
                    { start: "23:30", end: "23:59", isAvailable: true }
                ]);
            });

            test('Los Angeles viewer sees start of Tokyo Monday workday with 60-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles",
                    slotDurationMinutes: 60
                });

                expect(result).toEqual([
                    { start: "16:00", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "18:00", isAvailable: true },
                    { start: "18:00", end: "19:00", isAvailable: true },
                    { start: "19:00", end: "20:00", isAvailable: true },
                    { start: "20:00", end: "21:00", isAvailable: true },
                    { start: "21:00", end: "22:00", isAvailable: true },
                    { start: "22:00", end: "23:00", isAvailable: true },
                    { start: "23:00", end: "23:59", isAvailable: true }
                ]);
            });
        });

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Tokyo viewer sees full Monday workday with 15-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    slotDurationMinutes: 15
                });

                expect(result).toEqual([
                    { start: "09:00", end: "09:15", isAvailable: true },
                    { start: "09:15", end: "09:30", isAvailable: true },
                    { start: "09:30", end: "09:45", isAvailable: true },
                    { start: "09:45", end: "10:00", isAvailable: true },
                    { start: "10:00", end: "10:15", isAvailable: true },
                    { start: "10:15", end: "10:30", isAvailable: true },
                    { start: "10:30", end: "10:45", isAvailable: true },
                    { start: "10:45", end: "11:00", isAvailable: true },
                    { start: "11:00", end: "11:15", isAvailable: true },
                    { start: "11:15", end: "11:30", isAvailable: true },
                    { start: "11:30", end: "11:45", isAvailable: true },
                    { start: "11:45", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "12:15", isAvailable: true },
                    { start: "12:15", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "12:45", isAvailable: true },
                    { start: "12:45", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:15", isAvailable: true },
                    { start: "13:15", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "13:45", isAvailable: true },
                    { start: "13:45", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:15", isAvailable: true },
                    { start: "14:15", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "14:45", isAvailable: true },
                    { start: "14:45", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:15", isAvailable: true },
                    { start: "15:15", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "15:45", isAvailable: true },
                    { start: "15:45", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:15", isAvailable: true },
                    { start: "16:15", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "16:45", isAvailable: true },
                    { start: "16:45", end: "17:00", isAvailable: true }
                ]);
            });

            test('Sydney viewer sees shifted Monday workday with 30-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney",
                    slotDurationMinutes: 30
                });

                expect(result).toEqual([
                    { start: "11:00", end: "11:30", isAvailable: true },
                    { start: "11:30", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "18:00", isAvailable: true },
                    { start: "18:00", end: "18:30", isAvailable: true },
                    { start: "18:30", end: "19:00", isAvailable: true }
                ]);
            });

            test('New York viewer sees end of Tokyo Monday workday with 45-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    slotDurationMinutes: 45
                });

                expect(result).toEqual([
                    { start: "00:00", end: "00:45", isAvailable: true },
                    { start: "00:45", end: "01:30", isAvailable: true },
                    { start: "01:30", end: "02:15", isAvailable: true },
                    { start: "02:15", end: "03:00", isAvailable: true }
                ]);
            });

            test('Los Angeles viewer sees no availability', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles",
                    slotDurationMinutes: 30
                });
                expect(result).toBeNull();
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = parseISO("2024-12-10");

            test('Tokyo viewer sees no availability with 20-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    slotDurationMinutes: 20
                });
                expect(result).toBeNull();
            });

            test('New York viewer sees start of Tokyo Wednesday workday with 40-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    slotDurationMinutes: 40
                });

                expect(result).toEqual([
                    { start: "19:00", end: "19:40", isAvailable: true },
                    { start: "19:40", end: "20:20", isAvailable: true },
                    { start: "20:20", end: "21:00", isAvailable: true },
                    { start: "21:00", end: "21:40", isAvailable: true },
                    { start: "21:40", end: "22:20", isAvailable: true },
                    { start: "22:20", end: "23:00", isAvailable: true },
                    { start: "23:00", end: "23:40", isAvailable: true },
                    { start: "23:40", end: "23:59", isAvailable: true }
                ]);
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
            const date = new Date("2024-12-09");
            const normalHoursOverride: DayOverride = {
                date: new Date("2024-12-09"),
                isAvailable: true,
                timeRanges: [
                    { start: "09:00", end: "17:00" }
                ]
            };

            test('New York viewer sees override during normal business hours with 30-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    override: normalHoursOverride,
                    slotDurationMinutes: 30
                });

                expect(result).toEqual([
                    { start: "09:00", end: "09:30", isAvailable: true },
                    { start: "09:30", end: "10:00", isAvailable: true },
                    { start: "10:00", end: "10:30", isAvailable: true },
                    { start: "10:30", end: "11:00", isAvailable: true },
                    { start: "11:00", end: "11:30", isAvailable: true },
                    { start: "11:30", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true }
                ]);
            });

            test('New York viewer with availability window constraints using 45-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-09T11:00:00-05:00"),
                            until: new Date("2024-12-09T15:00:00-05:00")
                        }
                    },
                    date,
                    timezone: "America/New_York",
                    override: normalHoursOverride,
                    slotDurationMinutes: 45
                });

                expect(result).toEqual([
                    { start: "11:00", end: "11:45", isAvailable: true },
                    { start: "11:45", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "13:15", isAvailable: true },
                    { start: "13:15", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:45", isAvailable: true },
                    { start: "14:45", end: "15:00", isAvailable: true }
                ]);
            });

            test('Tokyo viewer sees parts of NY normal hours override with 1-hour slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo",
                    override: normalHoursOverride,
                    slotDurationMinutes: 60
                });

                expect(result).toEqual([
                    { start: "00:00", end: "01:00", isAvailable: true },
                    { start: "01:00", end: "02:00", isAvailable: true },
                    { start: "02:00", end: "03:00", isAvailable: true },
                    { start: "03:00", end: "04:00", isAvailable: true },
                    { start: "04:00", end: "05:00", isAvailable: true },
                    { start: "05:00", end: "06:00", isAvailable: true },
                    { start: "06:00", end: "07:00", isAvailable: true },
                    // 07:00-23:00 slots (unavailable)
                    { start: "07:00", end: "08:00", isAvailable: false },
                    { start: "08:00", end: "09:00", isAvailable: false },
                    { start: "09:00", end: "10:00", isAvailable: false },
                    { start: "10:00", end: "11:00", isAvailable: false },
                    { start: "11:00", end: "12:00", isAvailable: false },
                    { start: "12:00", end: "13:00", isAvailable: false },
                    { start: "13:00", end: "14:00", isAvailable: false },
                    { start: "14:00", end: "15:00", isAvailable: false },
                    { start: "15:00", end: "16:00", isAvailable: false },
                    { start: "16:00", end: "17:00", isAvailable: false },
                    { start: "17:00", end: "18:00", isAvailable: false },
                    { start: "18:00", end: "19:00", isAvailable: false },
                    { start: "19:00", end: "20:00", isAvailable: false },
                    { start: "20:00", end: "21:00", isAvailable: false },
                    { start: "21:00", end: "22:00", isAvailable: false },
                    { start: "22:00", end: "23:00", isAvailable: false },
                    // 23:00-23:59 slot (available)
                    { start: "23:00", end: "23:59", isAvailable: true }
                ]);
            });

            test('Tokyo viewer with availableFrom constraint using 20-minute slots', () => {
                const result = getAvailableTimeslots({
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

                expect(result).toEqual([
                    { start: "02:00", end: "02:20", isAvailable: true },
                    { start: "02:20", end: "02:40", isAvailable: true },
                    { start: "02:40", end: "03:00", isAvailable: true },
                    { start: "03:00", end: "03:20", isAvailable: true },
                    { start: "03:20", end: "03:40", isAvailable: true },
                    { start: "03:40", end: "04:00", isAvailable: true },
                    { start: "04:00", end: "04:20", isAvailable: true },
                    { start: "04:20", end: "04:40", isAvailable: true },
                    { start: "04:40", end: "05:00", isAvailable: true },
                    { start: "05:00", end: "05:20", isAvailable: true },
                    { start: "05:20", end: "05:40", isAvailable: true },
                    { start: "05:40", end: "06:00", isAvailable: true },
                    { start: "06:00", end: "06:20", isAvailable: true },
                    { start: "06:20", end: "06:40", isAvailable: true },
                    { start: "06:40", end: "07:00", isAvailable: true },
                    { start: "07:00", end: "07:20", isAvailable: false },
                    { start: "07:20", end: "07:40", isAvailable: false },
                    { start: "07:40", end: "08:00", isAvailable: false },
                    { start: "08:00", end: "08:20", isAvailable: false },
                    { start: "08:20", end: "08:40", isAvailable: false },
                    { start: "08:40", end: "09:00", isAvailable: false },
                    { start: "09:00", end: "09:20", isAvailable: false },
                    { start: "09:20", end: "09:40", isAvailable: false },
                    { start: "09:40", end: "10:00", isAvailable: false },
                    { start: "10:00", end: "10:20", isAvailable: false },
                    { start: "10:20", end: "10:40", isAvailable: false },
                    { start: "10:40", end: "11:00", isAvailable: false },
                    { start: "11:00", end: "11:20", isAvailable: false },
                    { start: "11:20", end: "11:40", isAvailable: false },
                    { start: "11:40", end: "12:00", isAvailable: false },
                    { start: "12:00", end: "12:20", isAvailable: false },
                    { start: "12:20", end: "12:40", isAvailable: false },
                    { start: "12:40", end: "13:00", isAvailable: false },
                    { start: "13:00", end: "13:20", isAvailable: false },
                    { start: "13:20", end: "13:40", isAvailable: false },
                    { start: "13:40", end: "14:00", isAvailable: false },
                    { start: "14:00", end: "14:20", isAvailable: false },
                    { start: "14:20", end: "14:40", isAvailable: false },
                    { start: "14:40", end: "15:00", isAvailable: false },
                    { start: "15:00", end: "15:20", isAvailable: false },
                    { start: "15:20", end: "15:40", isAvailable: false },
                    { start: "15:40", end: "16:00", isAvailable: false },
                    { start: "16:00", end: "16:20", isAvailable: false },
                    { start: "16:20", end: "16:40", isAvailable: false },
                    { start: "16:40", end: "17:00", isAvailable: false },
                    { start: "17:00", end: "17:20", isAvailable: false },
                    { start: "17:20", end: "17:40", isAvailable: false },
                    { start: "17:40", end: "18:00", isAvailable: false },
                    { start: "18:00", end: "18:20", isAvailable: false },
                    { start: "18:20", end: "18:40", isAvailable: false },
                    { start: "18:40", end: "19:00", isAvailable: false },
                    { start: "19:00", end: "19:20", isAvailable: false },
                    { start: "19:20", end: "19:40", isAvailable: false },
                    { start: "19:40", end: "20:00", isAvailable: false },
                    { start: "20:00", end: "20:20", isAvailable: false },
                    { start: "20:20", end: "20:40", isAvailable: false },
                    { start: "20:40", end: "21:00", isAvailable: false },
                    { start: "21:00", end: "21:20", isAvailable: false },
                    { start: "21:20", end: "21:40", isAvailable: false },
                    { start: "21:40", end: "22:00", isAvailable: false },
                    { start: "22:00", end: "22:20", isAvailable: false },
                    { start: "22:20", end: "22:40", isAvailable: false },
                    { start: "22:40", end: "23:00", isAvailable: false },
                    { start: "23:00", end: "23:20", isAvailable: true },
                    { start: "23:20", end: "23:40", isAvailable: true },
                    { start: "23:40", end: "23:59", isAvailable: true }
                ]);
            });

            test('Tokyo viewer with availableUntil constraint using 15-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-09T05:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: normalHoursOverride,
                    slotDurationMinutes: 15
                });

                expect(result).toEqual([
                    { start: "00:00", end: "00:15", isAvailable: true },
                    { start: "00:15", end: "00:30", isAvailable: true },
                    { start: "00:30", end: "00:45", isAvailable: true },
                    { start: "00:45", end: "01:00", isAvailable: true },
                    { start: "01:00", end: "01:15", isAvailable: true },
                    { start: "01:15", end: "01:30", isAvailable: true },
                    { start: "01:30", end: "01:45", isAvailable: true },
                    { start: "01:45", end: "02:00", isAvailable: true },
                    { start: "02:00", end: "02:15", isAvailable: true },
                    { start: "02:15", end: "02:30", isAvailable: true },
                    { start: "02:30", end: "02:45", isAvailable: true },
                    { start: "02:45", end: "03:00", isAvailable: true },
                    { start: "03:00", end: "03:15", isAvailable: true },
                    { start: "03:15", end: "03:30", isAvailable: true },
                    { start: "03:30", end: "03:45", isAvailable: true },
                    { start: "03:45", end: "04:00", isAvailable: true },
                    { start: "04:00", end: "04:15", isAvailable: true },
                    { start: "04:15", end: "04:30", isAvailable: true },
                    { start: "04:30", end: "04:45", isAvailable: true },
                    { start: "04:45", end: "05:00", isAvailable: true }
                ]);
            });
        });
    });

    describe('Indian Professional (Standard Work Hours)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "10:00", end: "18:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "10:00", end: "18:00" },
                { dayOfWeek: DAY_OF_WEEK.Friday, start: "10:00", end: "16:00" }
            ],
            timezone: 'Asia/Kolkata'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Mumbai viewer sees standard workday with 30-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Kolkata",
                    slotDurationMinutes: 30
                });

                expect(result).toEqual([
                    { start: "10:00", end: "10:30", isAvailable: true },
                    { start: "10:30", end: "11:00", isAvailable: true },
                    { start: "11:00", end: "11:30", isAvailable: true },
                    { start: "11:30", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "18:00", isAvailable: true }
                ]);
            });

            test('Mumbai viewer with availableFrom sees partial workday with 45-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T12:00:00+05:30")
                        }
                    },
                    date,
                    timezone: "Asia/Kolkata",
                    slotDurationMinutes: 45
                });

                expect(result).toEqual([
                    { start: "12:00", end: "12:45", isAvailable: true },
                    { start: "12:45", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:15", isAvailable: true },
                    { start: "14:15", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:45", isAvailable: true },
                    { start: "15:45", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:15", isAvailable: true },
                    { start: "17:15", end: "18:00", isAvailable: true }
                ]);
            });

            test('Mumbai viewer with availableUntil sees shorter workday with 1-hour slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: parseISO("2024-12-09T15:00:00+05:30")
                        }
                    },
                    date,
                    timezone: "Asia/Kolkata",
                    slotDurationMinutes: 60
                });

                expect(result).toEqual([
                    { start: "10:00", end: "11:00", isAvailable: true },
                    { start: "11:00", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "15:00", isAvailable: true }
                ]);
            });

            test('Singapore viewer sees shifted workday with 30-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Singapore",
                    slotDurationMinutes: 30
                });

                expect(result).toEqual([
                    { start: "12:30", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "18:00", isAvailable: true },
                    { start: "18:00", end: "18:30", isAvailable: true },
                    { start: "18:30", end: "19:00", isAvailable: true },
                    { start: "19:00", end: "19:30", isAvailable: true },
                    { start: "19:30", end: "20:00", isAvailable: true },
                    { start: "20:00", end: "20:30", isAvailable: true }
                ]);
            });

            test('Singapore viewer with local availableFrom using 20-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T14:00:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore",
                    slotDurationMinutes: 20
                });

                expect(result).toEqual([
                    { start: "14:00", end: "14:20", isAvailable: true },
                    { start: "14:20", end: "14:40", isAvailable: true },
                    { start: "14:40", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:20", isAvailable: true },
                    { start: "15:20", end: "15:40", isAvailable: true },
                    { start: "15:40", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:20", isAvailable: true },
                    { start: "16:20", end: "16:40", isAvailable: true },
                    { start: "16:40", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:20", isAvailable: true },
                    { start: "17:20", end: "17:40", isAvailable: true },
                    { start: "17:40", end: "18:00", isAvailable: true },
                    { start: "18:00", end: "18:20", isAvailable: true },
                    { start: "18:20", end: "18:40", isAvailable: true },
                    { start: "18:40", end: "19:00", isAvailable: true },
                    { start: "19:00", end: "19:20", isAvailable: true },
                    { start: "19:20", end: "19:40", isAvailable: true },
                    { start: "19:40", end: "20:00", isAvailable: true },
                    { start: "20:00", end: "20:20", isAvailable: true },
                    { start: "20:20", end: "20:30", isAvailable: true }
                ]);
            });

            test('Singapore viewer with local availableUntil using 15-minute slots', () => {
                const result = getAvailableTimeslots({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: parseISO("2024-12-09T18:00:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore",
                    slotDurationMinutes: 15
                });

                expect(result).toEqual([
                    { start: "12:30", end: "12:45", isAvailable: true },
                    { start: "12:45", end: "13:00", isAvailable: true },
                    { start: "13:00", end: "13:15", isAvailable: true },
                    { start: "13:15", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "13:45", isAvailable: true },
                    { start: "13:45", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:15", isAvailable: true },
                    { start: "14:15", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "14:45", isAvailable: true },
                    { start: "14:45", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:15", isAvailable: true },
                    { start: "15:15", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "15:45", isAvailable: true },
                    { start: "15:45", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:15", isAvailable: true },
                    { start: "16:15", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "16:45", isAvailable: true },
                    { start: "16:45", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:15", isAvailable: true },
                    { start: "17:15", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "17:45", isAvailable: true },
                    { start: "17:45", end: "18:00", isAvailable: true }
                ]);
            });
        });
    });

});