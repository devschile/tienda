-- 04_rename_active_to_visible.sql
-- Renombra la columna active → visible en la tabla products
-- para reflejar mejor su semántica (visibilidad en el catálogo).

ALTER TABLE products RENAME COLUMN active TO visible;

-- Renombrar el índice para mantener consistencia
ALTER INDEX IF EXISTS idx_products_active RENAME TO idx_products_visible;
