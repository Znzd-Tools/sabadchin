# سبدچین

وب‌اپ خانوادگی خرج‌های خونه. Next.js 16 + Tailwind 4 + Supabase، روی Vercel.

## راه‌اندازی

1. یه پروژه Supabase بساز و محتوای `supabase/migrations/0001_init.sql` رو توی SQL editor اجرا کن.
2. توی Supabase: Authentication → Providers → Email → گزینه «Confirm email» رو خاموش کن (برای دو نفر لازم نیست).
3. `.env.local` رو از روی `.env.example` پر کن.
4. `npm install && npm run dev`
5. روی Vercel دیپلوی کن و همون دو متغیر Supabase رو اضافه کن.

## نرخ دلار

`/api/rate` قیمت USDT رو از آبان‌تتر می‌گیره (`ABAN_RATE_URL` قابل تغییره). اگه جواب نداد، آخرین نرخ ذخیره‌شده روی گوشی استفاده می‌شه.
