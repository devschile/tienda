-- 01_create_products_schema.sql
-- Esquema base de productos para Tienda devsChile™ (NeonDB / Postgres)
-- Basado en los tipos de app/types/products.ts y app/productsMock.ts

create table if not exists products (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  price integer not null check (price >= 0),
  visible boolean not null default true,
  created_time timestamptz not null default now()
);

create index if not exists idx_products_category on products (category);
create index if not exists idx_products_visible on products (visible);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_image_variant') then
    create type product_image_variant as enum ('thumbnail', 'large');
  end if;
end $$;

-- Guarda tanto thumbnailImages como largeImages en una sola tabla,
-- diferenciados por "variant" y ordenados por "position" (soporta
-- múltiples imágenes por producto y variante, igual que el mock).
create table if not exists product_images (
  id text not null,
  product_id text not null references products (id) on delete cascade,
  variant product_image_variant not null,
  position integer not null default 0,
  url text not null,
  filename text not null,
  size integer not null,
  type text not null,
  width integer,
  height integer,
  primary key (product_id, variant, position)
);

create index if not exists idx_product_images_product_id on product_images (product_id);
