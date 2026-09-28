create extension if not exists pgcrypto;
create table if not exists sales(id uuid primary key default gen_random_uuid(),store_id varchar(120) not null,register_id varchar(120) not null,cashier_id varchar(120) not null,total integer not null check(total>=0),currency varchar(3) not null,status varchar(20) not null,created_at timestamptz not null default now());
create table if not exists sale_items(id uuid primary key default gen_random_uuid(),sale_id uuid not null references sales(id),product_id uuid not null,quantity integer not null check(quantity>0),unit_price integer not null check(unit_price>=0),unit_cost integer not null default 0 check(unit_cost>=0),location_id uuid);
create table if not exists sale_payments(id uuid primary key default gen_random_uuid(),sale_id uuid not null references sales(id),method varchar(20) not null,amount integer not null check(amount>=0));

create table if not exists event_outbox(event_id uuid primary key,event_type varchar(100) not null,payload jsonb not null,attempts integer not null default 0,last_error varchar(1000),next_attempt_at timestamptz not null default now(),created_at timestamptz not null default now(),published_at timestamptz);
create index if not exists event_outbox_pending_idx on event_outbox(next_attempt_at,created_at) where published_at is null;
