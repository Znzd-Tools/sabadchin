import { NextResponse } from "next/server";

// USDT price in Toman. Tries several sources in order and reports which one answered.
// Every endpoint here is configurable/replaceable: exchanges change them without notice.
type Json = unknown;

const SOURCES: { name: string; url: string; pick: (j: Json) => number | null }[] = [
  {
    name: "abantether",
    url: process.env.ABAN_RATE_URL ?? "https://abantether.com/management/all-coins/?format=json",
    pick: findUsdt,
  },
  {
    name: "nobitex",
    url: "https://api.nobitex.ir/v3/orderbook/USDTIRT",
    pick: (j) => {
      const o = j as { lastTradePrice?: string };
      const v = Number(o?.lastTradePrice);
      return Number.isFinite(v) && v > 0 ? v : null;
    },
  },
];

function findUsdt(node: Json): number | null {
  if (Array.isArray(node)) {
    for (const x of node) {
      const r = findUsdt(x);
      if (r) return r;
    }
    return null;
  }
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    const sym = String(o.symbol ?? o.coin ?? o.name ?? "").toUpperCase();
    if (sym === "USDT") {
      for (const k of ["priceBuy", "price_buy", "buy", "price", "priceSell", "sell"]) {
        const v = Number(o[k]);
        if (Number.isFinite(v) && v > 1000) return v;
      }
    }
    for (const v of Object.values(o)) {
      const r = findUsdt(v);
      if (r) return r;
    }
  }
  return null;
}

export async function GET() {
  const errors: string[] = [];
  for (const s of SOURCES) {
    try {
      const r = await fetch(s.url, { next: { revalidate: 300 }, headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error(`status ${r.status}`);
      let rate = s.pick(await r.json());
      if (rate && rate > 1_000_000) rate = rate / 10; // Rial → Toman
      if (!rate || rate < 1000) throw new Error("no usable price");
      return NextResponse.json({ rate: Math.round(rate), source: s.name, at: new Date().toISOString() });
    } catch (e) {
      errors.push(`${s.name}: ${String(e)}`);
    }
  }
  return NextResponse.json({ rate: null, errors }, { status: 502 });
}
