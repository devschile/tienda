-- 09_add_long_description_and_sale_price.sql
-- Agrega descripción enriquecida (Markdown) y precio de oferta a productos.
--
-- long_description: texto en formato Markdown (títulos, listas, negrita).
--   Visible en la modal de zoom del producto con renderizado HTML.
-- sale_price: precio de oferta en CLP. Solo aplica cuando on_sale = true.
--   Se valida que sea menor al precio base.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS sale_price       integer CHECK (sale_price > 0);

-- Garantizar que el precio de oferta sea menor al precio base
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_sale_price_lower' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT chk_sale_price_lower
      CHECK (sale_price IS NULL OR sale_price < price);
  END IF;
END $$;

-- Ejemplo de uso en el SQL Editor de Neon:
--
-- UPDATE products SET
--   long_description = E'# ¿Qué lo hace especial?\n\nDescripción **larga** del producto.\n\n## Características\n\n- Item 1\n- Item 2',
--   sale_price = 22000
-- WHERE id = 'rec2';
