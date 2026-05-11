-- ============================================================
-- KOMFY · Lista de Precios · Schema
-- Run this in Supabase SQL Editor (one shot)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.lines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  number int not null,
  eyebrow text,
  description text,
  highlight_letter text,
  banner_style text not null default 'blue', -- 'blue' | 'cream'
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_groups (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines(id) on delete cascade,
  name text not null,
  base_dimensions text,
  meta_label text,
  thumbnail_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_groups_line_idx
  on public.product_groups(line_id, sort_order);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_group_id uuid not null references public.product_groups(id) on delete cascade,
  name text not null,
  sku text not null unique,
  color_name text not null,
  color_hex text not null,
  color_hex_secondary text,
  dimensions text not null,
  packages int not null default 1,
  price numeric(12,2) not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_group_idx
  on public.products(product_group_id, sort_order);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  period_label text,
  effective_date date,
  contact_email text,
  contact_phone text,
  whatsapp text,
  website_url text,
  cover_subtitle text,
  intro_title text,
  intro_body text,
  stat_lines int,
  stat_skus int,
  stat_finishes int,
  conditions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Public can read, authenticated users can write (= admin)
-- ============================================================

alter table public.lines enable row level security;
alter table public.product_groups enable row level security;
alter table public.products enable row level security;
alter table public.settings enable row level security;

-- Read policies (anyone)
drop policy if exists "lines_read" on public.lines;
create policy "lines_read" on public.lines for select using (true);

drop policy if exists "product_groups_read" on public.product_groups;
create policy "product_groups_read" on public.product_groups for select using (true);

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select using (true);

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings for select using (true);

-- Write policies (authenticated only)
drop policy if exists "lines_write" on public.lines;
create policy "lines_write" on public.lines for all
  to authenticated using (true) with check (true);

drop policy if exists "product_groups_write" on public.product_groups;
create policy "product_groups_write" on public.product_groups for all
  to authenticated using (true) with check (true);

drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products for all
  to authenticated using (true) with check (true);

drop policy if exists "settings_write" on public.settings;
create policy "settings_write" on public.settings for all
  to authenticated using (true) with check (true);

-- ============================================================
-- STORAGE BUCKET for product images
-- ============================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_bucket_read" on storage.objects;
create policy "products_bucket_read" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "products_bucket_insert" on storage.objects;
create policy "products_bucket_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

drop policy if exists "products_bucket_update" on storage.objects;
create policy "products_bucket_update" on storage.objects
  for update to authenticated using (bucket_id = 'products');

drop policy if exists "products_bucket_delete" on storage.objects;
create policy "products_bucket_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products');
