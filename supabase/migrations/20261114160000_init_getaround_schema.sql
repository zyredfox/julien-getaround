-- Applied remotely via Supabase MCP (project julien-getaround).
-- Kept locally for reference / future CLI sync.

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('getaround', 'pea', 'crypto', 'other')),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  plate text,
  make_model text,
  acquisition_cost numeric(12,2),
  acquisition_on date,
  amort_months integer,
  active_from date,
  created_at timestamptz not null default now()
);

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  gross_amount numeric(12,2) not null default 0,
  platform_fees numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  constraint rentals_dates_check check (end_at >= start_at)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  spent_on date not null,
  category text not null check (category in (
    'insurance',
    'getaround_box',
    'tires_repair',
    'fuel',
    'platform_fees',
    'cost_basis',
    'other'
  )),
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.tax_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  mode text not null default 'simplified_real' check (mode in ('flat_rate', 'simplified_real', 'micro_bic_like')),
  flat_rate_percent numeric(5,2) not null default 30,
  micro_allowance_percent numeric(5,2) not null default 50,
  notes text,
  created_at timestamptz not null default now(),
  unique (owner_id, space_id)
);

create index rentals_owner_start_idx on public.rentals (owner_id, start_at desc);
create index expenses_owner_spent_idx on public.expenses (owner_id, spent_on desc);
create index vehicles_owner_idx on public.vehicles (owner_id);

alter table public.spaces enable row level security;
alter table public.vehicles enable row level security;
alter table public.rentals enable row level security;
alter table public.expenses enable row level security;
alter table public.tax_settings enable row level security;

create policy spaces_owner_all on public.spaces
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy vehicles_owner_all on public.vehicles
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy rentals_owner_all on public.rentals
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy expenses_owner_all on public.expenses
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy tax_settings_owner_all on public.tax_settings
  for all to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
