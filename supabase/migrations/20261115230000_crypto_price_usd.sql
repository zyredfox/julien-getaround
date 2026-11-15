-- Applied remotely via Supabase MCP (project julien-getaround).

alter table public.crypto_positions
  add column if not exists last_price_usd numeric(18,8);
