import { AvailabilityParams, getAvailabilityWindow } from './get-availability-window';
import { TimeRange, TimeSlot, Booking } from './types';
import { dateToTimeString, timeStringToDate } from './utils';
import { addMinutes, isBefore, parseISO, fromZonedTime, toZonedTime } from './utils/date-helpers';

export interface GetTimeSlotsParams extends AvailabilityParams {
    slotDurationMinutes: number;
    bookings?: Booking[];
}

/**
 * Checks if a given time slot overlaps with any bookings.
 * 
 * @param slot - The time slot to check in local timezone.
 * @param date - The date for which we're checking availability.
 * @param bookings - An array of UTC ISO string-based bookings.
 * @param timezone - The target timezone for comparison.
 * @returns True if the slot overlaps with any booking, false otherwise.
 */
const isSlotOverlappingBookings = (
    slot: TimeRange,
    date: Date,
    bookings: Booking[] = [],
    timezone: string
): boolean => {
    // Create full datetime by combining the date with the time slot
    const slotStartTime = timeStringToDate(slot.start);
    const slotEndTime = timeStringToDate(slot.end);

    // Create full date-time strings in the target timezone
    const localSlotStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        slotStartTime.getHours(),
        slotStartTime.getMinutes()
    );
    const localSlotEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        slotEndTime.getHours(),
        slotEndTime.getMinutes()
    );

    // Convert local slot times to UTC for comparison
    const slotStartUTC = fromZonedTime(localSlotStart, timezone);
    const slotEndUTC = fromZonedTime(localSlotEnd, timezone);

    return bookings.some(booking => {
        const bookingStartUTC = parseISO(booking.startTime);
        const bookingEndUTC = parseISO(booking.endTime);

        // Check for any overlap between the slot and booking
        const isOverlapping = (
            // Slot starts during booking
            (slotStartUTC >= bookingStartUTC && slotStartUTC < bookingEndUTC) ||
            // Slot ends during booking
            (slotEndUTC > bookingStartUTC && slotEndUTC <= bookingEndUTC) ||
            // Slot contains booking
            (slotStartUTC <= bookingStartUTC && slotEndUTC >= bookingEndUTC) ||
            // Booking contains slot
            (bookingStartUTC <= slotStartUTC && bookingEndUTC >= slotEndUTC)
        );

        return isOverlapping;
    });
};

/**
 * Checks if a given time slot falls within any of the provided availability windows.
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

        return (
            !isBefore(slotStart, windowStart) &&
            !isBefore(windowEnd, slotEnd)
        );
    });
};

/**
 * Generates available time slots based on the provided availability parameters.
 */
export const getAvailableTimeslots = (params: GetTimeSlotsParams): TimeSlot[] | null => {
    const { bookings = [], timezone, date } = params;
    const availabilityWindows = getAvailabilityWindow(params);

    if (!availabilityWindows) {
        return null;
    }

    const parsedWindows = availabilityWindows
        .map(w => ({
            start: timeStringToDate(w.start),
            end: timeStringToDate(w.end)
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const earliestStart = parsedWindows[0].start;
    const latestEnd = parsedWindows[parsedWindows.length - 1].end;

    const slots: TimeSlot[] = [];
    let currentTime = earliestStart;

    while (currentTime < latestEnd) {
        const slotEnd = addMinutes(currentTime, params.slotDurationMinutes);
        const adjustedSlotEnd = slotEnd > latestEnd ? latestEnd : slotEnd;

        const timeSlot: TimeSlot = {
            start: dateToTimeString(currentTime),
            end: dateToTimeString(adjustedSlotEnd),
            isAvailable: false
        };

        // First check if the slot is within availability windows
        timeSlot.isAvailable = isSlotWithinAvailableWindows(
            { start: timeSlot.start, end: timeSlot.end },
            availabilityWindows
        );

        // If the slot is available, check if it's not booked
        if (timeSlot.isAvailable) {
            timeSlot.isAvailable = !isSlotOverlappingBookings(
                { start: timeSlot.start, end: timeSlot.end },
                date,
                bookings,
                timezone
            );
        }

        slots.push(timeSlot);

        if (slotEnd >= latestEnd) break;
        currentTime = addMinutes(currentTime, params.slotDurationMinutes);
    }

    return slots;
};