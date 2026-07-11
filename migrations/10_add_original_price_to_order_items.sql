-- 10_add_original_price_to_order_items.sql
-- Guarda el precio original junto al precio efectivo pagado en cada ítem.
-- Permite mostrar "~~$30.000~~ $22.000" en los emails de confirmación.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS original_unit_price integer;

-- Para ítems ya existentes, original = unit_price (sin descuento conocido)
UPDATE order_items SET original_unit_price = unit_price WHERE original_unit_price IS NULL;
