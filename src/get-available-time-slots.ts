import { AvailabilityParams, getAvailabilityWindow } from './get-availability-window';
import { TimeRange, TimeSlot } from '../types';
import { dateToTimeString, timeStringToDate } from './utils';
import { addMinutes, isBefore } from 'date-fns';

export interface GetTimeSlotsParams extends AvailabilityParams {
    slotDurationMinutes: number;
}

const isSlotWithinAvailableWindows = (
    slot: TimeRange,
    availabilityWindows: TimeRange[]
): boolean => {
    const slotStart = timeStringToDate(slot.start);
    const slotEnd = timeStringToDate(slot.end);

    return availabilityWindows.some(window => {
        const windowStart = timeStringToDate(window.start);
        const windowEnd = timeStringToDate(window.end);

        return (
            !isBefore(slotStart, windowStart) &&
            !isBefore(windowEnd, slotEnd)
        );
    });
};

export const getAvailableTimeslots = (params: GetTimeSlotsParams): TimeSlot[] | null => {
    const availabilityWindows = getAvailabilityWindow(params);

    if (!availabilityWindows) {
        return null;
    }

    // Find the earliest start and latest end times
    const startTimes = availabilityWindows.map(w => timeStringToDate(w.start));
    const endTimes = availabilityWindows.map(w => timeStringToDate(w.end));

    const earliestStart = startTimes.reduce((a, b) => isBefore(a, b) ? a : b);
    const latestEnd = endTimes.reduce((a, b) => isBefore(a, b) ? b : a);

    const slots: TimeSlot[] = [];
    let currentTime = earliestStart;

    while (isBefore(currentTime, latestEnd)) {
        let slotEnd = addMinutes(currentTime, params.slotDurationMinutes);

        // If this slot would end after latestEnd, clamp it
        if (!isBefore(slotEnd, latestEnd)) {
            slotEnd = latestEnd;
        }

        const timeSlot: TimeSlot = {
            start: dateToTimeString(currentTime),
            end: dateToTimeString(slotEnd),
            isAvailable: false
        };

        // Check if this slot falls within any of the available windows
        timeSlot.isAvailable = isSlotWithinAvailableWindows(
            timeSlot,
            availabilityWindows
        );

        slots.push(timeSlot);

        // Stop if we've reached the last slot
        if (dateToTimeString(slotEnd) === dateToTimeString(latestEnd)) break;
        currentTime = addMinutes(currentTime, params.slotDurationMinutes);
    }

    return slots;
};