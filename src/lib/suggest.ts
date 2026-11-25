import type { Item } from "@/lib/store";

export type Suggestion = { title: string; category: string; est: number; daysSince: number; every: number };

const norm = (s: string) => s.replace(/ي/g, "ی").replace(/ك/g, "ک").trim();

/**
 * "Oil is overdue" — pure rule, no AI.
 * An item bought at least 2 times has an average gap. If today is past ~90% of that gap
 * and it is not already on the to-buy list, suggest it.
 */
export function overdueSuggestions(items: Item[], now = Date.now()): Suggestion[] {
  const todo = new Set(items.filter((i) => i.status === "todo").map((i) => norm(i.title)));
  const by = new Map<string, Item[]>();
  for (const i of items) {
    if (i.status !== "bought" || !i.bought_at) continue;
    const k = norm(i.title);
    by.set(k, [...(by.get(k) ?? []), i]);
  }
  const out: Suggestion[] = [];
  by.forEach((list, k) => {
    if (list.length < 2 || todo.has(k)) return;
    const t = list.map((i) => new Date(i.bought_at!).getTime()).sort((a, b) => a - b);
    const gaps = t.slice(1).map((x, j) => (x - t[j]) / 86400000).filter((g) => g >= 2);
    if (!gaps.length) return;
    const every = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const since = (now - t[t.length - 1]) / 86400000;
    if (since >= every * 0.9) {
      const last = list.find((i) => new Date(i.bought_at!).getTime() === t[t.length - 1])!;
      out.push({ title: last.title, category: last.category, est: last.actual_toman ?? last.est_toman, daysSince: Math.round(since), every: Math.round(every) });
    }
  });
  return out.sort((a, b) => b.daysSince / b.every - a.daysSince / a.every).slice(0, 5);
}
