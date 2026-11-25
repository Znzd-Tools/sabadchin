"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    const { data, error } =
      mode === "in"
        ? await sb.auth.signInWithPassword({ email, password: pass })
        : await sb.auth.signUp({ email, password: pass });
    setBusy(false);
    if (error) {
      setMsg(
        error.message.includes("Invalid login") ? "ایمیل یا رمز اشتباهه." :
        error.message.includes("already") ? "این ایمیل قبلاً ثبت شده. وارد شو." :
        error.message.includes("at least") ? "رمز حداقل ۶ کاراکتر باشه." : "یه مشکلی پیش اومد. دوباره امتحان کن.",
      );
      return;
    }
    if (mode === "up" && !data.session) {
      setMsg("ایمیل تأیید برات رفت. تأیید کن و بعد وارد شو.");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <div className="wobble mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-[30px] border-2 border-ink bg-tomato text-5xl shadow-[-4px_4px_0_0_var(--color-ink)]">🧺</div>
        <h1 className="font-display text-5xl">سبدچین</h1>
        <p className="mt-1 text-ink-soft">خرج خونه، بدون سردرد</p>
      </div>

      <form onSubmit={submit} className="card flex flex-col gap-3 p-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="chip justify-center py-2" data-on={mode === "in"} onClick={() => setMode("in")}>ورود</button>
          <button type="button" className="chip justify-center py-2" data-on={mode === "up"} onClick={() => setMode("up")}>حساب جدید</button>
        </div>
        <input className="field" dir="ltr" type="email" inputMode="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" dir="ltr" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="رمز عبور" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} />
        {msg && <p className="text-sm font-bold text-tomato">{msg}</p>}
        <button className="btn btn-tomato mt-1 text-lg" disabled={busy}>{busy ? "..." : mode === "in" ? "بریم تو" : "بساز"}</button>
      </form>
    </main>
  );
}
