-- سبدچین: initial schema. Run in the Supabase SQL editor or via `supabase db push`.

-- ───────── tables ─────────
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  reward_pct int not null default 50 check (reward_pct between 0 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create unique index members_one_family_per_user on public.members(user_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  priority text not null default 'need' check (priority in ('must','need','want')),
  qty int not null default 1 check (qty > 0),
  est_toman bigint not null default 0 check (est_toman >= 0),
  actual_toman bigint check (actual_toman >= 0),
  rate numeric,                     -- Toman per 1 USDT when price was entered
  status text not null default 'todo' check (status in ('todo','bought')),
  bought_at timestamptz,
  bought_by uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index items_family_status on public.items(family_id, status);

-- Budget rows are per month; the effective budget for a month is the latest row <= that month.
create table public.budgets (
  family_id uuid not null references public.families(id) on delete cascade,
  category text not null,
  month text not null,              -- Jalali 'YYYY-MM'
  amount_toman bigint not null check (amount_toman >= 0),
  primary key (family_id, category, month)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  emoji text not null default '🏖️',
  target_toman bigint not null check (target_toman > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Manual deposits (+) and withdrawals (-) of the fun fund. Rewards are computed, not stored.
create table public.fund_moves (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  amount_toman bigint not null,
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ───────── helpers ─────────
create or replace function public.is_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.family_id = fid and m.user_id = auth.uid());
$$;

create or replace function public.make_invite_code()
returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.create_family(fam_name text, my_name text)
returns public.families language plpgsql security definer set search_path = public as $$
declare f public.families;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.families(name, invite_code, created_by)
    values (fam_name, public.make_invite_code(), auth.uid()) returning * into f;
  insert into public.members(family_id, user_id, display_name, role)
    values (f.id, auth.uid(), my_name, 'owner');
  return f;
end $$;

create or replace function public.join_family(code text, my_name text)
returns public.families language plpgsql security definer set search_path = public as $$
declare f public.families;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into f from public.families where invite_code = upper(trim(code));
  if not found then raise exception 'invalid code'; end if;
  insert into public.members(family_id, user_id, display_name) values (f.id, auth.uid(), my_name);
  return f;
end $$;

-- ───────── RLS ─────────
alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.items enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.fund_moves enable row level security;

create policy fam_read on public.families for select using (public.is_member(id));
create policy fam_update on public.families for update using (public.is_member(id));

create policy mem_read on public.members for select using (public.is_member(family_id));

create policy items_all on public.items for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));
create policy budgets_all on public.budgets for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));
create policy goals_all on public.goals for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));
create policy moves_all on public.fund_moves for all
  using (public.is_member(family_id)) with check (public.is_member(family_id));

-- Realtime so both phones update live.
alter publication supabase_realtime add table public.items, public.budgets, public.goals, public.fund_moves;

-- Only signed-in users may call the family functions.
revoke execute on function public.create_family(text, text) from public, anon;
revoke execute on function public.join_family(text, text) from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;
grant execute on function public.create_family(text, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
