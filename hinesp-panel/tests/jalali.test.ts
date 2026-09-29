import { describe, expect, it } from "vitest";
import { toEnDigits, toFaDigits } from "@/lib/digits";
import {
  formatJalali,
  jalaliMonthRange,
  jalaliToUtc,
  parseJalaliDate,
  parseJalaliRange,
  tehranOffsetMinutes,
  toJalali,
} from "@/lib/jalali";

describe("jalali/tehran helpers", () => {
  it("Tehran is UTC+03:30 today", () => {
    expect(tehranOffsetMinutes(new Date("2026-09-29T10:00:00Z"))).toBe(210);
  });

  it("converts Jalali date + Tehran time to UTC", () => {
    // 1405/07/07 09:00 Tehran == 2026-09-29 05:30 UTC
    expect(jalaliToUtc(1405, 7, 7, 9, 0).toISOString()).toBe("2026-09-29T05:30:00.000Z");
  });

  it("uses the Tehran day, not the UTC day", () => {
    // 22:00 UTC on 28 Sep is already 29 Sep (1405/07/07) in Tehran
    expect(toJalali(new Date("2026-09-28T22:00:00Z"))).toEqual({ year: 1405, month: 7, day: 7 });
    expect(formatJalali(new Date("2026-09-28T22:00:00Z"), "yyyy/MM/dd HH:mm")).toBe("۱۴۰۵/۰۷/۰۷ ۰۱:۳۰");
  });

  it("parses Persian-digit input and rejects impossible dates", () => {
    expect(parseJalaliDate("۱۴۰۵/۰۷/۰۷")).toEqual({ year: 1405, month: 7, day: 7 });
    expect(parseJalaliDate("1405-7-31")).toBeNull();
    expect(parseJalaliDate("garbage")).toBeNull();
  });

  it("month range covers the whole Jalali month", () => {
    const { start, end } = jalaliMonthRange(1405, 12);
    expect(toJalali(start)).toEqual({ year: 1405, month: 12, day: 1 });
    expect(toJalali(end)).toEqual({ year: 1406, month: 1, day: 1 });
  });

  it("range defaults and is end-exclusive", () => {
    const r = parseJalaliRange("1405/07/01", "1405/07/07");
    expect(toJalali(r.from)).toEqual({ year: 1405, month: 7, day: 1 });
    expect(toJalali(r.to)).toEqual({ year: 1405, month: 7, day: 8 });
  });

  it("digit conversion both ways", () => {
    expect(toFaDigits("12:30")).toBe("۱۲:۳۰");
    expect(toEnDigits("۱۲٣")).toBe("123");
  });
});
