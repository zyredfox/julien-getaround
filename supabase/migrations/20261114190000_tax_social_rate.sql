-- Prélèvements sociaux (CSG/CRDS/solidarité) sur la base taxable micro-BIC
alter table public.tax_settings
  add column if not exists social_rate_percent numeric(5,2) not null default 17.2;
