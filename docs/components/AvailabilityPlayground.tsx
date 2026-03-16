"use client";

import { useMemo, useState } from 'react';
import {
  DAY_OF_WEEK,
  type WeeklySchedule,
  type DayOverride,
  type Booking,
  getAvailabilityWindow,
  getAvailableTimeslots,
  type TimeSlot,
  type TimeRange,
} from 'availability-js';

type Mode = 'windows' | 'slots';

type PresetKey =
  | 'india_standard'
  | 'tokyo_regular'
  | 'london_support';

interface Preset {
  label: string;
  weeklySchedule: WeeklySchedule;
  defaultTimezone: string;
}

const PRESETS: Record<PresetKey, Preset> = {
  india_standard: {
    label: 'India – Mon/Wed/Fri 10:00–18:00 (Asia/Kolkata)',
    weeklySchedule: {
      schedule: [
        { dayOfWeek: DAY_OF_WEEK.Monday, start: '10:00', end: '18:00' },
        { dayOfWeek: DAY_OF_WEEK.Wednesday, start: '10:00', end: '18:00' },
        { dayOfWeek: DAY_OF_WEEK.Friday, start: '10:00', end: '16:00' },
      ],
      timezone: 'Asia/Kolkata',
    },
    defaultTimezone: 'Asia/Kolkata',
  },
  tokyo_regular: {
    label: 'Tokyo – Mon/Wed/Fri 09:00–17:00 (Asia/Tokyo)',
    weeklySchedule: {
      schedule: [
        { dayOfWeek: DAY_OF_WEEK.Monday, start: '09:00', end: '17:00' },
        { dayOfWeek: DAY_OF_WEEK.Wednesday, start: '09:00', end: '17:00' },
        { dayOfWeek: DAY_OF_WEEK.Friday, start: '09:00', end: '15:00' },
      ],
      timezone: 'Asia/Tokyo',
    },
    defaultTimezone: 'Asia/Tokyo',
  },
  london_support: {
    label: 'London – Mon 07:00–17:00 (Europe/London)',
    weeklySchedule: {
      schedule: [
        { dayOfWeek: DAY_OF_WEEK.Monday, start: '07:00', end: '17:00' },
      ],
      timezone: 'Europe/London',
    },
    defaultTimezone: 'Europe/London',
  },
};

const DEFAULT_DATE_ISO = '2024-12-09';

const DEFAULT_BOOKINGS: Booking[] = [
  {
    startTime: '2024-12-09T07:30:00Z',
    endTime: '2024-12-09T08:30:00Z',
  },
];

const parseDateInput = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatSlotsForDisplay = (slots: TimeSlot[] | null): string => {
  if (!slots) return 'No availability for this date in this viewer timezone.';
  if (slots.length === 0) return 'No slots generated.';

  return slots
    .map(
      (slot) =>
        `${slot.start}–${slot.end}  ${slot.isAvailable ? 'available' : 'unavailable'}`,
    )
    .join('\n');
};

const formatWindowsForDisplay = (windows: TimeRange[] | null): string => {
  if (!windows) return 'No availability for this date in this viewer timezone.';
  if (windows.length === 0) return 'No windows.';

  return windows.map((w) => `${w.start}–${w.end}`).join('\n');
};

export const AvailabilityPlayground = () => {
  const [mode, setMode] = useState<Mode>('slots');
  const [presetKey, setPresetKey] = useState<PresetKey>('india_standard');
  const [viewerTimezone, setViewerTimezone] = useState<string>(
    PRESETS.india_standard.defaultTimezone,
  );
  const [dateInput, setDateInput] = useState<string>(DEFAULT_DATE_ISO);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(30);
  const [useBookings, setUseBookings] = useState<boolean>(true);

  const preset = PRESETS[presetKey];

  const resultText = useMemo(() => {
    const date = parseDateInput(dateInput);
    if (!date) return 'Choose a valid date.';

    const override: DayOverride | undefined = undefined;
    const bookings = useBookings ? DEFAULT_BOOKINGS : [];

    if (mode === 'windows') {
      const windows = getAvailabilityWindow({
        weeklySchedule: preset.weeklySchedule,
        date,
        timezone: viewerTimezone,
        override,
      });
      return formatWindowsForDisplay(windows);
    }

    const slots = getAvailableTimeslots({
      weeklySchedule: preset.weeklySchedule,
      date,
      timezone: viewerTimezone,
      slotDurationMinutes,
      override,
      bookings,
    });

    return formatSlotsForDisplay(slots);
  }, [mode, preset.weeklySchedule, viewerTimezone, dateInput, slotDurationMinutes, useBookings]);

  return (
    <div className="not-prose mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
              Preset
            </label>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={presetKey}
              onChange={(event) => {
                const next = event.target.value as PresetKey;
                setPresetKey(next);
                setViewerTimezone(PRESETS[next].defaultTimezone);
              }}
            >
              {Object.entries(PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Viewer timezone (IANA)
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                value={viewerTimezone}
                onChange={(event) => setViewerTimezone(event.target.value)}
                placeholder="e.g. Asia/Kolkata"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Mode
              </span>
              <div className="inline-flex rounded-md border border-zinc-300 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  type="button"
                  className={`px-3 py-1 ${mode === 'slots' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-700 dark:text-zinc-300'}`}
                  onClick={() => setMode('slots')}
                >
                  Time slots
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 border-l border-zinc-300 dark:border-zinc-700 ${mode === 'windows' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-700 dark:text-zinc-300'}`}
                  onClick={() => setMode('windows')}
                >
                  Windows
                </button>
              </div>
            </div>

            {mode === 'slots' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  Slot duration (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  value={slotDurationMinutes}
                  onChange={(event) =>
                    setSlotDurationMinutes(
                      Number.parseInt(event.target.value || '0', 10) || 0,
                    )
                  }
                />
              </div>
            )}
          </div>

          {mode === 'slots' && (
            <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={useBookings}
                onChange={(event) => setUseBookings(event.target.checked)}
                className="h-3 w-3 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              Use example booking (lunch hour / evening meeting)
            </label>
          )}
        </div>

        <div className="mt-4 flex-1 md:mt-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Result
          </p>
          <pre className="h-64 overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-100">
{resultText}
          </pre>
        </div>
      </div>
    </div>
  );
};

