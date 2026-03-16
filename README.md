# availability-js

Client-side calendar availability with **weekly schedule**, **date overrides**, and **bookings** — small, timezone-aware. No server required for computing available slots.

[![npm version](https://img.shields.io/npm/v/availability-js.svg)](https://www.npmjs.com/package/availability-js)

- **Docs**: [`https://availability-js.vercel.app/docs`](https://availability-js.vercel.app/docs)
- **npm**: [`https://www.npmjs.com/package/availability-js`](https://www.npmjs.com/package/availability-js)

## Install

```bash
npm install availability-js
# or
yarn add availability-js
pnpm add availability-js
```

## Usage

### 1. Availability window for a day

Get the available time ranges for a given date (respects weekly schedule, optional override, and optional global `from`/`until` bounds).

```ts
import {
  getAvailabilityWindow,
  DAY_OF_WEEK,
  type WeeklySchedule,
  type DayOverride,
} from 'availability-js';

const weeklySchedule: WeeklySchedule = {
  schedule: [
    { dayOfWeek: DAY_OF_WEEK.Monday, start: '09:00', end: '17:00' },
    { dayOfWeek: DAY_OF_WEEK.Wednesday, start: '09:00', end: '17:00' },
  ],
  timezone: 'Europe/London',
};

const date = new Date('2024-12-09'); // Monday

const windows = getAvailabilityWindow({
  weeklySchedule,
  date,
  timezone: 'Europe/London',
});

// → [{ start: '09:00', end: '17:00' }]
```

With a **day override** (e.g. split shift or day off):

```ts
const override: DayOverride = {
  date: new Date('2024-12-09'),
  isAvailable: true,
  timeRanges: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '17:00' },
  ],
};

const windows = getAvailabilityWindow({
  weeklySchedule,
  date,
  timezone: 'Europe/London',
  override,
});
// → [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }]
```

Set `isAvailable: false` and `timeRanges: null` for a full-day unavailability.

### 2. Available time slots (with bookings)

Get discrete slots for a day, optionally excluding existing bookings. Ideal for a booking UI.

```ts
import {
  getAvailableTimeslots,
  DAY_OF_WEEK,
  type WeeklySchedule,
  type Booking,
} from 'availability-js';

const weeklySchedule: WeeklySchedule = {
  schedule: [
    { dayOfWeek: DAY_OF_WEEK.Monday, start: '10:00', end: '18:00' },
  ],
  timezone: 'Asia/Kolkata',
};

const date = new Date('2024-12-09');
const bookings: Booking[] = [
  {
    startTime: '2024-12-09T07:30:00Z', // 13:00 IST
    endTime: '2024-12-09T08:30:00Z',   // 14:00 IST
  },
];

const slots = getAvailableTimeslots({
  weeklySchedule,
  date,
  timezone: 'Asia/Kolkata',
  slotDurationMinutes: 30,
  bookings,
});

// Each slot has { start, end, isAvailable } in local time (e.g. '10:00', '10:30').
// Slots overlapping the booking are isAvailable: false.
```

You can pass the same `override` as in `getAvailabilityWindow` to apply date overrides when computing slots.

## API

- **`getAvailabilityWindow(params)`**  
  Returns `TimeRange[] | null` for the given date (in the requested timezone), from weekly schedule + optional override + optional `from`/`until` on `WeeklySchedule.options`.

- **`getAvailableTimeslots(params)`**  
  Returns `TimeSlot[] | null` for the given date. Params extend availability params with `slotDurationMinutes` and optional `bookings` (UTC ISO strings). Each slot has `start`, `end`, and `isAvailable`.

**Types:** `DAY_OF_WEEK`, `WeeklySchedule`, `DailySchedule`, `DayOverride`, `TimeRange`, `TimeSlot`, `Booking`, `AvailabilityParams`, `GetTimeSlotsParams`.

## Timezone behaviour

- Schedules are defined in a **schedule timezone** (`weeklySchedule.timezone`).
- You ask for availability in a **viewer timezone** (`timezone` in params). Slots and windows are returned in that viewer timezone (e.g. `"09:00"`, `"17:00"`).
- Bookings are in **UTC** (`startTime` / `endTime` as ISO strings). Overlaps are computed correctly across timezones.

## Peer / dependencies

Uses `date-fns` and `date-fns-tz` for timezone and date handling. They are declared as dependencies so they are installed with the package.

## Docs

- **Docs** — `npm run docs` (Fumadocs at [http://localhost:3000/docs](http://localhost:3000/docs))

## License

MIT
