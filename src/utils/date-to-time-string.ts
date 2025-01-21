import { format } from "date-fns";
import { TimeString } from "../../types";

export const dateToTimeString = (date: Date): TimeString => {
    return format(date, 'HH:mm') as TimeString;
};