-- 07_add_on_sale.sql
-- Agrega columna on_sale (boolean) a la tabla products.
-- Cuando es true, el producto muestra un badge "OFERTA" en la ProductCard
-- y en la modal de zoom de imágenes.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS on_sale boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products (on_sale);

-- Verificar
-- SELECT id, name, on_sale FROM products ORDER BY name;
