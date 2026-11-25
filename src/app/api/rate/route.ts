import { NextResponse } from "next/server";

// USDT price in Toman. Tries several sources in order and reports which one answered.
// Every endpoint here is configurable/replaceable: exchanges change them without notice.
type Json = unknown;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const SOURCES: { name: string; url: string; pick: (j: Json) => number | null }[] = [
  ...(process.env.ABAN_RATE_URL ? [{ name: "custom", url: process.env.ABAN_RATE_URL, pick: findUsdt }] : []),
  { name: "abantether-otc", url: "https://api.abantether.com/api/v1/otc/coin-price?coin=USDT", pick: findUsdt },
  { name: "abantether-otc2", url: "https://abantether.com/api/v1/otc/coin-price?coin=USDT", pick: findUsdt },
  { name: "abantether-coins", url: "https://abantether.com/management/all-coins/", pick: findUsdt },
  {
    name: "wallex",
    url: "https://api.wallex.ir/v1/markets",
    pick: (j) => num((j as { result?: { symbols?: Record<string, { stats?: { lastPrice?: string } }> } })?.result?.symbols?.USDTTMN?.stats?.lastPrice),
  },
  { name: "nobitex", url: "https://api.nobitex.ir/v3/orderbook/USDTIRT", pick: (j) => num((j as { lastTradePrice?: string })?.lastTradePrice) },
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

export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.has("debug");
  if (debug) {
    const out = await Promise.all(
      SOURCES.map(async (s) => {
        try {
          const r = await fetch(s.url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
          const t = await r.text();
          let picked: number | null = null;
          try {
            picked = s.pick(JSON.parse(t));
          } catch {}
          return { name: s.name, status: r.status, picked, snippet: t.slice(0, 220) };
        } catch (e) {
          return { name: s.name, error: String(e) };
        }
      }),
    );
    return NextResponse.json(out);
  }

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
