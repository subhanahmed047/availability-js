import { describe, test, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { DAY_OF_WEEK, WeeklySchedule } from '../../types';
import { getAvailabilityWindow } from '../get-availability-window';

describe('Extended Timezone Test Cases', () => {
    describe('Indian Professional (Standard Work Hours)', () => {
        /**
         * Standard workday schedule for Indian professional
         * Tests half-hour timezone offset scenarios
         * Monday/Wednesday: 10:00-18:00 IST
         * Friday: 10:00-16:00 IST
         */
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

            /**
             * Base case - viewing schedule in local timezone
             * No timezone conversion needed, times should appear exactly as defined
             */
            test('Mumbai viewer sees standard workday', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Kolkata"
                });
                expect(result).toEqual([{ start: "10:00", end: "18:00" }]);
            });

            /**
             * Testing availableFrom constraint in local timezone
             * Base schedule: 10:00-18:00 IST
             * availableFrom: 12:00 IST
             * Since availableFrom is after start time, it should clamp the start to 12:00
             */
            test('Mumbai viewer with availableFrom sees partial workday', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T12:00:00+05:30")
                        }
                    },
                    date,
                    timezone: "Asia/Kolkata"
                });
                expect(result).toEqual([{ start: "12:00", end: "18:00" }]);
            });

            /**
             * Testing availableUntil constraint in local timezone
             * Base schedule: 10:00-18:00 IST
             * availableUntil: 15:00 IST
             * Should clamp the end time to 15:00
             */
            test('Mumbai viewer with availableUntil sees shorter workday', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: parseISO("2024-12-09T15:00:00+05:30")
                        }
                    },
                    date,
                    timezone: "Asia/Kolkata",
                });
                expect(result).toEqual([{ start: "10:00", end: "15:00" }]);
            });

            /**
             * Singapore is 2.5 hours ahead of India (UTC+8 vs UTC+5.5)
             * When it's 10:00 in Mumbai, it's 12:30 in Singapore
             * When it's 18:00 in Mumbai, it's 20:30 in Singapore
             */
            test('Singapore viewer sees shifted workday', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([{ start: "12:30", end: "20:30" }]);
            });

            /**
             * Testing cross-timezone availableFrom constraint
             * Base schedule in IST: 10:00-18:00
             * availableFrom: 14:00 SGT (11:30 IST)
             * Since 14:00 SGT is after the Singapore start time (12:30),
             * it should clamp the start to 14:00 SGT
             */
            test('Singapore viewer with local availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T14:00:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([{ start: "14:00", end: "20:30" }]);
            });

            /**
             * Testing cross-timezone availableUntil constraint
             * Base schedule in IST: 10:00-18:00 (12:30-20:30 SGT)
             * availableUntil: 18:00 SGT (15:30 IST)
             * Should clamp the end time to 18:00 SGT
             */
            test('Singapore viewer with local availableUntil', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: parseISO("2024-12-09T18:00:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore",
                });
                expect(result).toEqual([{ start: "12:30", end: "18:00" }]);
            });
        });
    });

    describe('Brazil-based Professional (Split Morning-Evening)', () => {
        /**
         * Split shift schedule testing timezone conversions across shifts
         * Morning shift: 07:00-11:00
         * Evening shift: 16:00-20:00
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "07:00", end: "11:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "20:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "07:00", end: "11:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "16:00", end: "20:00" }
            ],
            timezone: 'America/Sao_Paulo'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Base case - viewing schedule in local timezone
             * Both shifts should appear exactly as defined
             */
            test('São Paulo viewer sees both shifts', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/Sao_Paulo"
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "16:00", end: "20:00" }
                ]);
            });

            /**
             * Testing availableFrom that affects only the first shift
             * availableFrom: 09:00 BRT
             * First shift should be clamped, second shift unaffected
             */
            test('São Paulo viewer with morning availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T09:00:00-03:00")
                        }
                    },
                    date,
                    timezone: "America/Sao_Paulo"
                });
                expect(result).toEqual([
                    { start: "09:00", end: "11:00" },
                    { start: "16:00", end: "20:00" }
                ]);
            });

            /**
             * Testing availableFrom that affects only the second shift
             * availableFrom: 17:00 BRT
             * First shift should disappear (before availableFrom)
             * Second shift should be clamped
             */
            test('São Paulo viewer with evening availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T17:00:00-03:00")
                        }
                    },
                    date,
                    timezone: "America/Sao_Paulo"
                });
                expect(result).toEqual([
                    { start: "17:00", end: "20:00" }
                ]);
            });

            /**
             * Mexico City is 3 hours behind São Paulo
             * When it's 07:00 in São Paulo, it's 04:00 in Mexico City
             * When it's 20:00 in São Paulo, it's 17:00 in Mexico City
             */
            test('Mexico City viewer sees early morning hours', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/Mexico_City"
                });
                expect(result).toEqual([
                    { start: "04:00", end: "08:00" },
                    { start: "13:00", end: "17:00" }
                ]);
            });

            /**
             * Testing cross-timezone availableFrom
             * Base schedule in BRT: 07:00-11:00, 16:00-20:00
             * In Mexico City: 04:00-08:00, 13:00-17:00
             * availableFrom: 06:00 CDT (09:00 BRT)
             * First shift should be clamped, second shift unaffected
             */
            test('Mexico City viewer with local availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T06:00:00-06:00")
                        }
                    },
                    date,
                    timezone: "America/Mexico_City"
                });
                expect(result).toEqual([
                    { start: "06:00", end: "08:00" },
                    { start: "13:00", end: "17:00" }
                ]);
            });
        });
    });

    describe('South Pacific Professional (Date Line Edge Case)', () => {
        /**
         * Complex schedule spanning midnight and testing date line scenarios
         * Tests timezone conversions near the International Date Line
         * Monday: 23:00-23:59
         * Tuesday: 00:00-07:00, 20:00-23:59
         * Wednesday: 00:00-07:00
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "23:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "07:00" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "20:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "00:00", end: "07:00" }
            ],
            timezone: 'Pacific/Fiji'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Testing availableFrom near midnight in Fiji
             * Base schedule Monday: 23:00-23:59
             * availableFrom: 23:30 FJT
             * Should clamp the start time to 23:30
             */
            test('Fiji viewer with late night availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T23:30:00+12:00")
                        }
                    },
                    date,
                    timezone: "Pacific/Fiji"
                });
                expect(result).toEqual([{ start: "23:30", end: "23:59" }]);
            });

            /**
             * Testing cross date-line scenario with availableFrom
             * Fiji's Monday 23:00-23:59 becomes 22:00-22:59 in Solomon Islands
             * availableFrom: 22:30 SBT
             * Should show two segments: 22:30-22:59 and 23:00-23:59
             */
            test('Solomon Islands viewer with late night availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T22:30:00+11:00")
                        }
                    },
                    date,
                    timezone: "Pacific/Guadalcanal"
                });
                expect(result).toEqual([
                    { start: "22:30", end: "22:59" },
                    { start: "23:00", end: "23:59" }
                ]);
            });
        });
    });

    describe('European Professional (DST and Split Shifts)', () => {
        /**
         * Complex schedule with split shifts testing DST handling
         * Morning shift starts very early: 05:30-09:30
         * Afternoon has micro-shifts: 14:00-15:30, 16:00-17:30
         * Evening shift crosses midnight: 22:00-02:00
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "05:30", end: "09:30" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "14:00", end: "15:30" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "17:30" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "22:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "02:00" }
            ],
            timezone: 'Europe/Paris'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Testing availableFrom that splits a micro-shift
             * Base afternoon shifts: 14:00-15:30 and 16:00-17:30
             * availableFrom at 14:45 should:
             * - Clamp first shift to 14:45-15:30
             * - Keep second shift intact
             */
            test('Paris viewer with mid-shift availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T14:45:00+01:00")
                        }
                    },
                    date,
                    timezone: "Europe/Paris"
                });
                expect(result).toEqual([
                    { start: "14:45", end: "15:30" },
                    { start: "16:00", end: "17:30" },
                    { start: "22:00", end: "23:59" }
                ]);
            });

            /**
             * Testing both availableFrom and availableUntil affecting multiple shifts
             * Base schedule has multiple micro-shifts
             * availableFrom: 14:30, availableUntil: 16:45
             * Should affect parts of two different shifts
             */
            test('Paris viewer with constraints spanning shifts', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T14:30:00+01:00"),
                            until: parseISO("2024-12-09T16:45:00+01:00")
                        }
                    },
                    date,
                    timezone: "Europe/Paris"
                });
                expect(result).toEqual([
                    { start: "14:30", end: "15:30" },
                    { start: "16:00", end: "16:45" }
                ]);
            });

            /**
             * Complex cross-timezone case
             * Converting Paris time to Tokyo
             * Paris 14:00-17:30 becomes Tokyo 22:00-01:30 next day
             * Only the parts that fall within the current day should be shown
             */
            test('Tokyo viewer sees partial schedule due to day boundary', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T22:30:00+09:00")
                        }
                    },
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toEqual([
                    { start: "22:30", end: "23:30" }
                ]);
            });
        });
    });

    describe('Global Remote Team (Complex Timezone Interactions)', () => {
        /**
         * Schedule designed to test complex timezone interactions
         * Multiple short slots around UTC day boundaries
         * Tests both east and west of UTC scenarios
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "00:00", end: "01:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "23:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "01:00" }
            ],
            timezone: 'Europe/London'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Testing Auckland (UTC+13) viewing schedule from London (UTC+0)
             * London's Monday 00:00-01:00 is Auckland's Monday 13:00-14:00
             * London's Monday 23:00-23:59 is Auckland's Tuesday 12:00-12:59
             * Only the first slot should be visible as it's the only one on Monday
             */
            test('Auckland viewer sees only first slot', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T13:30:00+13:00")
                        }
                    },
                    date,
                    timezone: "Pacific/Auckland"
                });
                expect(result).toEqual([
                    { start: "13:30", end: "14:00" }
                ]);
            });
        });
    });

    describe('24/7 Support Team (Continuous Coverage)', () => {
        /**
         * Schedule representing true 24/7 coverage with three 8-hour shifts
         * Each day has three shifts:
         * - Night shift: 00:00-08:00
         * - Day shift: 08:00-16:00
         * - Evening shift: 16:00-23:59
         * The function maintains shift boundaries rather than merging them
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                // Monday shifts
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "00:00", end: "08:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "08:00", end: "16:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "23:59" },
                // Tuesday shifts (for cross-day boundary testing)
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "08:00" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "08:00", end: "16:00" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "16:00", end: "23:59" }
            ],
            timezone: 'Asia/Singapore'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Base case - viewing in local timezone
             * Should see all three shifts for the day
             * Each shift boundary is preserved
             */
            test('Singapore viewer sees all shifts', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([
                    { start: "00:00", end: "08:00" },
                    { start: "08:00", end: "16:00" },
                    { start: "16:00", end: "23:59" }
                ]);
            });

            /**
             * Testing availableFrom constraint
             * When availableFrom falls within a shift (10:30), that shift is clipped
             * Later shifts remain intact
             */
            test('Singapore viewer with mid-morning availableFrom', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T10:30:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([
                    { start: "10:30", end: "16:00" },
                    { start: "16:00", end: "23:59" }
                ]);
            });

            /**
             * Testing availableUntil constraint
             * When availableUntil falls within a shift (16:30), that shift is clipped
             * Earlier shifts remain intact
             */
            test('Singapore viewer with afternoon availableUntil', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            until: parseISO("2024-12-09T16:30:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([
                    { start: "00:00", end: "08:00" },
                    { start: "08:00", end: "16:00" },
                    { start: "16:00", end: "16:30" }
                ]);
            });

            /**
             * Testing both constraints within business hours
             * Both start and end shifts should be clipped
             * Middle shifts (if any) remain intact
             */
            test('Singapore viewer with mid-day constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T10:30:00+08:00"),
                            until: parseISO("2024-12-09T16:30:00+08:00")
                        }
                    },
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([
                    { start: "10:30", end: "16:00" },
                    { start: "16:00", end: "16:30" }
                ]);
            });

            /**
             * Cross-timezone test with West Coast USA
             * Testing how shift boundaries appear in a very different timezone
             * Singapore is 16 hours ahead of Los Angeles
             */
            test('San Francisco viewer sees shifted schedule', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toEqual([
                    { start: "00:00", end: "07:59" },
                    { start: "08:00", end: "16:00" },
                    { start: "16:00", end: "23:59" }
                ]);
            });

            /**
             * Testing constraints in a very different timezone
             * Availability window in San Francisco local time
             * Constraints should be applied after timezone conversion
             */
            test('San Francisco viewer with local time constraints', () => {
                const result = getAvailabilityWindow({
                    weeklySchedule: {
                        ...weeklySchedule,
                        options: {
                            from: parseISO("2024-12-09T09:00:00-08:00"),
                            until: parseISO("2024-12-09T17:00:00-08:00")
                        }
                    },
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toEqual([
                    { start: "09:00", end: "16:00" },
                    { start: "16:00", end: "17:00" }
                ]);
            });
        });
    });
});