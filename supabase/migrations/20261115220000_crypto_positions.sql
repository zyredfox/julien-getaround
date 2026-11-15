-- Applied remotely via Supabase MCP (project julien-getaround).

create table public.crypto_positions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  ticker text not null,
  isin text,
  label text not null,
  quantity numeric(24,12) not null default 0 check (quantity >= 0),
  avg_cost numeric(18,8) not null default 0 check (avg_cost >= 0),
  last_price numeric(18,8),
  last_price_on date,
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crypto_positions_owner_idx on public.crypto_positions (owner_id);
create index crypto_positions_space_idx on public.crypto_positions (space_id);

alter table public.crypto_positions enable row level security;

create policy crypto_positions_owner_all on public.crypto_positions
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
