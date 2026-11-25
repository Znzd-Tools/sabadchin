import type { Priority } from "@/lib/categories";
import type { Item } from "@/lib/store";
import type { Suggestion } from "@/lib/suggest";

export type PlanRow = {
  key: string;
  title: string;
  category: string;
  priority: Priority;
  qty: number;
  cost: number; // total Toman for the row (0 if unknown)
  priceKnown: boolean;
  item?: Item; // real list item
  suggestion?: Suggestion; // "overdue" idea that is not on the list yet
  cum: number; // running total after this row (only for rows that are planned)
};

export type Plan = {
  budget: number;
  spent: number;
  available: number | null; // null = no budget set
  buy: PlanRow[];
  later: PlanRow[];
  buyTotal: number;
  mustTotal: number;
  mustOverBudget: boolean;
  leftover: number | null;
  unpriced: number;
};

const RANK: Record<Priority, number> = { must: 0, need: 1, want: 2 };

/**
 * Pure rules, no AI:
 *  1. «ضروری» is always planned, even if it does not fit (and we say so).
 *  2. «لازمه» then «دلم می‌خواد» are planned only while they fit in what is left of the month.
 *  3. Overdue staples ("oil is finished?") join as «لازمه», before the other «لازمه» rows.
 *  4. What does not fit moves to next month.
 */
export function buildPlan(opts: {
  items: Item[];
  budget: number;
  spent: number;
  lastPrice: (title: string) => number | null;
  overdue: Suggestion[];
}): Plan {
  const { items, budget, spent, lastPrice, overdue } = opts;
  const available = budget > 0 ? Math.max(0, budget - spent) : null;

  const rows: PlanRow[] = [];
  for (const i of items) {
    if (i.status !== "todo") continue;
    const unit = i.est_toman > 0 ? i.est_toman : lastPrice(i.title) ?? 0;
    rows.push({
      key: i.id,
      title: i.title,
      category: i.category,
      priority: i.priority,
      qty: i.qty,
      cost: unit * i.qty,
      priceKnown: unit > 0,
      item: i,
      cum: 0,
    });
  }
  for (const s of overdue) {
    rows.push({
      key: `s-${s.title}`,
      title: s.title,
      category: s.category,
      priority: "need",
      qty: 1,
      cost: s.est,
      priceKnown: s.est > 0,
      suggestion: s,
      cum: 0,
    });
  }

  rows.sort((a, b) => {
    if (RANK[a.priority] !== RANK[b.priority]) return RANK[a.priority] - RANK[b.priority];
    if (!!a.suggestion !== !!b.suggestion) return a.suggestion ? -1 : 1;
    return (a.item?.created_at ?? "").localeCompare(b.item?.created_at ?? "");
  });

  const buy: PlanRow[] = [];
  const later: PlanRow[] = [];
  let cum = 0;
  let mustTotal = 0;
  for (const r of rows) {
    if (r.priority === "must") {
      cum += r.cost;
      mustTotal += r.cost;
      buy.push({ ...r, cum });
    } else if (available === null || cum + r.cost <= available) {
      cum += r.cost;
      buy.push({ ...r, cum });
    } else {
      later.push(r);
    }
  }

  return {
    budget,
    spent,
    available,
    buy,
    later,
    buyTotal: cum,
    mustTotal,
    mustOverBudget: available !== null && mustTotal > available,
    leftover: available === null ? null : available - cum,
    unpriced: [...buy, ...later].filter((r) => !r.priceKnown).length,
  };
}
