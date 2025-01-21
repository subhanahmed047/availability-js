import { describe, test, expect } from 'vitest';
import { DAY_OF_WEEK, DayOverride, WeeklySchedule } from '../../types';
import { getAvailabilityWindow } from '../get-availability-window';

describe('Availability Windows with Overrides and Available Boundary', () => {
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
            const date = new Date("2024-12-08");
            const eveningOverride: DayOverride = {
                date: new Date("2024-12-08"),
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

            test('Tokyo viewer with availableFrom constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-08T12:00:00Z")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "21:00", end: "22:00" }]);
            });

            test('Tokyo viewer with availableUntil constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-08T21:30:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "20:00", end: "21:30" }]);
            });

            test('Tokyo viewer with both availableFrom and availableUntil constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-08T20:30:00+09:00"),
                            until: new Date("2024-12-08T21:30:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "20:30", end: "21:30" }]);
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

            test('Sydney viewer with availableFrom constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-08T23:00:00+11:00")
                        }
                    },
                    date,
                    timezone: "Australia/Sydney",
                    override: eveningOverride,
                });
                expect(result).toEqual([{ start: "23:00", end: "23:59" }]);
            });

            test('Sydney viewer with availableUntil constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-08T23:30:00+11:00")
                        }
                    },
                    date,
                    timezone: "Australia/Sydney",
                    override: eveningOverride
                });
                expect(result).toEqual([{ start: "22:00", end: "23:30" }]);
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

            test('New York viewer with availableFrom constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-08T07:00:00-05:00")
                        }
                    },
                    date,
                    timezone: "America/New_York",
                    override: eveningOverride,
                });
                expect(result).toEqual([{ start: "07:00", end: "08:00" }]);
            });

            test('New York viewer with availableUntil constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-08T07:30:00-05:00")
                        }
                    },
                    date,
                    timezone: "America/New_York",
                    override: eveningOverride,
                });
                expect(result).toEqual([{ start: "06:00", end: "07:30" }]);
            });
        });

        describe('December 9th (Monday)', () => {
            const date = new Date("2024-12-09");

            test('Tokyo viewer sees no availability with full-day unavailable override', () => {
                const fullDayUnavailable: DayOverride = {
                    date: new Date("2024-12-09"),
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
                    date: new Date("2024-12-09"),
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

            test('Tokyo viewer sees split shifts with availableFrom constraint', () => {
                const splitShiftsOverride: DayOverride = {
                    date: new Date("2024-12-09"),
                    isAvailable: true,
                    timeRanges: [
                        { start: "07:00", end: "11:00" },
                        { start: "13:00", end: "16:00" }
                    ]
                };

                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-09T10:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: splitShiftsOverride,
                });
                expect(result).toEqual([
                    { start: "10:00", end: "11:00" },
                    { start: "13:00", end: "16:00" }
                ]);
            });

            test('Tokyo viewer sees split shifts with availableUntil constraint', () => {
                const splitShiftsOverride: DayOverride = {
                    date: new Date("2024-12-09"),
                    isAvailable: true,
                    timeRanges: [
                        { start: "07:00", end: "11:00" },
                        { start: "13:00", end: "16:00" }
                    ]
                };

                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-09T14:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: splitShiftsOverride,
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "13:00", end: "14:00" }
                ]);
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = new Date("2024-12-10");
            const morningShiftOverride: DayOverride = {
                date: new Date("2024-12-10"),
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

            test('Tokyo viewer with availableFrom and availableUntil constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-10T07:00:00+09:00"),
                            until: new Date("2024-12-10T09:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: morningShiftOverride,
                });
                expect(result).toEqual([{ start: "07:00", end: "09:00" }]);
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

            test('New York viewer with availableFrom constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-10T18:00:00-05:00")
                        }
                    },
                    date,
                    timezone: "America/New_York",
                    override: morningShiftOverride,
                });
                expect(result).toEqual([{ start: "18:00", end: "20:00" }]);
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

            test('New York viewer sees override during normal business hours', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York",
                    override: normalHoursOverride
                });
                expect(result).toEqual([{ start: "09:00", end: "17:00" }]);
            });

            test('New York viewer with availability window constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-09T11:00:00-05:00"),
                            until: new Date("2024-12-09T15:00:00-05:00")
                        }
                    },
                    date,
                    timezone: "America/New_York",
                    override: normalHoursOverride
                });
                expect(result).toEqual([{ start: "11:00", end: "15:00" }]);
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

            test('Tokyo viewer with availableFrom constraint', () => {
                const result = getAvailabilityWindow({
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
                expect(result).toEqual([
                    { start: "02:00", end: "07:00" },
                    { start: "23:00", end: "23:59" }
                ]);
            });

            test('Tokyo viewer with availableUntil constraint', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: new Date("2024-12-09T05:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: normalHoursOverride,
                });
                expect(result).toEqual([
                    { start: "00:00", end: "05:00" }
                ]);
            });

            test('Tokyo viewer with both availableFrom and availableUntil constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: new Date("2024-12-09T02:00:00+09:00"),
                            until: new Date("2024-12-09T05:00:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo",
                    override: normalHoursOverride,
                });
                expect(result).toEqual([
                    { start: "02:00", end: "05:00" }
                ]);
            });
        });
    });
});