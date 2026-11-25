"use client";

import { useState } from "react";
import { Bar, PageHead, Sheet, Sticker } from "@/components/ui";
import { CATEGORIES, GROUPS, catOf, type Group } from "@/lib/categories";
import { fa, parseToman, short, usd } from "@/lib/format";
import { monthKey, monthLabel, nextMonthKey, prevMonthKey } from "@/lib/jalali";
import { useStore } from "@/lib/store";
import BudgetSuggest from "@/components/budget-suggest";

export default function BudgetPage() {
  const s = useStore();
  const [mode, setMode] = useState<null | "total" | string>(null);
  const [val, setVal] = useState("");
  const [viewMonth, setViewMonth] = useState(s.month);
  const [sure, setSure] = useState(false);

  const first = monthKey(s.family.created_at);
  const isPast = viewMonth < s.month;
  const total = s.totalBudget(viewMonth);
  const spent = s.spentIn(viewMonth);
  const toman = parseToman(val);

  function open(m: "total" | string) {
    setMode(m);
    setSure(false);
    const cur = m === "total" ? total : s.isManual(m, viewMonth) ? s.budgetFor(m, viewMonth) : 0;
    setVal(cur ? String(cur) : "");
  }

  return (
    <>
      <PageHead
        title="بودجه"
        right={
          <div className="flex items-center gap-1">
            <button aria-label="ماه قبل" className="chip" disabled={viewMonth <= first} style={{ opacity: viewMonth <= first ? 0.4 : 1 }} onClick={() => setViewMonth(prevMonthKey(viewMonth))}>›</button>
            <span className="chip" data-on>{monthLabel(viewMonth)}</span>
            <button aria-label="ماه بعد" className="chip" disabled={viewMonth >= s.month} style={{ opacity: viewMonth >= s.month ? 0.4 : 1 }} onClick={() => setViewMonth(nextMonthKey(viewMonth))}>‹</button>
          </div>
        }
      />
      <div className="flex flex-col gap-4 px-4">
        {viewMonth === s.month && <BudgetSuggest onCustom={() => open("total")} />}
        <button onClick={() => open("total")} className="card p-5 text-start active:scale-[0.99]" style={{ background: "#CDEBB8" }}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-extrabold">{isPast ? "بودجه کل این ماه (گذشته)" : "بودجه کل این ماه"}</span>
            <span className="chip">✏️ تغییر</span>
          </div>
          {total > 0 ? (
            <>
              <div className="font-display num mt-1 text-5xl">{short(total)} <span className="text-lg">تومان</span></div>
              <div className="num text-sm font-bold text-ink-soft" dir="ltr">{usd(total, s.rate) ?? ""}</div>
              <div className="mt-3"><Bar value={spent} max={total} h={18} /></div>
              <div className="mt-1 text-xs font-bold">خرج‌شده {short(spent)} · مونده {short(Math.max(0, total - spent))}</div>
            </>
          ) : (
            <div className="mt-2 text-center">
              <div className="text-4xl">🥧</div>
              <p className="font-display mt-1 text-xl">یه عدد بذار، بقیه‌اش با ما</p>
              <p className="text-sm text-ink-soft">مثلاً ۴۰ میلیون برای کل خرج‌های خونه</p>
            </div>
          )}
        </button>

        {total > 0 && (
          <>
            <p className="px-1 text-sm text-ink-soft">
              بودجه خودکار بین دسته‌ها تقسیم شده. هر چی واقعاً خرج می‌کنی، ماه به ماه دقیق‌ترش می‌کنه. اگه دسته‌ای رو خودت می‌خوای، روش بزن.
            </p>
            {(Object.keys(GROUPS) as Group[]).map((g) => (
              <section key={g}>
                <h2 className="font-display mb-2 px-1 text-2xl">{GROUPS[g].label}</h2>
                <div className="flex flex-col gap-2">
                  {CATEGORIES.filter((c) => c.group === g).map((c) => {
                    const b = s.budgetFor(c.key, viewMonth);
                    const sp = s.spentIn(viewMonth, c.key);
                    const manual = s.isManual(c.key, viewMonth);
                    if (!b && !sp) return null;
                    return (
                      <button key={c.key} onClick={() => open(c.key)} className="card-flat flex flex-col gap-2 p-3 text-start active:scale-[0.99]">
                        <div className="flex items-center gap-3">
                          <Sticker cat={c.key} size={38} />
                          <div className="flex-1">
                            <div className="font-extrabold">{c.label}</div>
                            <div className="text-[11px] font-bold text-ink-soft">{manual ? "✋ دستی" : "✨ خودکار"}</div>
                          </div>
                          <div className="num text-end text-sm font-extrabold">
                            {short(sp)} <span className="text-ink-soft">از {short(b)}</span>
                          </div>
                        </div>
                        {b > 0 && <Bar value={sp} max={b} color={c.color} h={12} />}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      <Sheet open={!!mode} onClose={() => setMode(null)} title={mode === "total" ? "🥧 بودجه کل ماه" : mode ? `${catOf(mode).emoji} ${catOf(mode).label}` : ""}>
        <div className="flex flex-col gap-3">
          <input autoFocus className="field num text-xl font-bold" inputMode="decimal" placeholder="مثلاً ۴۰ میلیون" value={val} onChange={(e) => setVal(e.target.value)} />
          <div className="num flex justify-between px-1 text-sm font-bold text-ink-soft">
            <span>{toman ? `${fa(toman)} تومان` : ""}</span>
            <span dir="ltr">{toman && usd(toman, s.rate) ? `≈ ${usd(toman, s.rate)}` : ""}</span>
          </div>
          {isPast ? (
            <div className="card-flat p-3 text-sm font-bold" style={{ background: "#FFE1D8" }}>
              ⚠️ این ماه تموم شده. تغییر بودجه‌اش پاداش صندوق و حساب‌وکتاب اون ماه رو عوض می‌کنه و ممکنه عددهای قبلی تغییر کنن. بهتره دست نزنی. ولی اگه مطمئنی، می‌تونی.
            </div>
          ) : (
            <p className="text-xs text-ink-soft">از این ماه به بعد اعمال می‌شه. ماه‌های گذشته دست نمی‌خوره.</p>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              className="btn btn-tomato"
              disabled={toman === null}
              onClick={async () => {
                if (isPast && !sure) return setSure(true);
                if (mode === "total") await s.setTotalBudget(toman ?? 0, viewMonth);
                else await s.setCategoryBudget(mode!, toman ?? 0, viewMonth);
                setMode(null);
                setSure(false);
              }}
            >
              {isPast ? (sure ? "آره، تغییر بده" : "تغییر بودجه ماه گذشته") : "ذخیره"}
            </button>
            {mode !== "total" && s.isManual(mode ?? "", viewMonth) && (
              <button className="btn bg-white" onClick={async () => { await s.setCategoryBudget(mode!, 0, viewMonth); setMode(null); }}>برگرد به خودکار</button>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}
