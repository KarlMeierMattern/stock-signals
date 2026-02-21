create extension if not exists "uuid-ossp";

create table stocks (
  id uuid primary key default uuid_generate_v4(),
  symbol text unique not null,
  name text,
  last_sma_status text check (last_sma_status in ('above', 'below')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table alerts (
  id uuid primary key default uuid_generate_v4(),
  stock_id uuid not null references stocks(id) on delete cascade,
  symbol text not null,
  price numeric not null,
  sma_200 numeric not null,
  triggered_at timestamptz not null default now()
);

create index idx_alerts_stock_id on alerts(stock_id);
create index idx_alerts_triggered_at on alerts(triggered_at desc);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stocks_updated_at
  before update on stocks
  for each row
  execute function update_updated_at();
