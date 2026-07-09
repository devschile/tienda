-- 03_add_stock_and_available.sql
-- Agrega gestión de stock y disponibilidad a la tabla products.
--
-- Semántica:
--   visible    → el producto está publicado/visible en el catálogo (control manual del admin).
--   available → el producto se puede comprar ahora (se fuerza a false vía trigger cuando stock=0;
--               el admin puede dejarlo en false manualmente aunque haya stock para pausar ventas).
--   stock     → unidades disponibles (integer >= 0).

-- 1. Nuevas columnas
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock     integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT true;

-- 2. Función del trigger: si stock llega a 0 o menos, forzar available = false.
--    No fuerza available = true al reponer stock (el admin lo activa manualmente).
CREATE OR REPLACE FUNCTION fn_sync_available_on_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock <= 0 THEN
    NEW.available := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger BEFORE INSERT OR UPDATE (cubre toda operación, sin excepción de columna).
DROP TRIGGER IF EXISTS trg_sync_available ON products;
CREATE TRIGGER trg_sync_available
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_available_on_stock();

-- 4. Inicializar stock de los productos semilla.
--    El UPDATE dispara el trigger, que verifica la consistencia stock/available.
UPDATE products
SET stock = 10, available = true
WHERE id IN ('rec1', 'rec2', 'rec3');
