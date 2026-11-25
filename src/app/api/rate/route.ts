import { NextResponse } from "next/server";

// USDT price in Toman from Abantether. The exact endpoint is configurable because
// exchanges change them without notice. The parser accepts several response shapes.
const URL_ = process.env.ABAN_RATE_URL ?? "https://abantether.com/management/all-coins/?format=json";

type Json = unknown;

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
        if (Number.isFinite(v) && v > 1000) return v; // toman range sanity check
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
  try {
    const r = await fetch(URL_, { next: { revalidate: 300 }, headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`status ${r.status}`);
    let rate = findUsdt(await r.json());
    if (rate && rate > 400_000) rate = rate / 10; // looks like Rial → Toman
    if (!rate) throw new Error("USDT not found");
    return NextResponse.json({ rate: Math.round(rate), source: "abantether", at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ rate: null, error: String(e) }, { status: 502 });
  }
}
