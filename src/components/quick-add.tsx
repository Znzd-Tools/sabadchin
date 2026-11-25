"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, Sticker } from "@/components/ui";
import { CATEGORIES, PRIORITIES, guessCategory, type Priority } from "@/lib/categories";
import { fa, parseToman, short, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, addItem, rate, lastPrice } = useStore();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [catTouched, setCatTouched] = useState(false);
  const [pri, setPri] = useState<Priority>("need");
  const [bought, setBought] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => ref.current?.focus(), 150);
  }, [open]);

  // Frequent titles → one-tap fill (name + category + last price + priority).
  const frequent = useMemo(() => {
    const m = new Map<string, { n: number; last: (typeof items)[number] }>();
    for (const i of items) {
      const k = i.title.trim();
      const e = m.get(k);
      if (!e) m.set(k, { n: 1, last: i });
      else e.n++;
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  }, [items]);

  const guessed = !catTouched ? guessCategory(title) : null;
  const effCat = cat ?? guessed ?? "other";
  const toman = parseToman(price);
  const dollars = toman && usd(toman, rate);
  const remembered = !price && title.trim().length > 1 ? lastPrice(title) : null;

  function reset() {
    setTitle(""); setPrice(""); setCat(null); setCatTouched(false); setPri("need"); setBought(false); setErr(null);
  }

  async function save(keepOpen: boolean) {
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await addItem({ title, category: effCat, priority: pri, est_toman: toman ?? 0, bought });
      reset();
      if (keepOpen) ref.current?.focus();
      else onClose();
    } catch {
      setErr("ذخیره نشد. اینترنتت رو چک کن.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <Sticker cat={effCat} size={52} />
          <input
            ref={ref}
            className="field text-lg font-bold"
            placeholder="چی لازمه؟ مثلاً روغن"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            enterKeyHint="next"
          />
        </div>

        {!title && frequent.length > 0 && (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {frequent.map(([t, { last }]) => (
              <button
                type="button"
                key={t}
                className="chip"
                onClick={() => {
                  setTitle(t);
                  setCat(last.category);
                  setCatTouched(true);
                  setPri(last.priority);
                  const p = last.actual_toman ?? last.est_toman;
                  if (p) setPrice(String(p));
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <div>
          <input
            className="field num text-lg font-bold"
            inputMode="decimal"
            placeholder={bought ? "چقدر شد؟ مثلاً ۲۵۰ هزار" : "قیمت (اختیاری) مثلاً ۲۵۰ هزار"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div className="mt-1 flex h-5 justify-between px-1 text-sm font-bold text-ink-soft">
            <span>{toman ? `${fa(toman)} تومان` : price ? "نفهمیدم 🤔" : ""}</span>
            <span dir="ltr">{dollars ? `≈ ${dollars}` : ""}</span>
          </div>
        </div>

        {remembered && (
          <button type="button" className="chip -mt-1 self-start" onClick={() => setPrice(String(remembered))}>
            💡 دفعه قبل {short(remembered)} تومان بود، همونو بذار
          </button>
        )}

        <div className="grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button
              type="button"
              key={p.key}
              onClick={() => setPri(p.key)}
              className="rounded-2xl border-2 border-ink py-2 text-sm font-extrabold transition-transform active:scale-95"
              style={{ background: pri === p.key ? p.color : p.soft, color: pri === p.key ? "#fff" : "inherit" }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              className="chip"
              data-on={effCat === c.key}
              onClick={() => {
                setCat(c.key);
                setCatTouched(true);
              }}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-extrabold">
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-leaf)]" checked={bought} onChange={(e) => setBought(e.target.checked)} />
          همین الان خریدمش (مستقیم ثبت بشه)
        </label>

        {err && <p className="text-sm font-bold text-tomato">{err}</p>}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button className="btn btn-tomato text-lg" disabled={busy || !title.trim()}>
            {bought ? "ثبت خرید" : "بذار تو لیست"}
          </button>
          <button type="button" className="btn" disabled={busy || !title.trim()} onClick={() => save(true)} title="ذخیره و بعدی">
            + یکی دیگه
          </button>
        </div>
      </form>
    </Sheet>
  );
}
