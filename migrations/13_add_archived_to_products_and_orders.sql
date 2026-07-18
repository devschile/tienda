-- =============================================================================
-- 13_add_archived_to_products_and_orders.sql
-- Agrega soporte de archivado (soft-hide, reversible) para productos y órdenes.
-- =============================================================================
--
-- DISEÑO
-- ------
-- `archived` es un booleano independiente de `visible`/`status`:
--   - Un producto archivado se oculta de TODAS las listas (admin y storefront),
--     y se excluye de cálculos (stock bajo, conteo de productos activos, etc.),
--     sin importar su valor de `visible`/`available`.
--   - Una orden archivada se oculta de las listas del admin y se excluye de
--     los cálculos del dashboard (ingresos, conteo de pedidos, etc.),
--     sin importar su `status`.
-- La acción es reversible: basta con volver `archived` a `false`.
--
-- =============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE orders   ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_archived ON products (archived);
CREATE INDEX IF NOT EXISTS idx_orders_archived   ON orders (archived);

-- =============================================================================
-- Para aplicar esta migración en NeonDB:
--   psql "$NEON_DATABASE_URL" -f migrations/13_add_archived_to_products_and_orders.sql
-- O ejecutar en el SQL Editor de https://console.neon.tech
-- =============================================================================
