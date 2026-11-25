-- Shared fallback USDT/Toman rate for the family (live fetch is preferred when it works).
alter table public.families
  add column if not exists usd_rate bigint check (usd_rate is null or usd_rate > 0),
  add column if not exists usd_rate_at timestamptz,
  add column if not exists usd_rate_manual boolean not null default false;
