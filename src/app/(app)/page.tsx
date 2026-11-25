"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, Empty, PageHead, Sheet, Sticker } from "@/components/ui";
import { PRI_BY_KEY, catOf } from "@/lib/categories";
import { fa, short, usd } from "@/lib/format";
import { daysLeftInMonth, monthLabel } from "@/lib/jalali";
import { itemCost, useStore } from "@/lib/store";
import { overdueSuggestions } from "@/lib/suggest";

export default function Home() {
  const s = useStore();
  const { family, me, items, month, rate, ready } = s;
  const [copied, setCopied] = useState(false);

  const budget = s.totalBudget(month);
  const spent = s.spentIn(month);
  const left = budget - spent;
  const { left: daysLeft } = daysLeftInMonth();
  const perDay = left > 0 ? left / daysLeft : 0;

  const must = items.filter((i) => i.status === "todo" && i.priority === "must");
  const todoCount = items.filter((i) => i.status === "todo").length;
  const recent = items.filter((i) => i.status === "bought").slice(0, 4);
  const overdue = useMemo(() => overdueSuggestions(items), [items]);
  const goal = s.goals.find((g) => g.is_active);

  const mood = budget === 0 ? "🙂" : spent > budget ? "😬" : spent > budget * 0.8 ? "😅" : "😎";

  return (
    <>
      <PageHead
        title={`سلام ${me.display_name} ${mood}`}
        sub={`${family.name} · ${monthLabel(month)}`}
        right={
          <button className="chip" onClick={() => setCopied(true)}>
            👥 {fa(s.members.length)}
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4">
        {/* month card */}
        <section className="card overflow-hidden p-5" style={{ background: "#FFE9B0" }}>
          {budget === 0 ? (
            <div className="text-center">
              <div className="text-4xl">🥧</div>
              <p className="font-display mt-1 text-xl">هنوز بودجه ماه رو نذاشتی</p>
              <Link href="/budget" className="btn mt-3 bg-white">یه عدد بذار</Link>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-extrabold">{left >= 0 ? "این ماه مونده" : "از بودجه زدی بالا"}</span>
                <span className="text-xs font-bold text-ink-soft">{fa(daysLeft)} روز مونده</span>
              </div>
              <div className="font-display num mt-1 text-5xl" style={{ color: left >= 0 ? "var(--color-ink)" : "var(--color-tomato)" }}>
                {short(Math.abs(left))} <span className="text-xl">تومان</span>
              </div>
              <div className="my-3"><Bar value={spent} max={budget} color="var(--color-leaf)" h={22} /></div>
              <div className="flex justify-between text-sm font-bold">
                <span>خرج‌شده {short(spent)}</span>
                <span>از {short(budget)}</span>
              </div>
              {left > 0 && (
                <p className="mt-2 text-xs font-bold text-ink-soft">
                  یعنی روزی حدود {short(perDay)} تومان{usd(perDay, rate) ? ` (${usd(perDay, rate)})` : ""} می‌تونی خرج کنی
                </p>
              )}
            </>
          )}
        </section>

        {/* reward fund */}
        <Link href="/fun" className="card flex items-center gap-4 p-4" style={{ background: "#E3DBFF" }}>
          <div className="wobble text-5xl">{goal?.emoji ?? "🎉"}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold">{goal ? goal.title : "صندوق پاداش"}</div>
            <div className="font-display num text-2xl">{short(s.fund.balance)} <span className="text-base">تومان</span></div>
            {goal && <div className="mt-1"><Bar value={s.fund.balance} max={goal.target_toman} color="var(--color-grape)" h={12} /></div>}
          </div>
        </Link>

        {/* must-buy */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-display text-2xl">🔥 ضروری‌ها</h2>
            <Link href="/list" className="text-sm font-extrabold text-ink-soft">همه ({fa(todoCount)})</Link>
          </div>
          {!ready ? null : must.length === 0 ? (
            <Empty emoji="🎈" title="چیز ضروری باز نداریم" hint="دکمه + پایین رو بزن و اضافه کن" />
          ) : (
            <div className="flex flex-col gap-2">
              {must.slice(0, 4).map((i) => (
                <div key={i.id} className="card-flat flex items-center gap-3 p-3">
                  <Sticker cat={i.category} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{i.title}</div>
                    <div className="text-xs text-ink-soft">{catOf(i.category).label}</div>
                  </div>
                  {i.est_toman > 0 && <div className="num text-sm font-extrabold">{short(itemCost(i))}</div>}
                  <button className="btn bg-leaf px-3 py-1.5 text-sm text-white" onClick={() => s.buy(i.id)}>خریدم ✓</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* overdue */}
        {overdue.length > 0 && (
          <section>
            <h2 className="font-display mb-2 px-1 text-2xl">⏰ وقتشه بخریم؟</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {overdue.map((o) => (
                <button
                  key={o.title}
                  className="card-flat flex w-44 shrink-0 flex-col gap-2 p-3 text-start"
                  onClick={() => s.addItem({ title: o.title, category: o.category, priority: "need", est_toman: o.est })}
                >
                  <Sticker cat={o.category} size={36} />
                  <div className="font-extrabold">{o.title}</div>
                  <div className="text-xs text-ink-soft">{fa(o.daysSince)} روزه نخریدیم · معمولاً هر {fa(o.every)} روز</div>
                  <div className="text-xs font-extrabold text-tomato">+ بنداز تو لیست</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* recent */}
        {recent.length > 0 && (
          <section>
            <h2 className="font-display mb-2 px-1 text-2xl">🧾 تازه خریدیم</h2>
            <div className="flex flex-col gap-2">
              {recent.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-1">
                  <Sticker cat={i.category} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{i.title}</div>
                    <div className="text-xs text-ink-soft">{s.nameOf(i.bought_by)} خرید</div>
                  </div>
                  <div className="num font-extrabold">{short(itemCost(i))}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Sheet open={copied} onClose={() => setCopied(false)} title="اعضای خانواده">
        <ul className="mb-4 flex flex-col gap-2">
          {s.members.map((m) => (
            <li key={m.user_id} className="card-flat flex items-center justify-between p-3 font-bold">
              <span>{m.display_name}</span>
              <span className="text-xs text-ink-soft">{m.role === "owner" ? "سرپرست" : "عضو"}</span>
            </li>
          ))}
        </ul>
        <p className="mb-1 text-sm font-bold text-ink-soft">کد دعوت برای عضو جدید:</p>
        <div className="card-flat num p-4 text-center font-display text-4xl tracking-[0.3em]" dir="ltr">{family.invite_code}</div>
        <button className="btn btn-ghost mt-3 w-full text-ink-soft" onClick={s.signOut}>خروج از حساب</button>
      </Sheet>
    </>
  );
}
