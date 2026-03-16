import { TimeString } from "../types";

export const dateToTimeString = (date: Date): TimeString => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}` as TimeString;
};