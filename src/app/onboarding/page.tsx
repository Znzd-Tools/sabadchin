"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Onboarding() {
  const [tab, setTab] = useState<"new" | "join">("new");
  const [me, setMe] = useState("");
  const [fam, setFam] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const sb = supabaseBrowser();
    const { error } =
      tab === "new"
        ? await sb.rpc("create_family", { fam_name: fam.trim() || "خونه ما", my_name: me.trim() })
        : await sb.rpc("join_family", { code, my_name: me.trim() });
    setBusy(false);
    if (error) {
      setErr(error.message.includes("invalid code") ? "این کد پیدا نشد." : error.message.includes("duplicate") ? "تو قبلاً عضو یه خانواده‌ای." : "یه مشکلی پیش اومد.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-10">
      <div className="text-center">
        <div className="pop text-6xl">🏡</div>
        <h1 className="font-display mt-2 text-4xl">خونه رو راه بندازیم</h1>
      </div>
      <form onSubmit={go} className="card flex flex-col gap-3 p-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="chip justify-center py-2" data-on={tab === "new"} onClick={() => setTab("new")}>خانواده جدید</button>
          <button type="button" className="chip justify-center py-2" data-on={tab === "join"} onClick={() => setTab("join")}>کد دعوت دارم</button>
        </div>
        <input className="field" placeholder="اسم تو (مثلاً علی)" value={me} onChange={(e) => setMe(e.target.value)} required />
        {tab === "new" ? (
          <input className="field" placeholder="اسم خانواده (مثلاً خونه ما)" value={fam} onChange={(e) => setFam(e.target.value)} />
        ) : (
          <input className="field text-center font-extrabold tracking-[0.3em]" dir="ltr" placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required />
        )}
        {err && <p className="text-sm font-bold text-tomato">{err}</p>}
        <button className="btn btn-tomato mt-1 text-lg" disabled={busy}>{busy ? "..." : tab === "new" ? "بساز" : "بپر تو"}</button>
      </form>
    </main>
  );
}
