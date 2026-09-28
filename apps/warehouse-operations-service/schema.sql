create extension if not exists pgcrypto;
create table if not exists storage_locations(
  id uuid primary key default gen_random_uuid(), code varchar(50) not null unique,
  name varchar(120) not null, capacity integer not null check(capacity>0),
  inventory_location_id uuid not null unique, default_putaway boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists storage_locations_one_default_putaway on storage_locations(default_putaway) where default_putaway=true;
create table if not exists warehouse_tasks(
  id uuid primary key default gen_random_uuid(), task_type varchar(20) not null check(task_type in ('PUTAWAY','PICK','TRANSFER')),
  product_id uuid not null, quantity integer not null check(quantity>0), source_location_id uuid not null references storage_locations(id),
  destination_location_id uuid not null references storage_locations(id), reference_id uuid, status varchar(20) not null default 'OPEN',
  created_at timestamptz not null default now(), completed_at timestamptz
);
create unique index if not exists warehouse_task_event_product_unique on warehouse_tasks(task_type,reference_id,product_id) where reference_id is not null;
create table if not exists warehouse_transfers(
  id uuid primary key default gen_random_uuid(), task_id uuid not null unique references warehouse_tasks(id), product_id uuid not null,
  quantity integer not null, source_location_id uuid not null references storage_locations(id), destination_location_id uuid not null references storage_locations(id), transferred_at timestamptz not null default now()
);
create table if not exists location_inventory(
  id uuid primary key default gen_random_uuid(), product_id uuid not null, location_id uuid not null references storage_locations(id), quantity integer not null check(quantity>=0), unique(product_id,location_id)
);
create table if not exists processed_events(event_id varchar(100) primary key,processed_at timestamptz not null default now());
