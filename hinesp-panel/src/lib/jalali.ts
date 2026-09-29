/**
 * Jalali dates in the Asia/Tehran timezone. Everything is stored as UTC; these
 * helpers convert for display and parse user input. They give the same result
 * whatever the server's own timezone is.
 */
import { format as formatJ, newDate } from "date-fns-jalali";
import { toEnDigits, toFaDigits } from "./digits";

export const TZ = "Asia/Tehran";

const dtf = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Gregorian wall-clock fields in Tehran for an instant. */
export function tehranParts(date: Date): Parts {
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Tehran's offset from UTC, in minutes, at a given instant. */
export function tehranOffsetMinutes(date: Date): number {
  const p = tehranParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** UTC instant for a Gregorian wall-clock time in Tehran. */
export function tehranToUtc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const first = naive - tehranOffsetMinutes(new Date(naive)) * 60000;
  return new Date(naive - tehranOffsetMinutes(new Date(first)) * 60000);
}

/** A Date whose *local* fields equal Tehran's wall clock, for date-fns formatting. */
function asLocalTehran(date: Date): Date {
  const p = tehranParts(date);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export type JalaliDate = { year: number; month: number; day: number };

export function toJalali(date: Date): JalaliDate {
  const local = asLocalTehran(date);
  const [y, m, d] = formatJ(local, "yyyy-MM-dd").split("-").map(Number);
  return { year: y!, month: m!, day: d! };
}

/** UTC instant of a Jalali date + Tehran time. Month is 1-based. */
export function jalaliToUtc(jy: number, jm: number, jd: number, hour = 0, minute = 0): Date {
  const g = newDate(jy, jm - 1, jd); // local midnight of that Gregorian day
  return tehranToUtc(g.getFullYear(), g.getMonth() + 1, g.getDate(), hour, minute);
}

/** Format an instant in Jalali/Tehran with Persian digits. Patterns follow date-fns. */
export function formatJalali(date: Date | string | null | undefined, pattern = "yyyy/MM/dd"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return toFaDigits(formatJ(asLocalTehran(d), pattern));
}

export function formatJalaliDateTime(date: Date | string | null | undefined): string {
  return formatJalali(date, "yyyy/MM/dd HH:mm");
}

export function formatTime(date: Date | string | null | undefined): string {
  return formatJalali(date, "HH:mm");
}

/** "1405/07/07", "۱۴۰۵-۰۷-۰۷" … → parts, or null when invalid. */
export function parseJalaliDate(input: string | null | undefined): JalaliDate | null {
  if (!input) return null;
  const m = toEnDigits(input.trim()).match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (month > 6 && day > 30) return null;
  // Round-trip to reject days that don't exist (e.g. 30 Esfand in a common year).
  const back = toJalali(jalaliToUtc(year, month, day, 12));
  if (back.year !== year || back.month !== month || back.day !== day) return null;
  return { year, month, day };
}

/** Canonical string form used in URLs and forms: "1405-07-07" (Latin digits). */
export function jalaliKey(date: Date): string {
  const j = toJalali(date);
  return `${j.year}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(2, "0")}`;
}

/** Start of the Jalali day in Tehran (UTC instant). */
export function startOfJalaliDay(j: JalaliDate): Date {
  return jalaliToUtc(j.year, j.month, j.day);
}

/** Start of the day after. Use as an exclusive upper bound. */
export function endOfJalaliDayExclusive(j: JalaliDate): Date {
  const start = jalaliToUtc(j.year, j.month, j.day, 12);
  const next = toJalali(new Date(start.getTime() + 24 * 3600 * 1000));
  return startOfJalaliDay(next);
}

/** [start, end) of a Jalali month in UTC. */
export function jalaliMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = jalaliToUtc(year, month, 1);
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return { start, end: jalaliToUtc(ny, nm, 1) };
}

/**
 * Parse a from/to pair of Jalali date strings into a UTC range [from, to).
 * Falls back to the last `defaultDays` days (inclusive of today).
 */
export function parseJalaliRange(
  from: string | null | undefined,
  to: string | null | undefined,
  defaultDays = 30,
  now = new Date(),
): { from: Date; to: Date; fromKey: string; toKey: string } {
  const today = toJalali(now);
  const t = parseJalaliDate(to) ?? today;
  const toExclusive = endOfJalaliDayExclusive(t);
  const f =
    parseJalaliDate(from) ??
    toJalali(new Date(toExclusive.getTime() - defaultDays * 24 * 3600 * 1000 + 12 * 3600 * 1000));
  const fromDate = startOfJalaliDay(f);
  const key = (j: JalaliDate) => `${j.year}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(2, "0")}`;
  return { from: fromDate, to: toExclusive, fromKey: key(f), toKey: key(t) };
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
