import { describe, test, expect } from 'vitest';
import { DAY_OF_WEEK, Booking, TimeSlot, WeeklySchedule } from '../types';
import { getAvailableTimeslots } from '../get-available-time-slots';
import { parseISO } from '../utils/date-helpers';

describe('getAvailableTimeslots with Bookings', () => {
    describe('Indian Professional (Standard Work Hours) with Bookings', () => {
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

            test('Mumbai viewer sees standard workday with lunch hour booking', () => {
                const bookings: Booking[] = [{
                    startTime: "2024-12-09T07:30:00Z", // 13:00 IST
                    endTime: "2024-12-09T08:30:00Z"    // 14:00 IST
                }];

                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Kolkata",
                    slotDurationMinutes: 30,
                    bookings
                });

                const expectedSlots: TimeSlot[] = [
                    // Morning slots (available)
                    { start: "10:00", end: "10:30", isAvailable: true },
                    { start: "10:30", end: "11:00", isAvailable: true },
                    { start: "11:00", end: "11:30", isAvailable: true },
                    { start: "11:30", end: "12:00", isAvailable: true },
                    { start: "12:00", end: "12:30", isAvailable: true },
                    { start: "12:30", end: "13:00", isAvailable: true },

                    // Lunch hour slots (unavailable)
                    { start: "13:00", end: "13:30", isAvailable: false },
                    { start: "13:30", end: "14:00", isAvailable: false },

                    // Afternoon slots (available)
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "18:00", isAvailable: true }
                ];

                expect(result).toEqual(expectedSlots);
            });

            test('Singapore viewer sees shifted workday with bookings', () => {
                const bookings: Booking[] = [{
                    startTime: "2024-12-09T10:00:00Z", // 18:00 SGT
                    endTime: "2024-12-09T11:00:00Z"    // 19:00 SGT
                }];

                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Asia/Singapore",
                    slotDurationMinutes: 30,
                    bookings
                });

                const expectedSlots: TimeSlot[] = [
                    // Early slots (available)
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

                    // Booked hour (unavailable)
                    { start: "18:00", end: "18:30", isAvailable: false },
                    { start: "18:30", end: "19:00", isAvailable: false },

                    // Later slots (available)
                    { start: "19:00", end: "19:30", isAvailable: true },
                    { start: "19:30", end: "20:00", isAvailable: true },
                    { start: "20:00", end: "20:30", isAvailable: true }
                ];

                expect(result).toEqual(expectedSlots);
            });
        });
    });

    describe('Brazil-based Professional (Split Morning-Evening) with Bookings', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "07:00", end: "11:00" },
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "16:00", end: "20:00" }
            ],
            timezone: 'America/Sao_Paulo'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('São Paulo viewer with bookings spanning shift break', () => {
                const bookings: Booking[] = [{
                    startTime: "2024-12-09T13:30:00Z", // 10:30 BRT
                    endTime: "2024-12-09T19:30:00Z"    // 16:30 BRT
                }];

                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "America/Sao_Paulo",
                    slotDurationMinutes: 30,
                    bookings
                });

                const expectedSlots: TimeSlot[] = [
                    // Early morning slots (available)
                    { start: "07:00", end: "07:30", isAvailable: true },
                    { start: "07:30", end: "08:00", isAvailable: true },
                    { start: "08:00", end: "08:30", isAvailable: true },
                    { start: "08:30", end: "09:00", isAvailable: true },
                    { start: "09:00", end: "09:30", isAvailable: true },
                    { start: "09:30", end: "10:00", isAvailable: true },
                    { start: "10:00", end: "10:30", isAvailable: true },

                    // Booked slots (unavailable)
                    { start: "10:30", end: "11:00", isAvailable: false },
                    { start: "11:00", end: "11:30", isAvailable: false },
                    { start: "11:30", end: "12:00", isAvailable: false },
                    { start: "12:00", end: "12:30", isAvailable: false },
                    { start: "12:30", end: "13:00", isAvailable: false },
                    { start: "13:00", end: "13:30", isAvailable: false },
                    { start: "13:30", end: "14:00", isAvailable: false },
                    { start: "14:00", end: "14:30", isAvailable: false },
                    { start: "14:30", end: "15:00", isAvailable: false },
                    { start: "15:00", end: "15:30", isAvailable: false },
                    { start: "15:30", end: "16:00", isAvailable: false },
                    { start: "16:00", end: "16:30", isAvailable: false },

                    // Evening slots after booking (available)
                    { start: "16:30", end: "17:00", isAvailable: true },
                    { start: "17:00", end: "17:30", isAvailable: true },
                    { start: "17:30", end: "18:00", isAvailable: true },
                    { start: "18:00", end: "18:30", isAvailable: true },
                    { start: "18:30", end: "19:00", isAvailable: true },
                    { start: "19:00", end: "19:30", isAvailable: true },
                    { start: "19:30", end: "20:00", isAvailable: true }
                ];

                expect(result).toEqual(expectedSlots);
            });
        });
    });

    describe('London Support Team (Extended Hours) with Bookings', () => {
        const weeklySchedule: WeeklySchedule = {
            schedule: [
                { dayOfWeek: DAY_OF_WEEK.Monday, start: "07:00", end: "17:00" }
            ],
            timezone: 'Europe/London'
        };

        describe('December 9th (Monday)', () => {
            const date = parseISO("2024-12-09");

            test('handles overlapping bookings', () => {
                const bookings: Booking[] = [
                    {
                        startTime: "2024-12-09T09:00:00Z", // 09:00 GMT
                        endTime: "2024-12-09T11:00:00Z"    // 11:00 GMT
                    },
                    {
                        startTime: "2024-12-09T10:00:00Z", // 10:00 GMT
                        endTime: "2024-12-09T12:00:00Z"    // 12:00 GMT
                    },
                    {
                        startTime: "2024-12-09T11:00:00Z", // 11:00 GMT
                        endTime: "2024-12-09T13:00:00Z"    // 13:00 GMT
                    }
                ];

                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Europe/London",
                    slotDurationMinutes: 30,
                    bookings
                });

                const expectedSlots: TimeSlot[] = [
                    // Early morning slots (available)
                    { start: "07:00", end: "07:30", isAvailable: true },
                    { start: "07:30", end: "08:00", isAvailable: true },
                    { start: "08:00", end: "08:30", isAvailable: true },
                    { start: "08:30", end: "09:00", isAvailable: true },

                    // Overlapping booked slots (unavailable)
                    { start: "09:00", end: "09:30", isAvailable: false },
                    { start: "09:30", end: "10:00", isAvailable: false },
                    { start: "10:00", end: "10:30", isAvailable: false },
                    { start: "10:30", end: "11:00", isAvailable: false },
                    { start: "11:00", end: "11:30", isAvailable: false },
                    { start: "11:30", end: "12:00", isAvailable: false },
                    { start: "12:00", end: "12:30", isAvailable: false },
                    { start: "12:30", end: "13:00", isAvailable: false },

                    // Afternoon slots (available)
                    { start: "13:00", end: "13:30", isAvailable: true },
                    { start: "13:30", end: "14:00", isAvailable: true },
                    { start: "14:00", end: "14:30", isAvailable: true },
                    { start: "14:30", end: "15:00", isAvailable: true },
                    { start: "15:00", end: "15:30", isAvailable: true },
                    { start: "15:30", end: "16:00", isAvailable: true },
                    { start: "16:00", end: "16:30", isAvailable: true },
                    { start: "16:30", end: "17:00", isAvailable: true }
                ];

                expect(result).toEqual(expectedSlots);
            });

            test('handles bookings near end of day', () => {
                const bookings: Booking[] = [{
                    startTime: "2024-12-09T16:00:00Z", // 16:00 GMT
                    endTime: "2024-12-09T17:00:00Z"    // 17:00 GMT
                }];

                const result = getAvailableTimeslots({
                    weeklySchedule,
                    date,
                    timezone: "Europe/London",
                    slotDurationMinutes: 30,
                    bookings
                });

                const expectedSlots: TimeSlot[] = [
                    // Early and mid-day slots (available)
                    { start: "07:00", end: "07:30", isAvailable: true },
                    { start: "07:30", end: "08:00", isAvailable: true },
                    { start: "08:00", end: "08:30", isAvailable: true },
                    { start: "08:30", end: "09:00", isAvailable: true },
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

                    // Last hour slots (booked)
                    { start: "16:00", end: "16:30", isAvailable: false },
                    { start: "16:30", end: "17:00", isAvailable: false }
                ];

                expect(result).toEqual(expectedSlots);
            });
        });
    });
});