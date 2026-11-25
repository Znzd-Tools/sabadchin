"use client";

import { useState } from "react";
import { Bar, Empty, PageHead, Sheet } from "@/components/ui";
import { fa, parseToman, short, usd } from "@/lib/format";
import { monthLabel } from "@/lib/jalali";
import { useStore } from "@/lib/store";

const EMOJIS = ["🏖️", "✈️", "🏔️", "🎡", "🍕", "🎁", "🛍️", "🎟️", "🚗", "💍"];

export default function FunPage() {
  const s = useStore();
  const goal = s.goals.find((g) => g.is_active);
  const [newGoal, setNewGoal] = useState(false);
  const [gt, setGt] = useState("");
  const [ga, setGa] = useState("");
  const [ge, setGe] = useState(EMOJIS[0]);
  const [move, setMove] = useState<null | "in" | "out">(null);
  const [ma, setMa] = useState("");
  const [mn, setMn] = useState("");

  const left = goal ? goal.target_toman - s.fund.balance : 0;
  const reached = goal && s.fund.balance >= goal.target_toman;

  return (
    <>
      <PageHead title="صندوق پاداش" sub="هر چی از بودجه کمتر خرج کنیم، نصفش می‌ره اینجا" />
      <div className="flex flex-col gap-4 px-4">
        <section className="card p-5 text-center" style={{ background: reached ? "#CDEBB8" : "#E3DBFF" }}>
          <div className={reached ? "pop text-6xl" : "wobble text-6xl"}>{goal?.emoji ?? "🎉"}</div>
          <div className="font-display mt-1 text-2xl">{goal ? goal.title : "هنوز هدفی نداریم"}</div>
          <div className="font-display num mt-2 text-5xl">{short(s.fund.balance)}</div>
          <div className="num text-sm font-bold text-ink-soft">تومان {usd(s.fund.balance, s.rate) ? `· ${usd(s.fund.balance, s.rate)}` : ""}</div>
          {goal && (
            <div className="mt-3 text-start">
              <Bar value={s.fund.balance} max={goal.target_toman} color="var(--color-grape)" h={20} />
              <div className="num mt-1 flex justify-between text-xs font-extrabold">
                <span>{fa(Math.min(100, (s.fund.balance / goal.target_toman) * 100))}٪</span>
                <span>{reached ? "جمع شد! بریم 🎊" : `${short(left)} مونده از ${short(goal.target_toman)}`}</span>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn bg-white" onClick={() => setMove("in")}>＋ واریز</button>
            <button className="btn bg-white" onClick={() => setMove("out")}>－ برداشت</button>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-2xl">هدف‌ها</h2>
            <button className="chip" onClick={() => setNewGoal(true)}>＋ هدف جدید</button>
          </div>
          {s.goals.length === 0 ? (
            <Empty emoji="🏖️" title="یه هدف بذار" hint="مثلاً سفر شمال، ۳۰ میلیون" />
          ) : (
            <div className="flex flex-col gap-2">
              {s.goals.map((g) => (
                <div key={g.id} className="card-flat flex items-center gap-3 p-3" style={{ background: g.is_active ? "#E3DBFF" : undefined }}>
                  <span className="text-3xl">{g.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{g.title}</div>
                    <div className="num text-xs font-bold text-ink-soft">{short(g.target_toman)} تومان</div>
                  </div>
                  {g.is_active ? <span className="chip" data-on>فعال</span> : <button className="chip" onClick={() => s.activateGoal(g.id)}>فعالش کن</button>}
                  <button aria-label="حذف" className="px-1 text-lg" onClick={() => confirm("حذف بشه؟") && s.removeGoal(g.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display mb-1 px-1 text-2xl">حساب‌وکتاب</h2>
          <div className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-ink-soft">
            سهم پاداش از صرفه‌جویی:
            {[30, 50, 70, 100].map((p) => (
              <button key={p} className="chip" data-on={s.family.reward_pct === p} onClick={() => s.setRewardPct(p)}>{fa(p)}٪</button>
            ))}
          </div>
          {s.fund.rewards.length === 0 ? (
            <p className="px-1 text-sm text-ink-soft">اولین پاداش بعد از تموم شدن این ماه حساب می‌شه. بودجه‌ها رو بذار تا حساب کار دستت باشه.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {s.fund.rewards.map((r) => (
                <div key={r.month} className="card-flat flex items-center justify-between p-3">
                  <div>
                    <div className="font-extrabold">{monthLabel(r.month)}</div>
                    <div className="num text-xs text-ink-soft">بودجه {short(r.budget)} · خرج {short(r.spent)}</div>
                  </div>
                  <div className="num font-extrabold" style={{ color: r.saved ? "var(--color-leaf)" : "var(--color-ink-soft)" }}>
                    {r.saved ? `+${short(r.saved)}` : "—"}
                  </div>
                </div>
              ))}
              {s.moves.map((m) => (
                <div key={m.id} className="card-flat flex items-center justify-between p-3">
                  <div>
                    <div className="font-extrabold">{m.amount_toman > 0 ? "واریز دستی" : "برداشت"}</div>
                    <div className="text-xs text-ink-soft">{m.note || "—"} · {s.nameOf(m.created_by)}</div>
                  </div>
                  <div className="num font-extrabold" style={{ color: m.amount_toman > 0 ? "var(--color-leaf)" : "var(--color-tomato)" }}>
                    {m.amount_toman > 0 ? "+" : "−"}{short(Math.abs(m.amount_toman))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Sheet open={newGoal} onClose={() => setNewGoal(false)} title="هدف جدید">
        <div className="flex flex-col gap-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {EMOJIS.map((e) => (
              <button key={e} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink text-2xl" style={{ background: ge === e ? "var(--color-mango)" : "#fff" }} onClick={() => setGe(e)}>{e}</button>
            ))}
          </div>
          <input className="field font-bold" placeholder="مثلاً سفر شمال" value={gt} onChange={(e) => setGt(e.target.value)} />
          <input className="field num font-bold" inputMode="decimal" placeholder="چقدر لازمه؟ مثلاً ۳۰ میلیون" value={ga} onChange={(e) => setGa(e.target.value)} />
          <div className="num px-1 text-sm font-bold text-ink-soft">{parseToman(ga) ? `${fa(parseToman(ga)!)} تومان ≈ ${usd(parseToman(ga)!, s.rate) ?? ""}` : ""}</div>
          <button className="btn btn-tomato" disabled={!gt.trim() || !parseToman(ga)} onClick={async () => { await s.addGoal({ title: gt.trim(), emoji: ge, target_toman: parseToman(ga)! }); setGt(""); setGa(""); setNewGoal(false); }}>بذار بره</button>
        </div>
      </Sheet>

      <Sheet open={!!move} onClose={() => setMove(null)} title={move === "in" ? "واریز به صندوق" : "برداشت از صندوق"}>
        <div className="flex flex-col gap-3">
          <input autoFocus className="field num text-xl font-bold" inputMode="decimal" placeholder="مبلغ" value={ma} onChange={(e) => setMa(e.target.value)} />
          <input className="field" placeholder="توضیح (اختیاری)" value={mn} onChange={(e) => setMn(e.target.value)} />
          <button className="btn btn-tomato" disabled={!parseToman(ma)} onClick={async () => { const v = parseToman(ma)!; await s.addMove(move === "in" ? v : -v, mn); setMa(""); setMn(""); setMove(null); }}>ثبت</button>
        </div>
      </Sheet>
    </>
  );
}
