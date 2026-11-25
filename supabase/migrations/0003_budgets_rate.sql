-- USDT/Toman rate at the time a budget was set, so next month's suggestion can be inflation-aware.
alter table public.budgets add column if not exists rate numeric check (rate is null or rate > 0);
