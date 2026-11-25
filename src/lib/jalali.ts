// Jalali helpers using the built-in Intl calendar (no dependency).
const partsFmt = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });

export function jParts(d: Date | string | number): { y: number; m: number; d: number } {
  const o: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(new Date(d))) o[p.type] = p.value;
  return { y: parseInt(o.year, 10), m: parseInt(o.month, 10), d: parseInt(o.day, 10) };
}

export const MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

/** 'YYYY-MM' (Jalali) */
export function monthKey(d: Date | string | number = new Date()): string {
  const { y, m } = jParts(d);
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function nextMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(y)}`;
}

export function dayLabel(d: Date | string): string {
  const { m, d: day } = jParts(d);
  return `${new Intl.NumberFormat("fa-IR").format(day)} ${MONTHS[m - 1]}`;
}

/** How many days are left in the current Jalali month (incl. today). */
export function daysLeftInMonth(now = new Date()): { left: number; total: number } {
  const { y, m, d } = jParts(now);
  const total = m <= 6 ? 31 : m <= 11 ? 30 : isLeap(y) ? 30 : 29;
  return { left: total - d + 1, total };
}

function isLeap(y: number): boolean {
  // 33-year rule approximation, correct for the near future.
  const r = ((y % 33) + 33) % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
}

/** List month keys strictly after `from` and strictly before `to`. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let k = nextMonthKey(from);
  while (k < to && out.length < 120) {
    out.push(k);
    k = nextMonthKey(k);
  }
  return out;
}
