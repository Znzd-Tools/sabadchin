"use client";

import { useEffect, useState } from "react";
import { Sheet, Sticker } from "@/components/ui";
import { fa, parseToman, short, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

/** Asked when you tick "bought" on an item that has no price. Optional: you can skip it. */
export default function PriceSheet() {
  const { askingPrice: it, answerPrice, lastPrice, rate } = useStore();
  const [val, setVal] = useState("");
  useEffect(() => setVal(""), [it?.id]);

  const last = it ? lastPrice(it.title) : null;
  const toman = parseToman(val);

  return (
    <Sheet open={!!it} onClose={() => answerPrice(null)}>
      {it && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            answerPrice(toman && toman > 0 ? toman : null);
          }}
        >
          <div className="flex items-center gap-3">
            <Sticker cat={it.category} size={48} />
            <div>
              <div className="text-sm font-bold text-ink-soft">خریدی. چقدر شد؟</div>
              <div className="font-display text-2xl">{it.title}</div>
            </div>
          </div>
          <input
            autoFocus
            className="field num text-xl font-bold"
            inputMode="decimal"
            placeholder="مثلاً ۲۵۰ هزار"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
          <div className="num flex h-5 justify-between px-1 text-sm font-bold text-ink-soft">
            <span>{toman ? `${fa(toman)} تومان` : ""}</span>
            <span dir="ltr">{toman && usd(toman, rate) ? `≈ ${usd(toman, rate)}` : ""}</span>
          </div>
          {last && (
            <button type="button" className="chip self-start" onClick={() => setVal(String(last))}>
              💡 دفعه قبل {short(last)} تومان بود
            </button>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button className="btn btn-tomato" disabled={!toman}>ثبت قیمت</button>
            <button type="button" className="btn bg-white" onClick={() => answerPrice(null)}>بدون قیمت</button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
