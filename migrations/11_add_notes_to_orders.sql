-- 11_add_notes_to_orders.sql
-- Agrega campo de notas internas al pedido (visible solo en el admin).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS notes text;
