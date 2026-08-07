-- 14_add_channel_to_orders.sql
-- Registra el canal de compra (web o CLI) para poder distinguirlas en el admin.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web'
    CHECK (channel IN ('web', 'cli'));
