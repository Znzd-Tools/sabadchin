"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import QuickAdd from "@/components/quick-add";

const TABS = [
  { href: "/", label: "خونه", icon: "🏠" },
  { href: "/list", label: "لیست", icon: "📝" },
  { href: "/budget", label: "بودجه", icon: "🥧" },
  { href: "/fun", label: "پاداش", icon: "🎉" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-32">
      {children}

      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4">
        <div className="card relative grid grid-cols-5 items-center px-1 py-1.5" style={{ borderRadius: 28 }}>
          {[TABS[0], TABS[1]].map((t) => <Tab key={t.href} t={t} on={path === t.href} />)}
          <div className="flex justify-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="اضافه کن"
              className="btn btn-tomato -mt-9 h-16 w-16 rounded-[22px] p-0 text-4xl leading-none"
              style={{ boxShadow: "var(--shadow)" }}
            >
              +
            </button>
          </div>
          {[TABS[2], TABS[3]].map((t) => <Tab key={t.href} t={t} on={path === t.href} />)}
        </div>
      </nav>

      <QuickAdd open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function Tab({ t, on }: { t: (typeof TABS)[number]; on: boolean }) {
  return (
    <Link href={t.href} className="flex flex-col items-center gap-0.5 rounded-2xl py-1.5" style={{ background: on ? "var(--color-mango)" : "transparent" }}>
      <span className="text-xl">{t.icon}</span>
      <span className="text-[11px] font-extrabold">{t.label}</span>
    </Link>
  );
}
