-- =============================================================================
-- 12_create_settings.sql
-- Configuración global de la tienda — pares key/value editables desde el admin
-- =============================================================================

CREATE TABLE IF NOT EXISTS settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigger: actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION fn_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION fn_settings_updated_at();

-- Valores por defecto (se insertan solo si la tabla está vacía)
INSERT INTO settings (key, value) VALUES
  ('store_name',                'Tienda devsChile™'),
  ('store_tagline',             'Productos exclusivos de la comunidad'),
  ('contact_email',             'huemul@devschile.cl'),
  ('store_open',                'true'),
  ('maintenance_message',       'Estamos preparando algo increíble. ¡Vuelve pronto!'),
  ('shipping_enabled',          'true'),
  ('shipping_cost',             '3000'),
  ('free_shipping_threshold',   '30000')
ON CONFLICT (key) DO NOTHING;
