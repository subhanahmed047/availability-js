import { describe, test, expect } from 'vitest';
import { parseISO } from 'date-fns';
import { DAY_OF_WEEK, WeeklySchedule } from '../../types';
import { getAvailability } from '../get-availability';

describe('Availability Windows', () => {
    describe('Tokyo-based Professional (Regular Office Hours)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "09:00", end: "17:00" },
                { dayOfWeek: DAY_OF_WEEK.Friday, start: "09:00", end: "15:00" }
            ],
            timezone: 'Asia/Tokyo'
        }

        describe('December 8th (Sunday)', () => {
            const date = parseISO("2024-12-08");

            test('Tokyo viewer sees no availability', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toBeNull();
            });

            test('Sydney viewer sees no availability', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney"
                });
                expect(result).toBeNull();
            });

            test('New York viewer sees start of Tokyo Monday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York"
                });
                expect(result).toEqual([{ start: "19:00", end: "23:59" }]);
            });

            test('Los Angeles viewer sees start of Tokyo Monday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toEqual([{ start: "16:00", end: "23:59" }]);
            });
        });

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Tokyo viewer sees full Monday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toEqual([{ start: "09:00", end: "17:00" }]);
            });

            test('Sydney viewer sees shifted Monday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney"
                });
                expect(result).toEqual([{ start: "11:00", end: "19:00" }]);
            });

            test('New York viewer sees end of Tokyo Monday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York"
                });
                expect(result).toEqual([{ start: "00:00", end: "03:00" }]);
            });

            test('Los Angeles viewer sees no availability', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toBeNull();
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = parseISO("2024-12-10");

            test('Tokyo viewer sees no availability', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toBeNull();
            });

            test('New York viewer sees start of Tokyo Wednesday workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York"
                });
                expect(result).toEqual([{ start: "19:00", end: "23:59" }]);
            });
        });
    });

    describe('New York-based Professional (Late Shifts)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "16:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "16:00", end: "23:59" }
            ],
            timezone: 'America/New_York'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Tokyo viewer sees no availability on their Monday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toBeNull();
            });

            test('New York viewer sees full Monday late shift', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/New_York"
                });
                expect(result).toEqual([{ start: "16:00", end: "23:59" }]);
            });

            test('Los Angeles viewer sees NY shift 3 hours earlier', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toEqual([{ start: "13:00", end: "20:59" }]);
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = parseISO("2024-12-10");

            test('Tokyo viewer sees NY Tuesday late shift in early Wednesday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toEqual([{ start: "06:00", end: "13:59" }]);
            });
        });
    });

    describe('London-based Professional (Split Shifts)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "00:00", end: "03:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "14:00", end: "22:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "00:00", end: "03:00" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "14:00", end: "22:00" }
            ],
            timezone: 'Europe/London'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('London viewer sees both Monday shifts', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Europe/London"
                });
                expect(result).toEqual([
                    { start: "00:00", end: "03:00" },
                    { start: "14:00", end: "22:00" }
                ]);
            });

            test('Sydney viewer sees only Monday afternoon shift', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Australia/Sydney"
                });
                expect(result).toEqual([{ start: "11:00", end: "14:00" }]);
            });

            test('Dubai viewer sees both London Monday shifts adjusted', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Dubai"
                });
                expect(result).toEqual([
                    { start: "04:00", end: "07:00" },
                    { start: "18:00", end: "23:59" }
                ]);
            });
        });
    });

    describe('Auckland-based Professional (Date Line Crossing)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "22:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "03:00" },
                { dayOfWeek: DAY_OF_WEEK.Thursday, start: "08:00", end: "12:00" },
                { dayOfWeek: DAY_OF_WEEK.Thursday, start: "14:00", end: "22:00" }
            ],
            timezone: 'Pacific/Auckland'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Auckland viewer sees Monday late shift', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Auckland"
                });
                expect(result).toEqual([{ start: "22:00", end: "23:59" }]);
            });

            test('Tokyo viewer sees both Auckland shifts', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toEqual([
                    { start: "18:00", end: "19:59" },
                    { start: "20:00", end: "23:00" }
                ]);
            });

            test('Los Angeles viewer sees both Auckland shifts', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Los_Angeles"
                });
                expect(result).toEqual([
                    { start: "01:00", end: "02:59" },
                    { start: "03:00", end: "06:00" }
                ]);
            });
        });

        describe('December 10th (Tuesday)', () => {
            const date = parseISO("2024-12-10");

            test('Auckland viewer sees Tuesday early morning hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Auckland"
                });
                expect(result).toEqual([{ start: "00:00", end: "03:00" }]);
            });

            test('Tokyo viewer sees no availability', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Tokyo"
                });
                expect(result).toBeNull();
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

            /**
             * Base case - viewing schedule in local timezone
             * No timezone conversion needed, times should appear exactly as defined
             */
            test('Mumbai viewer sees standard workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Kolkata"
                });
                expect(result).toEqual([{ start: "10:00", end: "18:00" }]);
            });

            /**
             * Singapore is 2.5 hours ahead of India (UTC+8 vs UTC+5.5)
             * When it's 10:00 in Mumbai, it's 12:30 in Singapore
             * When it's 18:00 in Mumbai, it's 20:30 in Singapore
             */
            test('Singapore viewer sees shifted workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Singapore"
                });
                expect(result).toEqual([{ start: "12:30", end: "20:30" }]);
            });

            /**
             * Moscow is 2.5 hours behind India (UTC+3 vs UTC+5.5)
             * When it's 10:00 in Mumbai, it's 07:30 in Moscow
             * When it's 18:00 in Mumbai, it's 15:30 in Moscow
             */
            test('Moscow viewer sees afternoon and evening hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Europe/Moscow"
                });
                expect(result).toEqual([{ start: "07:30", end: "15:30" }]);
            });
        });
    });

    describe('Brazil-based Professional (Split Morning-Evening)', () => {
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

            test('São Paulo viewer sees both shifts', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Sao_Paulo"
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "16:00", end: "20:00" }
                ]);
            });

            test('Buenos Aires viewer sees shifted hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Argentina/Buenos_Aires"
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "16:00", end: "20:00" }
                ]);
            });

            test('Mexico City viewer sees early morning hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Mexico_City"
                });
                expect(result).toEqual([
                    { start: "04:00", end: "08:00" },
                    { start: "13:00", end: "17:00" }
                ]);
            });
        });
    });

    describe('Middle East Professional (Split for Prayer Times)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "08:00", end: "12:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "14:00", end: "16:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "17:00", end: "21:00" }
            ],
            timezone: 'Asia/Dubai'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Dubai viewer sees all three shifts', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Dubai"
                });
                expect(result).toEqual([
                    { start: "08:00", end: "12:00" },
                    { start: "14:00", end: "16:00" },
                    { start: "17:00", end: "21:00" }
                ]);
            });

            test('Istanbul viewer sees shifted hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Europe/Istanbul"
                });
                expect(result).toEqual([
                    { start: "07:00", end: "11:00" },
                    { start: "13:00", end: "15:00" },
                    { start: "16:00", end: "20:00" }
                ]);
            });

            test('Bangkok viewer sees late morning to night hours', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Bangkok"
                });
                expect(result).toEqual([
                    { start: "11:00", end: "15:00" },
                    { start: "17:00", end: "19:00" },
                    { start: "20:00", end: "23:59" }
                ]);
            });
        });
    });

    describe('Cape Town Professional (Southern Hemisphere)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "08:30", end: "16:30" },
                { dayOfWeek: DAY_OF_WEEK.Wednesday, start: "08:30", end: "16:30" },
                { dayOfWeek: DAY_OF_WEEK.Friday, start: "08:30", end: "13:30" }
            ],
            timezone: 'Africa/Johannesburg'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Cape Town viewer sees standard workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Africa/Johannesburg"
                });
                expect(result).toEqual([{ start: "08:30", end: "16:30" }]);
            });

            test('Cairo viewer sees shifted workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Africa/Cairo"
                });
                expect(result).toEqual([{ start: "08:30", end: "16:30" }]);
            });

            test('Lagos viewer sees shifted workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Africa/Lagos"
                });
                expect(result).toEqual([{ start: "07:30", end: "15:30" }]);
            });
        });
    });

    describe('Hawaii-based Professional (UTC-10)', () => {
        /**
         * Early workday schedule in Hawaii
         * 06:00-14:00 local time
         * Testing extreme western timezone conversions
         */
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "06:00", end: "14:00" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "06:00", end: "14:00" }
            ],
            timezone: 'Pacific/Honolulu'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            /**
             * Base case - no timezone conversion
             * Schedule should appear exactly as defined
             */
            test('Honolulu viewer sees early workday', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Honolulu"
                });
                expect(result).toEqual([{ start: "06:00", end: "14:00" }]);
            });

            /**
             * Anchorage is 1 hour ahead of Hawaii (UTC-9 vs UTC-10)
             * When it's 06:00 in Hawaii, it's 07:00 in Anchorage
             * When it's 14:00 in Hawaii, it's 15:00 in Anchorage
             */
            test('Anchorage viewer sees shifted hours (1 hour ahead)', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "America/Anchorage"
                });
                expect(result).toEqual([{ start: "07:00", end: "15:00" }]);
            });

            /**
             * Seoul is 19 hours ahead of Hawaii
             * Hawaii's Monday 06:00-14:00 would be Tuesday 01:00-09:00 (The next day) in Seoul
             * Since we're looking at Monday's weeklySchedule, this falls outside our day boundary
             * Therefore, expect null as no hours fall within Monday in Seoul
             */
            test('Seoul viewer sees no hours due to day boundary', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Seoul"
                });
                expect(result).toBeNull();
            });
        });
    });

    describe('South Pacific Professional (Date Line Edge Case)', () => {
        /**
         * Complex schedule spanning midnight and testing date line scenarios
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
             * Base case - Fiji time (UTC+12)
             * Only the Monday 23:00-23:59 slot is visible
             * Tuesday's slots fall outside our day boundary
             */
            test('Fiji viewer sees late night start', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Fiji"
                });
                expect(result).toEqual([{ start: "23:00", end: "23:59" }]);
            });

            /**
             * Samoa is 1 hour ahead of Fiji (UTC+13 vs UTC+12)
             * Fiji's Monday 23:00-23:59 would be Tuesday 00:00-00:59 in Samoa
             * Since we're looking at Monday's schedule and this falls into Tuesday,
             * expect null as no hours fall within Monday in Samoa
             */
            test('Samoa viewer sees no hours due to date line crossing', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Apia"
                });
                expect(result).toBeNull();
            });

            /**
            * Solomon Islands is 1 hour behind Fiji (UTC+11 vs UTC+12)
            * Fiji's Monday 23:00-23:59 becomes two slots in Solomon Islands:
            * 1. 22:00-22:59 
            * 2. 23:00-23:59
            * This happens because the function preserves the full availability window
            * across the timezone conversion
            */
            test('Solomon Islands viewer sees late night hours (1 hour behind)', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Pacific/Guadalcanal"
                });
                expect(result).toEqual([
                    { start: "22:00", end: "22:59" },
                    { start: "23:00", end: "23:59" }
                ]);
            });
        });
    });

    describe('Central Asia Professional (Extended Hours)', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "05:00", end: "09:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "14:00", end: "23:59" },
                { dayOfWeek: DAY_OF_WEEK.Tuesday, start: "00:00", end: "02:00" }
            ],
            timezone: 'Asia/Almaty'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('Almaty viewer sees full schedule', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Almaty"
                });
                expect(result).toEqual([
                    { start: "05:00", end: "09:00" },
                    { start: "14:00", end: "23:59" }
                ]);
            });

            test('Karachi viewer sees shifted schedule (1 hour behind)', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Karachi"
                });
                expect(result).toEqual([
                    { start: "05:00", end: "09:00" },
                    { start: "14:00", end: "23:59" }
                ]);
            });

            test('Dhaka viewer sees late schedule', () => {
                const result = getAvailability({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Dhaka"
                });
                expect(result).toEqual([
                    { start: "06:00", end: "10:00" },
                    { start: "15:00", end: "23:59" }
                ]);
            });
        });
    });
});