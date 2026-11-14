alter table public.expenses
  add column if not exists is_recurring boolean not null default false,
  add column if not exists repeat_until date;

alter table public.expenses
  drop constraint if exists expenses_repeat_until_check;

alter table public.expenses
  add constraint expenses_repeat_until_check
  check (
    repeat_until is null
    or repeat_until >= date_trunc('month', spent_on)::date
  );
