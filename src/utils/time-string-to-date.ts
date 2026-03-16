import { parse } from "date-fns";
import { TimeString } from "../types";

export const timeStringToDate = (timeString: TimeString): Date => {
    // Create a date object for today with the given time
    const today = new Date();
    return parse(timeString, 'HH:mm', today);
};