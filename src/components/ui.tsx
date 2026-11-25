"use client";

import { useEffect } from "react";
import { catOf } from "@/lib/categories";

export function Sticker({ cat, size = 44 }: { cat: string; size?: number }) {
  const c = catOf(cat);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center border-2 border-ink"
      style={{ width: size, height: size, borderRadius: size * 0.36, background: c.color, fontSize: size * 0.52 }}
      aria-hidden
    >
      {c.emoji}
    </span>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="بستن" className="fade-in absolute inset-0 bg-ink/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        className="sheet-in card relative w-full max-w-lg rounded-b-none border-b-0 p-5 safe-b"
        style={{ borderRadius: "28px 28px 0 0", boxShadow: "none", maxHeight: "92dvh", overflowY: "auto" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
        {title && <h2 className="font-display mb-3 text-2xl">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, max, color = "var(--color-leaf)", h = 18 }: { value: number; max: number; color?: string; h?: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="relative w-full overflow-hidden border-2 border-ink bg-white" style={{ height: h, borderRadius: h }}>
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: over ? "var(--color-tomato)" : color, borderRadius: h }}
      />
    </div>
  );
}

export function Empty({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div className="card-flat flex flex-col items-center gap-1 border-dashed px-6 py-10 text-center">
      <div className="wobble text-5xl">{emoji}</div>
      <div className="font-display mt-2 text-xl">{title}</div>
      {hint && <div className="text-sm text-ink-soft">{hint}</div>}
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <header className="safe-t flex items-end justify-between px-5 pb-3 pt-4">
      <div>
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {sub && <p className="text-sm text-ink-soft">{sub}</p>}
      </div>
      {right}
    </header>
  );
}
