"use client";

import { useState } from "react";
import { Empty, PageHead, Sheet, Sticker } from "@/components/ui";
import { CATEGORIES, PRIORITIES, PRI_BY_KEY, catOf, type Priority } from "@/lib/categories";
import { fa, parseToman, short, usd } from "@/lib/format";
import { dayLabel } from "@/lib/jalali";
import { itemCost, useStore, type Item } from "@/lib/store";

export default function ListPage() {
  const s = useStore();
  const [tab, setTab] = useState<"todo" | "bought">("todo");
  const [edit, setEdit] = useState<Item | null>(null);
  const [cat, setCat] = useState<string | null>(null);

  const todo = s.items.filter((i) => i.status === "todo" && (!cat || i.category === cat));
  const bought = s.items.filter((i) => i.status === "bought" && (!cat || i.category === cat)).sort((a, b) => (b.bought_at ?? "").localeCompare(a.bought_at ?? ""));
  const todoTotal = todo.reduce((t, i) => t + itemCost(i), 0);
  const usedCats = CATEGORIES.filter((c) => s.items.some((i) => i.category === c.key && i.status === tab));

  return (
    <>
      <PageHead title="لیست خرید" sub={tab === "todo" && todoTotal ? `جمع تخمینی ${short(todoTotal)} تومان${usd(todoTotal, s.rate) ? ` · ${usd(todoTotal, s.rate)}` : ""}` : undefined} />

      <div className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          <button className="chip justify-center py-2.5 text-base" data-on={tab === "todo"} onClick={() => setTab("todo")}>باید بخریم ({fa(s.items.filter((i) => i.status === "todo").length)})</button>
          <button className="chip justify-center py-2.5 text-base" data-on={tab === "bought"} onClick={() => setTab("bought")}>خریدیم</button>
        </div>

        {usedCats.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <button className="chip" data-on={!cat} onClick={() => setCat(null)}>همه</button>
            {usedCats.map((c) => (
              <button key={c.key} className="chip" data-on={cat === c.key} onClick={() => setCat(cat === c.key ? null : c.key)}>{c.emoji} {c.label}</button>
            ))}
          </div>
        )}

        {tab === "todo" ? (
          todo.length === 0 ? (
            <Empty emoji="🧺" title="سبد خالیه" hint="با دکمه + هر چی لازمه رو بنداز تو" />
          ) : (
            PRIORITIES.map((p) => {
              const rows = todo.filter((i) => i.priority === p.key);
              if (!rows.length) return null;
              return (
                <section key={p.key}>
                  <h2 className="font-display mb-2 px-1 text-xl">{p.emoji} {p.label}</h2>
                  <div className="flex flex-col gap-2">
                    {rows.map((i) => <Row key={i.id} i={i} onOpen={() => setEdit(i)} />)}
                  </div>
                </section>
              );
            })
          )
        ) : bought.length === 0 ? (
          <Empty emoji="🧾" title="هنوز خریدی ثبت نشده" />
        ) : (
          <div className="flex flex-col gap-2">
            {bought.map((i) => <Row key={i.id} i={i} onOpen={() => setEdit(i)} />)}
          </div>
        )}
      </div>

      <EditSheet item={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function Row({ i, onOpen }: { i: Item; onOpen: () => void }) {
  const s = useStore();
  const done = i.status === "bought";
  const d = usd(itemCost(i), done ? i.rate ?? s.rate : s.rate);
  return (
    <div className="card-flat flex items-center gap-3 p-3" style={{ opacity: done ? 0.85 : 1 }}>
      <button
        aria-label={done ? "برگردون به لیست" : "خریدم"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink text-lg active:scale-90"
        style={{ background: done ? "var(--color-leaf)" : "#fff", color: "#fff" }}
        onClick={() => (done ? s.undoBought(i.id) : s.markBought(i.id))}
      >
        {done ? "✓" : ""}
      </button>
      <button className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={onOpen}>
        <Sticker cat={i.category} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold" style={{ textDecoration: done ? "line-through" : "none" }}>
            {i.title}{i.qty > 1 ? ` ×${fa(i.qty)}` : ""}
          </div>
          <div className="truncate text-xs text-ink-soft">
            {catOf(i.category).label}
            {done && i.bought_at ? ` · ${s.nameOf(i.bought_by)} · ${dayLabel(i.bought_at)}` : ""}
          </div>
        </div>
        {itemCost(i) > 0 && (
          <div className="text-end">
            <div className="num font-extrabold">{short(itemCost(i))}</div>
            {d && <div className="num text-[11px] font-bold text-ink-soft" dir="ltr">{d}</div>}
          </div>
        )}
      </button>
    </div>
  );
}

function EditSheet({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const s = useStore();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pri, setPri] = useState<Priority>("need");
  const [cat, setCat] = useState("other");
  const [qty, setQty] = useState(1);
  const [key, setKey] = useState<string | null>(null);

  if (item && key !== item.id) {
    setKey(item.id);
    setTitle(item.title);
    setPrice(String((item.status === "bought" ? item.actual_toman : item.est_toman) ?? 0));
    setPri(item.priority);
    setCat(item.category);
    setQty(item.qty);
  }
  const toman = parseToman(price) ?? 0;

  async function save() {
    if (!item) return;
    const patch: Partial<Item> = { title: title.trim() || item.title, priority: pri, category: cat, qty };
    if (item.status === "bought") patch.actual_toman = toman;
    else patch.est_toman = toman;
    await s.updateItem(item.id, patch);
    setKey(null);
    onClose();
  }

  return (
    <Sheet open={!!item} onClose={() => { setKey(null); onClose(); }} title="ویرایش">
      {item && (
        <div className="flex flex-col gap-3">
          <input className="field text-lg font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="field num font-bold" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="قیمت واحد" />
            <div className="card-flat flex items-center gap-3 px-3">
              <button className="text-2xl font-extrabold" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="num w-5 text-center font-extrabold">{fa(qty)}</span>
              <button className="text-2xl font-extrabold" onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>
          <div className="num px-1 text-sm font-bold text-ink-soft">
            {toman ? `${fa(toman * qty)} تومان` : ""} {usd(toman * qty, s.rate) ? ` ≈ ${usd(toman * qty, s.rate)}` : ""}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button key={p.key} onClick={() => setPri(p.key)} className="rounded-2xl border-2 border-ink py-2 text-sm font-extrabold" style={{ background: pri === p.key ? p.color : p.soft, color: pri === p.key ? "#fff" : "inherit" }}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {CATEGORIES.map((c) => <button key={c.key} className="chip" data-on={cat === c.key} onClick={() => setCat(c.key)}>{c.emoji} {c.label}</button>)}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button className="btn btn-tomato" onClick={save}>ذخیره</button>
            <button className="btn bg-white" onClick={async () => { await s.removeItem(item.id); setKey(null); onClose(); }}>🗑️ حذف</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
