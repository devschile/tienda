-- 17_add_presale_to_products.sql
-- Agrega columna presale (boolean) a la tabla products.
-- Cuando es true, el producto muestra un badge "PREVENTA" (⏳) en la ProductCard
-- y en la modal de zoom de imágenes, con fondo verde claro.
--
-- Un producto en preventa NO puede estar en oferta: on_sale y presale son
-- mutuamente excluyentes (se valida con un CHECK constraint y en la API admin).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS presale boolean NOT NULL DEFAULT false;

-- Sanear datos: en caso de que algún registro quedara con ambos flags activos,
-- gana la oferta (se quita presale) para poder crear el constraint sin fallar.
UPDATE products SET on_sale = false WHERE presale = true;

-- Garantizar que un producto no sea simultáneamente oferta y preventa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_presale_on_sale_exclusive' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT chk_presale_on_sale_exclusive
      CHECK (NOT (on_sale AND presale));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_presale ON products (presale);

-- Verificar
-- SELECT id, name, on_sale, presale FROM products ORDER BY name;