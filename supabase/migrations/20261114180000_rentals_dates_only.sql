alter table public.rentals drop constraint if exists rentals_dates_check;

alter table public.rentals
  alter column start_at type date using (start_at::date),
  alter column end_at type date using (end_at::date);

alter table public.rentals
  add constraint rentals_dates_check check (end_at >= start_at);
