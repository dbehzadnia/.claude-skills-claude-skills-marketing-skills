const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

/** Latin digits → Persian digits, for display. */
export function toFaDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[0-9]/g, (d) => FA[Number(d)]!);
}

/** Persian/Arabic digits → Latin digits, for parsing user input. */
export function toEnDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

/** Number with Persian digits and thousands separators. */
export function formatNumber(n: number | null | undefined, maxFractionDigits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: maxFractionDigits }).format(n);
}
