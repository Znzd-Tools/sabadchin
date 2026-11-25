"use client";

import Link from "next/link";
import { fa, short, usd } from "@/lib/format";
import { monthLabel } from "@/lib/jalali";
import { useStore } from "@/lib/store";

/** Shown while the new month has no confirmed budget. Dollar-aware suggestion from past months. */
export default function BudgetSuggest({ onCustom }: { onCustom?: () => void }) {
  const { budgetSuggestion: sg, acceptBudget, month, rate } = useStore();
  if (!sg) return null;
  const up = sg.toman >= sg.prevToman ? "بالاتر" : "پایین‌تر";
  const pct = Math.abs(Math.round(((sg.toman - sg.prevToman) / sg.prevToman) * 100));
  return (
    <section className="card p-4" style={{ background: "#FFF1A8" }}>
      <div className="text-sm font-extrabold">🗓️ {monthLabel(month)} شروع شد</div>
      <div className="font-display num mt-1 text-3xl">
        {short(sg.toman)} <span className="text-base">تومان</span>
        {sg.usd ? <span className="num ms-2 text-sm font-bold text-ink-soft" dir="ltr">≈ {usd(sg.toman, rate)}</span> : null}
      </div>
      <p className="mt-1 text-xs font-bold text-ink-soft">
        پیشنهاد بودجه این ماه: {basis(sg.basis)}.
        {pct > 0 ? ` ${fa(pct)}٪ ${up} از ماه قبل (${short(sg.prevToman)}).` : ""}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button className="btn btn-tomato px-2 text-sm" onClick={() => acceptBudget(sg.toman)}>قبول ✓</button>
        <button className="btn bg-white px-2 text-sm" onClick={() => acceptBudget(sg.prevToman)}>همون قبلی</button>
        {onCustom ? (
          <button className="btn bg-white px-2 text-sm" onClick={onCustom}>عدد دیگه</button>
        ) : (
          <Link href="/budget" className="btn bg-white px-2 text-sm">عدد دیگه</Link>
        )}
      </div>
    </section>
  );
}

const basis = (b: string) => b;
