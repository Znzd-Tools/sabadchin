"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { monthKey, monthsBetween, prevMonthKey } from "@/lib/jalali";
import { CATEGORIES, DEFAULT_WEIGHTS } from "@/lib/categories";
import type { Priority } from "@/lib/categories";
import { buildPriceMemory, norm } from "@/lib/suggest";

export type Item = {
  id: string;
  family_id: string;
  title: string;
  category: string;
  priority: Priority;
  qty: number;
  est_toman: number;
  actual_toman: number | null;
  rate: number | null;
  status: "todo" | "bought";
  bought_at: string | null;
  bought_by: string | null;
  created_by: string;
  created_at: string;
};
export type Budget = { family_id: string; category: string; month: string; amount_toman: number };
export type Goal = { id: string; family_id: string; title: string; emoji: string; target_toman: number; is_active: boolean };
export type Move = { id: string; family_id: string; amount_toman: number; note: string; created_by: string; created_at: string };
export type Family = {
  id: string; name: string; invite_code: string; reward_pct: number; created_at: string;
  usd_rate: number | null; usd_rate_at: string | null; usd_rate_manual: boolean;
};
export type RateInfo = { source: "live" | "saved" | "manual" | null; at: string | null };
export type Member = { user_id: string; display_name: string; role: string };

export type NewItem = {
  title: string;
  category: string;
  priority: Priority;
  qty?: number;
  est_toman: number;
  bought?: boolean;
};

type Ctx = {
  family: Family;
  me: Member;
  members: Member[];
  nameOf: (uid: string | null) => string;
  items: Item[];
  budgets: Budget[];
  goals: Goal[];
  moves: Move[];
  rate: number | null;
  rateInfo: RateInfo;
  setManualRate: (n: number | null) => Promise<void>;
  ready: boolean;
  month: string;
  // derived
  spentIn: (month: string, category?: string) => number;
  budgetFor: (category: string, month: string) => number;
  totalBudget: (month: string) => number;
  isManual: (category: string, month: string) => boolean;
  fund: { rewards: { month: string; budget: number; spent: number; saved: number }[]; rewardTotal: number; manual: number; balance: number };
  // actions
  addItem: (n: NewItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  markBought: (id: string, actual?: number) => Promise<void>;
  lastPrice: (title: string) => number | null;
  buy: (id: string) => Promise<void>;
  askingPrice: Item | null;
  answerPrice: (price: number | null) => Promise<void>;
  undoBought: (id: string) => Promise<void>;
  setTotalBudget: (amount: number, month?: string) => Promise<void>;
  setCategoryBudget: (category: string, amount: number, month?: string) => Promise<void>;
  addGoal: (g: { title: string; emoji: string; target_toman: number }) => Promise<void>;
  activateGoal: (id: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  addMove: (amount: number, note: string) => Promise<void>;
  setRewardPct: (pct: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};

const RATE_KEY = "sabadchin:rate";
const TOTAL = "_total";

export const itemCost = (i: Item) => (i.status === "bought" ? i.actual_toman ?? i.est_toman : i.est_toman) * i.qty;

export function StoreProvider({
  family: f0,
  me,
  members,
  children,
}: {
  family: Family;
  me: Member;
  members: Member[];
  children: React.ReactNode;
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [family, setFamily] = useState(f0);
  const [items, setItems] = useState<Item[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const fid = family.id;
  const month = monthKey();
  const lastRate = useRef<number | null>(null);

  const load = useCallback(async () => {
    const [i, b, g, m] = await Promise.all([
      sb.from("items").select("*").eq("family_id", fid).order("created_at", { ascending: false }),
      sb.from("budgets").select("*").eq("family_id", fid),
      sb.from("goals").select("*").eq("family_id", fid).order("created_at"),
      sb.from("fund_moves").select("*").eq("family_id", fid).order("created_at", { ascending: false }),
    ]);
    if (i.data) setItems(i.data as Item[]);
    if (b.data) setBudgets(b.data as Budget[]);
    if (g.data) setGoals(g.data as Goal[]);
    if (m.data) setMoves(m.data as Move[]);
    setReady(true);
  }, [sb, fid]);

  useEffect(() => {
    load();
    const ch = sb
      .channel(`fam-${fid}`)
      .on("postgres_changes", { event: "*", schema: "public", filter: `family_id=eq.${fid}` }, () => load())
      .subscribe();
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      sb.removeChannel(ch);
    };
  }, [sb, fid, load]);

  // USDT rate. Order: manual (if you set one) → live from the server → last one saved for the family.
  const [rateInfo, setRateInfo] = useState<RateInfo>({ source: null, at: null });

  const fetchLive = useCallback(async () => {
    try {
      const d = await fetch("/api/rate").then((r) => r.json());
      if (!d?.rate) return false;
      setRate(d.rate);
      lastRate.current = d.rate;
      setRateInfo({ source: "live", at: d.at });
      try {
        localStorage.setItem(RATE_KEY, String(d.rate));
      } catch {}
      const f = familyRef.current;
      const stale = !f.usd_rate_at || Date.now() - new Date(f.usd_rate_at).getTime() > 30 * 60_000;
      if (stale || Math.abs((f.usd_rate ?? 0) - d.rate) / d.rate > 0.005) {
        const at = new Date().toISOString();
        setFamily((x) => ({ ...x, usd_rate: d.rate, usd_rate_at: at, usd_rate_manual: false }));
        sb.from("families").update({ usd_rate: d.rate, usd_rate_at: at, usd_rate_manual: false }).eq("id", fid).then(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }, [sb, fid]);

  const familyRef = useRef(family);
  useEffect(() => {
    familyRef.current = family;
  }, [family]);

  useEffect(() => {
    const f = familyRef.current;
    let saved = f.usd_rate ?? 0;
    if (!saved) {
      try {
        saved = Number(localStorage.getItem(RATE_KEY)) || 0;
      } catch {}
    }
    if (saved > 0) {
      setRate(saved);
      lastRate.current = saved;
      setRateInfo({ source: f.usd_rate_manual ? "manual" : "saved", at: f.usd_rate_at });
    }
    if (!f.usd_rate_manual) fetchLive();
  }, [fetchLive]);

  const setManualRate: Ctx["setManualRate"] = async (n) => {
    if (!n) {
      setFamily((x) => ({ ...x, usd_rate_manual: false }));
      await sb.from("families").update({ usd_rate_manual: false }).eq("id", fid);
      await fetchLive();
      return;
    }
    const at = new Date().toISOString();
    setRate(n);
    lastRate.current = n;
    setRateInfo({ source: "manual", at });
    setFamily((x) => ({ ...x, usd_rate: n, usd_rate_at: at, usd_rate_manual: true }));
    await sb.from("families").update({ usd_rate: n, usd_rate_at: at, usd_rate_manual: true }).eq("id", fid);
  };

  const priceMem = useMemo(() => buildPriceMemory(items), [items]);
  const lastPrice = useCallback((title: string) => priceMem.get(norm(title)) ?? null, [priceMem]);
  const [askingPrice, setAskingPrice] = useState<Item | null>(null);

  const nameOf = useCallback((uid: string | null) => members.find((m) => m.user_id === uid)?.display_name ?? "—", [members]);

  // ── derived ──
  const spentIn = useCallback(
    (mk: string, category?: string) =>
      items
        .filter((i) => i.status === "bought" && i.bought_at && monthKey(i.bought_at) === mk && (!category || i.category === category))
        .reduce((s, i) => s + itemCost(i), 0),
    [items],
  );

  // Latest budget row at or before the month (so changes only apply going forward).
  const effective = useCallback(
    (category: string, mk: string) => {
      let best: Budget | null = null;
      for (const b of budgets) if (b.category === category && b.month <= mk && (!best || b.month > best.month)) best = b;
      return best?.amount_toman ?? 0;
    },
    [budgets],
  );

  const totalBudget = useCallback((mk: string) => effective(TOTAL, mk), [effective]);

  const isManual = useCallback((category: string, mk: string) => effective(category, mk) > 0, [effective]);

  // One total → automatic split. Manual overrides are kept; the rest is shared by weights
  // (defaults for Iranian households, blended 50/50 with what you really spent in the last 3 months).
  const allocCache = useMemo(() => new Map<string, Record<string, number>>(), [budgets, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const allocate = useCallback(
    (mk: string): Record<string, number> => {
      const hit = allocCache.get(mk);
      if (hit) return hit;
      const total = effective(TOTAL, mk);
      const out: Record<string, number> = {};
      const manual = CATEGORIES.filter((c) => effective(c.key, mk) > 0);
      let rest = total;
      for (const c of manual) {
        out[c.key] = effective(c.key, mk);
        rest -= out[c.key];
      }
      rest = Math.max(0, rest);

      let h = prevMonthKey(mk);
      const past: Record<string, number> = {};
      let pastTotal = 0;
      for (let n = 0; n < 3; n++, h = prevMonthKey(h)) {
        for (const i of items) {
          if (i.status === "bought" && i.bought_at && monthKey(i.bought_at) === h) {
            past[i.category] = (past[i.category] ?? 0) + itemCost(i);
            pastTotal += itemCost(i);
          }
        }
      }
      // What is already on the to-buy list (entered price, or the last price we remember).
      const pend: Record<string, number> = {};
      let pendTotal = 0;
      for (const i of items) {
        if (i.status !== "todo") continue;
        const unit = i.est_toman > 0 ? i.est_toman : priceMem.get(norm(i.title)) ?? 0;
        pend[i.category] = (pend[i.category] ?? 0) + unit * i.qty;
        pendTotal += unit * i.qty;
      }
      const auto = CATEGORIES.filter((c) => !manual.includes(c));
      // defaults 40% · real spending 30% · shopping list 30%, renormalised over what exists.
      const wd = 0.4, wh = pastTotal > 0 ? 0.3 : 0, wp = pendTotal > 0 ? 0.3 : 0;
      const wsum = wd + wh + wp;
      const w = auto.map((c) => {
        const d = DEFAULT_WEIGHTS[c.key] ?? 0;
        const h = pastTotal > 0 ? ((past[c.key] ?? 0) / pastTotal) * 100 : 0;
        const p = pendTotal > 0 ? ((pend[c.key] ?? 0) / pendTotal) * 100 : 0;
        return (wd * d + wh * h + wp * p) / wsum;
      });
      const sum = w.reduce((a, b) => a + b, 0) || 1;
      auto.forEach((c, idx) => {
        out[c.key] = rest > 0 ? Math.round(((rest * w[idx]) / sum) / 1000) * 1000 : 0;
      });
      allocCache.set(mk, out);
      return out;
    },
    [allocCache, effective, items, priceMem],
  );

  const budgetFor = useCallback((category: string, mk: string) => allocate(mk)[category] ?? 0, [allocate]);

  const fund = useMemo(() => {
    const start = monthKey(family.created_at);
    const rewards = monthsBetween(start, month).map((mk) => {
      const budget = totalBudget(mk);
      const spent = spentIn(mk);
      const saved = budget > 0 ? Math.round((Math.max(0, budget - spent) * family.reward_pct) / 100) : 0;
      return { month: mk, budget, spent, saved };
    });
    const rewardTotal = rewards.reduce((s, r) => s + r.saved, 0);
    const manual = moves.reduce((s, m) => s + m.amount_toman, 0);
    return { rewards: rewards.reverse(), rewardTotal, manual, balance: rewardTotal + manual };
  }, [family.created_at, family.reward_pct, month, totalBudget, spentIn, moves]);

  // ── actions (optimistic, realtime reconciles) ──
  const addItem: Ctx["addItem"] = async (n) => {
    const now = new Date().toISOString();
    const row = {
      family_id: fid,
      title: n.title.trim(),
      category: n.category,
      priority: n.priority,
      qty: n.qty ?? 1,
      est_toman: n.est_toman,
      actual_toman: n.bought ? n.est_toman : null,
      rate: lastRate.current,
      status: n.bought ? "bought" : "todo",
      bought_at: n.bought ? now : null,
      bought_by: n.bought ? me.user_id : null,
      created_by: me.user_id,
    };
    const tmp: Item = { ...(row as unknown as Item), id: `tmp-${now}`, created_at: now };
    setItems((p) => [tmp, ...p]);
    const { error } = await sb.from("items").insert(row);
    if (error) throw error;
    load();
  };

  const updateItem: Ctx["updateItem"] = async (id, patch) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await sb.from("items").update(patch).eq("id", id);
    if (error) throw error;
  };

  const removeItem: Ctx["removeItem"] = async (id) => {
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await sb.from("items").delete().eq("id", id);
    if (error) throw error;
  };

  const markBought: Ctx["markBought"] = async (id, actual) => {
    const it = items.find((i) => i.id === id);
    await updateItem(id, {
      status: "bought",
      bought_at: new Date().toISOString(),
      bought_by: me.user_id,
      actual_toman: actual ?? it?.est_toman ?? 0,
      rate: lastRate.current ?? it?.rate ?? null,
    });
  };

  // Tap "bought": if the item has no price yet, ask for it (optional); otherwise just mark it.
  const buy: Ctx["buy"] = async (id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (it.est_toman > 0) return markBought(id);
    setAskingPrice(it);
  };
  const answerPrice: Ctx["answerPrice"] = async (price) => {
    const it = askingPrice;
    setAskingPrice(null);
    if (!it) return;
    await markBought(it.id, price ?? undefined);
    if (price) await updateItem(it.id, { est_toman: price });
  };

  const undoBought: Ctx["undoBought"] = async (id) => {
    await updateItem(id, { status: "todo", bought_at: null, bought_by: null, actual_toman: null });
  };

  const upsertBudget = async (category: string, amount: number, mk: string) => {
    setBudgets((p) => [...p.filter((b) => !(b.category === category && b.month === mk)), { family_id: fid, category, month: mk, amount_toman: amount }]);
    const { error } = await sb
      .from("budgets")
      .upsert({ family_id: fid, category, month: mk, amount_toman: amount }, { onConflict: "family_id,category,month" });
    if (error) throw error;
  };

  // Editing an old month must not silently rewrite this month: first pin this month's current values.
  const pinCurrent = async (mk: string) => {
    if (mk >= month) return;
    const cats = new Set(["_total", ...budgets.map((b) => b.category)]);
    for (const c of cats) {
      const hasNow = budgets.some((b) => b.category === c && b.month === month);
      const val = effective(c, month);
      if (!hasNow && val > 0) await upsertBudget(c, val, month);
    }
  };

  const setTotalBudget: Ctx["setTotalBudget"] = async (amount, mk = month) => {
    await pinCurrent(mk);
    await upsertBudget(TOTAL, amount, mk);
  };
  const setCategoryBudget: Ctx["setCategoryBudget"] = async (category, amount, mk = month) => {
    await pinCurrent(mk);
    await upsertBudget(category, amount, mk);
  };

  const addGoal: Ctx["addGoal"] = async (g) => {
    const first = goals.length === 0;
    const { error } = await sb.from("goals").insert({ ...g, family_id: fid, is_active: first });
    if (error) throw error;
    load();
  };

  const activateGoal: Ctx["activateGoal"] = async (id) => {
    setGoals((p) => p.map((g) => ({ ...g, is_active: g.id === id })));
    await sb.from("goals").update({ is_active: false }).eq("family_id", fid);
    await sb.from("goals").update({ is_active: true }).eq("id", id);
  };

  const removeGoal: Ctx["removeGoal"] = async (id) => {
    setGoals((p) => p.filter((g) => g.id !== id));
    await sb.from("goals").delete().eq("id", id);
  };

  const addMove: Ctx["addMove"] = async (amount, note) => {
    const { error } = await sb.from("fund_moves").insert({ family_id: fid, amount_toman: amount, note, created_by: me.user_id });
    if (error) throw error;
    load();
  };

  const setRewardPct: Ctx["setRewardPct"] = async (pct) => {
    setFamily((f) => ({ ...f, reward_pct: pct }));
    await sb.from("families").update({ reward_pct: pct }).eq("id", fid);
  };

  const signOut = async () => {
    await sb.auth.signOut();
    window.location.href = "/login";
  };

  const value: Ctx = {
    family, me, members, nameOf, items, budgets, goals, moves, rate, rateInfo, setManualRate, ready, month,
    spentIn, budgetFor, totalBudget, isManual, fund,
    addItem, updateItem, removeItem, markBought, lastPrice, buy, askingPrice, answerPrice, undoBought, setTotalBudget, setCategoryBudget,
    addGoal, activateGoal, removeGoal, addMove, setRewardPct, signOut,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
