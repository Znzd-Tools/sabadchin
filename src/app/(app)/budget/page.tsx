"use client";

import { useState } from "react";
import { Bar, PageHead, Sheet, Sticker } from "@/components/ui";
import { CATEGORIES, GROUPS, catOf, type Group } from "@/lib/categories";
import { fa, parseToman, short, usd } from "@/lib/format";
import { monthLabel } from "@/lib/jalali";
import { useStore } from "@/lib/store";

export default function BudgetPage() {
  const s = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [val, setVal] = useState("");

  const total = s.totalBudget(s.month);
  const spent = s.spentIn(s.month);

  function open(key: string) {
    setEditing(key);
    const b = s.budgetFor(key, s.month);
    setVal(b ? String(b) : "");
  }

  const toman = parseToman(val);

  return (
    <>
      <PageHead title="بودجه" sub={monthLabel(s.month)} />
      <div className="flex flex-col gap-4 px-4">
        <section className="card p-4" style={{ background: "#CDEBB8" }}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-extrabold">کل بودجه این ماه</span>
            <span className="num text-xs font-bold text-ink-soft">{usd(total, s.rate) ?? ""}</span>
          </div>
          <div className="font-display num text-4xl">{short(total)} <span className="text-lg">تومان</span></div>
          <div className="mt-2"><Bar value={spent} max={total} h={16} /></div>
          <div className="mt-1 text-xs font-bold">خرج‌شده {short(spent)}</div>
        </section>

        {(Object.keys(GROUPS) as Group[]).map((g) => (
          <section key={g}>
            <h2 className="font-display mb-2 px-1 text-2xl">{GROUPS[g].label} <span className="text-sm font-sans font-bold text-ink-soft">{GROUPS[g].hint}</span></h2>
            <div className="flex flex-col gap-2">
              {CATEGORIES.filter((c) => c.group === g).map((c) => {
                const b = s.budgetFor(c.key, s.month);
                const sp = s.spentIn(s.month, c.key);
                return (
                  <button key={c.key} onClick={() => open(c.key)} className="card-flat flex flex-col gap-2 p-3 text-start active:scale-[0.99]">
                    <div className="flex items-center gap-3">
                      <Sticker cat={c.key} size={38} />
                      <div className="flex-1 font-extrabold">{c.label}</div>
                      <div className="num text-end text-sm font-extrabold">
                        {b ? <>{short(sp)} <span className="text-ink-soft">از {short(b)}</span></> : sp ? <>{short(sp)} <span className="text-ink-soft">بدون سقف</span></> : <span className="text-ink-soft">+ سقف بذار</span>}
                      </div>
                    </div>
                    {b > 0 && <Bar value={sp} max={b} color={c.color} h={12} />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing ? `${catOf(editing).emoji} بودجه ${catOf(editing).label}` : ""}>
        <div className="flex flex-col gap-3">
          <input autoFocus className="field num text-xl font-bold" inputMode="decimal" placeholder="مثلاً ۵ میلیون" value={val} onChange={(e) => setVal(e.target.value)} />
          <div className="num flex justify-between px-1 text-sm font-bold text-ink-soft">
            <span>{toman ? `${fa(toman)} تومان` : ""}</span>
            <span dir="ltr">{toman && usd(toman, s.rate) ? `≈ ${usd(toman, s.rate)}` : ""}</span>
          </div>
          <p className="text-xs text-ink-soft">از این ماه به بعد اعمال می‌شه. ماه‌های گذشته دست نمی‌خوره.</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button className="btn btn-tomato" disabled={toman === null} onClick={async () => { await s.setBudget(editing!, toman ?? 0); setEditing(null); }}>ذخیره</button>
            <button className="btn bg-white" onClick={async () => { await s.setBudget(editing!, 0); setEditing(null); }}>بدون سقف</button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
