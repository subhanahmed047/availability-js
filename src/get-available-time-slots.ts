import { AvailabilityParams, getAvailabilityWindow } from './get-availability-window';
import { TimeRange, TimeSlot } from '../types';
import { dateToTimeString, timeStringToDate } from './utils';
import { addMinutes, isBefore } from 'date-fns';

export interface GetTimeSlotsParams extends AvailabilityParams {
    slotDurationMinutes: number; // The duration of each time slot in minutes
}

/**
 * Checks if a given time slot falls within any of the provided availability windows.
 * 
 * @param slot - The time slot to check.
 * @param availabilityWindows - An array of available time ranges.
 * @returns True if the slot is within any availability window, false otherwise.
 */
const isSlotWithinAvailableWindows = (
    slot: TimeRange,
    availabilityWindows: TimeRange[]
): boolean => {
    const slotStart = timeStringToDate(slot.start);
    const slotEnd = timeStringToDate(slot.end);

    return availabilityWindows.some(window => {
        const windowStart = timeStringToDate(window.start);
        const windowEnd = timeStringToDate(window.end);

        // Check if the slot is entirely within the window
        return (
            !isBefore(slotStart, windowStart) &&
            !isBefore(windowEnd, slotEnd)
        );
    });
};

/**
 * Generates available time slots based on the provided availability parameters.
 * 
 * @param params - Parameters including availability, slot duration, and other options.
 * @returns An array of time slots with their availability status, or null if no availability windows are provided.
 */
export const getAvailableTimeslots = (params: GetTimeSlotsParams): TimeSlot[] | null => {
    const availabilityWindows = getAvailabilityWindow(params);

    // If there are no availability windows, return null
    if (!availabilityWindows) {
        return null;
    }

    // Precompute and sort availability windows for efficient access
    const parsedWindows = availabilityWindows
        .map(w => ({
            start: timeStringToDate(w.start),
            end: timeStringToDate(w.end)
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const earliestStart = parsedWindows[0].start; // The earliest available start time
    const latestEnd = parsedWindows[parsedWindows.length - 1].end; // The latest available end time

    const slots: TimeSlot[] = []; // Array to store generated time slots
    let currentTime = earliestStart;

    // Generate slots within the available time range
    while (currentTime < latestEnd) {
        const slotEnd = addMinutes(currentTime, params.slotDurationMinutes); // Calculate the end time of the slot

        const timeSlot: TimeSlot = {
            start: dateToTimeString(currentTime),
            end: dateToTimeString(slotEnd > latestEnd ? latestEnd : slotEnd), // Clamp the slot end time to latestEnd if necessary
            isAvailable: false // Default availability is false
        };

        // Check if the current time slot falls within any availability window
        timeSlot.isAvailable = isSlotWithinAvailableWindows(
            { start: timeSlot.start, end: timeSlot.end },
            availabilityWindows
        );

        slots.push(timeSlot); // Add the generated time slot to the list

        // Break if the slot end time reaches or exceeds the latest available end time
        if (slotEnd >= latestEnd) break;

        currentTime = addMinutes(currentTime, params.slotDurationMinutes); // Move to the next slot
    }

    return slots; // Return the list of generated time slots
};
``