export type Group = "daily" | "home" | "life";

export type Category = {
  key: string;
  label: string;
  emoji: string;
  group: Group;
  color: string; // sticker background
  words: string[]; // keywords for auto-detect
};

export const GROUPS: Record<Group, { label: string; hint: string }> = {
  daily: { label: "روزمره", hint: "خوراکی و مصرفی" },
  home: { label: "خانه", hint: "وسایل و تعمیرات" },
  life: { label: "زندگی", hint: "خودمون و بیرون" },
};

export const CATEGORIES: Category[] = [
  { key: "grocery", label: "خواربار", emoji: "🛒", group: "daily", color: "#FFD9A8",
    words: ["روغن","برنج","شکر","چای","قند","ماکارونی","رب","حبوبات","عدس","لوبیا","نخود","آرد","نمک","سرکه","کنسرو","تن ماهی","رشته","ادویه","زرد چوبه","فلفل","سس","مربا","عسل","شیره","دوغ","نسکافه","قهوه"] },
  { key: "produce", label: "میوه و سبزی", emoji: "🥬", group: "daily", color: "#CDEBB8",
    words: ["سیب","پرتقال","موز","خیار","گوجه","سیب زمینی","پیاز","سبزی","هویج","کاهو","نارنگی","هندوانه","خربزه","انگور","لیمو","بادمجان","کدو","فلفل دلمه","میوه","سبزیجات","انار"] },
  { key: "protein", label: "گوشت و مرغ", emoji: "🍗", group: "daily", color: "#FFB8A8",
    words: ["مرغ","گوشت","ماهی","قیمه","چرخ کرده","میگو","سینه","ران","کباب","سوسیس","کالباس","ژامبون","برگر","استیک","گوسفندی","گوساله"] },
  { key: "dairy", label: "لبنیات و تخم‌مرغ", emoji: "🥛", group: "daily", color: "#E8F0FF",
    words: ["شیر","ماست","پنیر","کره","خامه","تخم مرغ","تخم‌مرغ","کشک","بستنی","دوغ","کاکائو"] },
  { key: "snack", label: "نان، تنقلات و شیرینی", emoji: "🍪", group: "daily", color: "#FFE9A0",
    words: ["نان","بربری","سنگک","لواش","آجیل","پفک","چیپس","شکلات","بیسکویت","کیک","شیرینی","خشکبار","پسته","بادام","گردو","کشمش","تنقلات","نوشابه","آبمیوه"] },
  { key: "clean", label: "شوینده و نظافت", emoji: "🧼", group: "daily", color: "#BFE9F2",
    words: ["پودر لباسشویی","مایع ظرفشویی","مایع دستشویی","دستمال","سفیدکننده","شیشه شور","جارو","تی","اسفنج","کیسه زباله","نرم کننده","وایتکس","شوینده","لباسشویی","ظرفشویی","حوله کاغذی","سطل"] },
  { key: "care", label: "بهداشت و آرایش", emoji: "🧴", group: "life", color: "#F6C9E4",
    words: ["شامپو","خمیردندان","مسواک","صابون","کرم","ضدآفتاب","عطر","ادکلن","لاک","رژ","ماسک","تیغ","ژل","نوار بهداشتی","دئودورانت","لوسیون","آرایش","سشوار"] },
  { key: "health", label: "دارو و درمان", emoji: "💊", group: "life", color: "#FFC9C9",
    words: ["دارو","ویتامین","قرص","شربت","دکتر","ویزیت","آزمایش","دندانپزشک","عینک","فیزیوتراپی","بیمه تکمیلی","ماسک طبی","پانسمان","مکمل"] },
  { key: "appliance", label: "لوازم برقی خانه", emoji: "🧊", group: "home", color: "#C9D6FF",
    words: ["یخچال","فریزر","ماشین لباسشویی","ظرفشویی","جاروبرقی","اجاق","گاز","مایکروویو","کولر","پنکه","بخاری","تلویزیون","سشوار","اتو","آبمیوه گیری","غذاساز","هواکش","چای ساز","کتری برقی","پلوپز","هوا پز","توستر","آب سردکن","هود"] },
  { key: "kitchen", label: "ظروف و آشپزخانه", emoji: "🍳", group: "home", color: "#FFD0B0",
    words: ["قابلمه","ماهیتابه","بشقاب","لیوان","قاشق","چنگال","کاسه","سرویس","چاقو","تخته","فلاسک","قوری","سینی","کتری","فر","ظرف","پیمانه"] },
  { key: "furniture", label: "مبلمان و دکور", emoji: "🛋️", group: "home", color: "#E4D2F7",
    words: ["مبل","میز","صندلی","تخت","کمد","فرش","پرده","گلدان","آینه","کتابخانه","رخت‌خواب","تشک","لحاف","ملحفه","بالش","روتختی","قاب","چراغ","لوستر","دکور","گل"] },
  { key: "repair", label: "تعمیرات و ابزار", emoji: "🔧", group: "home", color: "#E0DACB",
    words: ["تعمیر","لوله","نقاشی","رنگ","پیچ","مته","سرویس کولر","لامپ","شیر آب","قفل","ابزار","باتری","سیم","کابل","نصاب","تعمیرکار","برقکار","لوله کش"] },
  { key: "bills", label: "قبوض و شارژ", emoji: "💡", group: "home", color: "#FFF1A8",
    words: ["قبض","برق","آب","گاز","اینترنت","شارژ","شارژ ساختمان","موبایل","تلفن","نت","اجاره","مالیات","عوارض"] },
  { key: "tech", label: "دیجیتال", emoji: "📱", group: "life", color: "#C7F0E1",
    words: ["گوشی","موبایل","لپ‌تاپ","لپتاپ","هدفون","ایرپاد","شارژر","کابل","پاوربانک","مانیتور","موس","کیبورد","تبلت","رم","هارد","اشتراک","اپل","سامسونگ","شیائومی"] },
  { key: "clothes", label: "پوشاک", emoji: "👗", group: "life", color: "#F8C8DC",
    words: ["لباس","کفش","کت","شلوار","پیراهن","مانتو","شال","روسری","جوراب","کیف","ساعت","کاپشن","پالتو","بلوز","تیشرت","دمپایی","زیرپوش","لباس خواب","کلاه","دستکش"] },
  { key: "transport", label: "رفت‌وآمد و خودرو", emoji: "🚗", group: "life", color: "#D6E4FF",
    words: ["بنزین","اسنپ","تپسی","تاکسی","بیمه","بیمه شخص ثالث","معاینه فنی","لاستیک","روغن موتور","تعمیر ماشین","پارکینگ","عوارض","مترو","اتوبوس","کارت","بلیط","شارژ مترو","کارواش","باتری ماشین","ماشین"] },
  { key: "eatout", label: "بیرون و کافه", emoji: "☕", group: "life", color: "#FFDDB5",
    words: ["کافه","رستوران","پیتزا","ساندویچ","فست فود","ناهار بیرون","شام بیرون","اسنپ فود","سفارش غذا","کباب","چلوکباب","قهوه","بستنی","فلافل","کله پاچه","دیزی","صبحانه بیرون"] },
  { key: "fun", label: "تفریح و سرگرمی", emoji: "🎬", group: "life", color: "#E9D5FF",
    words: ["سینما","کتاب","بازی","کنسرت","تئاتر","پارک","استخر","باشگاه","اشتراک نتفلیکس","اسپاتیفای","گیم","پلی استیشن","اسباب بازی","کوهنوردی","شهربازی","ورزش"] },
  { key: "gift", label: "هدیه و مهمانی", emoji: "🎁", group: "life", color: "#FFC7D4",
    words: ["هدیه","کادو","مهمانی","تولد","عیدی","گل","شب یلدا","نوروز","سفره هفت‌سین","هفت سین","عروسی","ختم","کارت هدیه"] },
  { key: "pet", label: "حیوان خانگی", emoji: "🐾", group: "life", color: "#D9F2C2",
    words: ["گربه","سگ","غذای گربه","غذای سگ","شن گربه","ماهی قرمز","قفس","واکسن","دامپزشک","پرنده","قلاده"] },
  { key: "other", label: "متفرقه", emoji: "📦", group: "life", color: "#E8E2D4", words: [] },
];

export const CAT_BY_KEY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
);

export function catOf(key: string): Category {
  return CAT_BY_KEY[key] ?? CAT_BY_KEY.other;
}

function norm(s: string) {
  return s
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌‏]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Guess a category from a free-text title. Longest keyword match wins. */
export function guessCategory(title: string): string | null {
  const t = norm(title);
  if (t.length < 2) return null;
  let best: { key: string; len: number } | null = null;
  for (const c of CATEGORIES) {
    for (const w of c.words) {
      const nw = norm(w);
      if (t.includes(nw) && (!best || nw.length > best.len)) best = { key: c.key, len: nw.length };
    }
  }
  return best?.key ?? null;
}

export const PRIORITIES = [
  { key: "must", label: "ضروری", emoji: "🔥", color: "#FF5A36", soft: "#FFD9CF" },
  { key: "need", label: "لازمه", emoji: "👍", color: "#F5A400", soft: "#FFE9B0" },
  { key: "want", label: "دلم می‌خواد", emoji: "✨", color: "#7A5CFF", soft: "#E3DBFF" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["key"];
export const PRI_BY_KEY = Object.fromEntries(PRIORITIES.map((p) => [p.key, p])) as Record<
  Priority,
  (typeof PRIORITIES)[number]
>;

/** Typical share (%) of monthly living spend for an Iranian household. Sums to 100. */
export const DEFAULT_WEIGHTS: Record<string, number> = {
  grocery: 13, produce: 8, protein: 12, dairy: 6, snack: 4, clean: 4, care: 3, health: 5,
  appliance: 6, kitchen: 2, furniture: 3, repair: 3, bills: 8, tech: 3, clothes: 6,
  transport: 5, eatout: 4, fun: 2, gift: 2, pet: 0, other: 1,
};
