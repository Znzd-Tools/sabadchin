const faNum = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });
const faDec = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

export const fa = (n: number) => faNum.format(Math.round(n));

/** 2_500_000 → «۲٫۵ میلیون» ; 350_000 → «۳۵۰ هزار» */
export function short(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1_000_000_000) return `${sign}${faDec.format(a / 1_000_000_000)} میلیارد`;
  if (a >= 1_000_000) return `${sign}${faDec.format(a / 1_000_000)} میلیون`;
  if (a >= 1_000) return `${sign}${faNum.format(Math.round(a / 1_000))} هزار`;
  return `${sign}${faNum.format(a)}`;
}

export function usd(toman: number, rate: number | null | undefined): string | null {
  if (!rate || rate <= 0) return null;
  const v = toman / rate;
  const f = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `$${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: f }).format(v)}`;
}

const P2L: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "٫": ".", "٬": "", "،": "", ",": "",
};
export const toLatinDigits = (s: string) => s.replace(/[۰-۹٠-٩٫٬،,]/g, (c) => P2L[c] ?? c);

/**
 * Understands what people really type:
 *  «۲۵۰۰۰۰»  «250,000»  «۲ میلیون»  «۲.۵ میلیون»  «۳۵۰ هزار»  «۵۰۰ تومن»  «2m»  «350k»
 * Returns Toman, or null if it can't parse.
 */
export function parseToman(input: string): number | null {
  let s = toLatinDigits(input).toLowerCase().trim();
  if (!s) return null;
  s = s.replace(/تومان|تومن|ت\b/g, "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|هزار|b|m|k)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2];
  const mult =
    unit === "میلیارد" || unit === "b" ? 1e9 : unit === "میلیون" || unit === "m" ? 1e6 : unit === "هزار" || unit === "k" ? 1e3 : 1;
  const v = Math.round(n * mult);
  return Number.isFinite(v) ? v : null;
}

export function timeAgoFa(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "همین الان";
  if (d < 3600) return `${fa(d / 60)} دقیقه پیش`;
  if (d < 86400) return `${fa(d / 3600)} ساعت پیش`;
  const days = d / 86400;
  if (days < 30) return `${fa(days)} روز پیش`;
  return `${fa(days / 30)} ماه پیش`;
}
