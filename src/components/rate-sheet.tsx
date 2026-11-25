"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui";
import { fa, parseToman } from "@/lib/format";
import { timeAgoFa } from "@/lib/format";
import { useStore } from "@/lib/store";

export function RateChip({ onClick }: { onClick: () => void }) {
  const { rate } = useStore();
  return (
    <button className="chip" onClick={onClick} title="نرخ دلار">
      {rate ? `💵 ${fa(rate)}` : "💵 نرخ دلار؟"}
    </button>
  );
}

export default function RateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rate, rateInfo, setManualRate } = useStore();
  const [val, setVal] = useState("");
  const n = parseToman(val);
  const src = rateInfo.source === "live" ? "زنده از بازار" : rateInfo.source === "manual" ? "دستی (خودتون زدید)" : rateInfo.source === "saved" ? "آخرین نرخ ذخیره‌شده" : "هنوز نرخی نداریم";

  return (
    <Sheet open={open} onClose={onClose} title="نرخ تتر / دلار">
      <div className="flex flex-col gap-3">
        <div className="card-flat p-4 text-center">
          <div className="font-display num text-4xl">{rate ? fa(rate) : "—"} <span className="text-lg">تومان</span></div>
          <div className="mt-1 text-sm font-bold text-ink-soft">
            {src}
            {rateInfo.at ? ` · ${timeAgoFa(rateInfo.at)}` : ""}
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          دلار همه‌جا با همین نرخ حساب می‌شه. اگه نرخ زنده نیومد، خودت بزن؛ برای هر دو گوشی ذخیره می‌شه.
        </p>
        <input className="field num text-lg font-bold" inputMode="decimal" placeholder="مثلاً ۲۹۲٬۰۰۰" value={val} onChange={(e) => setVal(e.target.value)} />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button className="btn btn-tomato" disabled={!n || n < 1000} onClick={async () => { await setManualRate(n); setVal(""); onClose(); }}>ثبت نرخ دستی</button>
          <button className="btn bg-white" onClick={async () => { await setManualRate(null); onClose(); }}>خودکار</button>
        </div>
      </div>
    </Sheet>
  );
}
