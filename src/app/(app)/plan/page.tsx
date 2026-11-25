"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bar, Empty, PageHead, Sticker } from "@/components/ui";
import { PRIORITIES, catOf } from "@/lib/categories";
import { fa, short, usd } from "@/lib/format";
import { daysLeftInMonth, monthLabel } from "@/lib/jalali";
import { buildPlan, type PlanRow } from "@/lib/plan";
import { useStore } from "@/lib/store";
import { overdueSuggestions } from "@/lib/suggest";

export default function PlanPage() {
  const s = useStore();
  const overdue = useMemo(() => overdueSuggestions(s.items), [s.items]);
  const plan = useMemo(
    () => buildPlan({ items: s.items, budget: s.totalBudget(s.month), spent: s.spentIn(s.month), lastPrice: s.lastPrice, overdue }),
    [s, overdue],
  );
  const { left: daysLeft } = daysLeftInMonth();
  const empty = plan.buy.length === 0 && plan.later.length === 0;

  return (
    <>
      <PageHead title="برنامه این ماه" sub={`${monthLabel(s.month)} · ${fa(daysLeft)} روز مونده`} />
      <div className="flex flex-col gap-4 px-4">
        {plan.available === null ? (
          <div className="card p-4 text-center" style={{ background: "#FFF1A8" }}>
            <div className="text-3xl">🥧</div>
            <p className="font-display mt-1 text-xl">بودجه این ماه رو نذاشتی</p>
            <p className="text-sm text-ink-soft">بدون بودجه نمی‌تونم بگم چی جا می‌شه. همه چیز رو به ترتیب اولویت می‌چینم.</p>
            <Link href="/budget" className="btn mt-3 bg-white">بودجه بذار</Link>
          </div>
        ) : (
          <section className="card p-5" style={{ background: plan.mustOverBudget ? "#FFD9CF" : "#CDEBB8" }}>
            <div className="flex items-baseline justify-between text-sm font-extrabold">
              <span>برای خرید مونده</span>
              <span className="num text-ink-soft">{short(plan.available)} تومان</span>
            </div>
            <div className="font-display num mt-1 text-4xl">
              {short(plan.buyTotal)} <span className="text-base">برنامه‌ریزی‌شده</span>
            </div>
            <div className="num text-sm font-bold text-ink-soft" dir="ltr">{usd(plan.buyTotal, s.rate) ?? ""}</div>
            <div className="my-3"><Bar value={plan.buyTotal} max={plan.available} h={18} /></div>
            {plan.mustOverBudget ? (
              <p className="text-sm font-extrabold">
                🔥 فقط ضروری‌ها {short(plan.mustTotal)} تومان می‌شه، بیشتر از چیزی که از بودجه مونده. یا بودجه رو ببر بالا یا یه چیزی رو کم‌اولویت کن.
              </p>
            ) : (
              <p className="text-sm font-bold">{plan.leftover! > 0 ? `بعد از این خریدها ${short(plan.leftover!)} تومان می‌مونه.` : "بودجه‌ی این ماه رو دقیقاً پر می‌کنه."}</p>
            )}
          </section>
        )}

        {plan.unpriced > 0 && (
          <p className="px-1 text-xs font-bold text-ink-soft">
            ⚠️ {fa(plan.unpriced)} مورد قیمت نداره و عدد صفر حساب شده. قیمت بزنی، برنامه دقیق‌تر می‌شه.
          </p>
        )}

        {empty ? (
          <Empty emoji="🎈" title="چیزی توی لیست نیست" hint="با دکمه + اضافه کن تا برنامه‌ت رو بچینم" />
        ) : (
          <>
            <section>
              <h2 className="font-display mb-2 px-1 text-2xl">🛒 این ماه بخر</h2>
              {plan.buy.length === 0 ? (
                <p className="px-1 text-sm text-ink-soft">با بودجه‌ی فعلی چیزی جا نمی‌شه.</p>
              ) : (
                PRIORITIES.map((p) => {
                  const rows = plan.buy.filter((r) => r.priority === p.key);
                  if (!rows.length) return null;
                  return (
                    <div key={p.key} className="mb-3">
                      <div className="mb-1 px-1 text-sm font-extrabold" style={{ color: p.color }}>{p.emoji} {p.label}</div>
                      <div className="flex flex-col gap-2">{rows.map((r) => <Row key={r.key} r={r} />)}</div>
                    </div>
                  );
                })
              )}
            </section>

            {plan.later.length > 0 && (
              <section>
                <h2 className="font-display mb-1 px-1 text-2xl">⏭️ بیفته ماه بعد</h2>
                <p className="mb-2 px-1 text-xs text-ink-soft">توی بودجه‌ی این ماه جا نمی‌شن. اگه خیلی لازمن، اولویتشون رو ببر روی «ضروری».</p>
                <div className="flex flex-col gap-2 opacity-70">{plan.later.map((r) => <Row key={r.key} r={r} muted />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Row({ r, muted }: { r: PlanRow; muted?: boolean }) {
  const s = useStore();
  return (
    <div className="card-flat flex items-center gap-3 p-3">
      <Sticker cat={r.category} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-extrabold">{r.title}{r.qty > 1 ? ` ×${fa(r.qty)}` : ""}</div>
        <div className="truncate text-xs text-ink-soft">
          {catOf(r.category).label}
          {r.suggestion ? ` · ⏰ ${fa(r.suggestion.daysSince)} روزه نخریدیم` : ""}
        </div>
      </div>
      <div className="text-end">
        <div className="num font-extrabold">{r.priceKnown ? short(r.cost) : "—"}</div>
        {!muted && r.cum > 0 && <div className="num text-[10px] font-bold text-ink-soft">جمع {short(r.cum)}</div>}
      </div>
      {!muted && r.item && (
        <button className="btn bg-leaf px-3 py-1.5 text-sm text-white" onClick={() => s.buy(r.item!.id)}>✓</button>
      )}
      {!muted && r.suggestion && (
        <button
          className="btn px-3 py-1.5 text-sm"
          onClick={() => s.addItem({ title: r.title, category: r.category, priority: "need", est_toman: r.suggestion!.est })}
        >
          + لیست
        </button>
      )}
    </div>
  );
}
