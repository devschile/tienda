-- =============================================================================
-- 05_product_images_cover.sql
-- Soporte para múltiples imágenes por producto con imagen de portada (cover)
-- =============================================================================
--
-- PROBLEMA QUE RESUELVE
-- ---------------------
-- El diseño original usa `variant` ('thumbnail' | 'large') para distinguir
-- la imagen del card de las imágenes del modal:
--
--   variant = 'thumbnail' → thumbnailImages[] → ProductCard usa [0]
--   variant = 'large'     → largeImages[]     → modal carousel
--
-- Problemas:
--   1. Hay que subir la misma imagen DOS veces (una por variante).
--   2. No hay control explícito sobre cuál imagen aparece en el card:
--      siempre es el primer thumbnail, sin posibilidad de cambiarlo.
--   3. Para agregar imágenes extra al carousel, hay que agregar en 'large'
--      pero no en 'thumbnail', creando asimetría en los datos.
--
-- SOLUCIÓN
-- --------
-- Columna `is_cover boolean`:
--   - true  → esta imagen aparece en la ProductCard (portada del catálogo)
--   - false → esta imagen aparece en el carousel del modal de zoom
--   - Solo puede haber UNA imagen con is_cover=true por producto.
--             (garantizado por índice único parcial + trigger)
--
-- A partir de esta migración, el flujo recomendado para agregar imágenes es:
--
--   -- Agregar imagen de portada (visible en card):
--   INSERT INTO product_images (id, product_id, variant, position, url, ..., is_cover)
--   VALUES ('img_nueva', 'rec1', 'large', 0, 'https://...', ..., true);
--   -- El trigger automáticamente pone is_cover=false en las demás imágenes de rec1.
--
--   -- Agregar imagen de galería (solo aparece en el carousel del modal):
--   INSERT INTO product_images (id, product_id, variant, position, url, ..., is_cover)
--   VALUES ('img_galeria', 'rec1', 'large', 1, 'https://...', ..., false);
--
--   -- Cambiar cuál imagen es la portada:
--   UPDATE product_images SET is_cover = true
--   WHERE product_id = 'rec1' AND variant = 'large' AND position = 1;
--   -- El trigger automáticamente limpia el cover anterior.
--
-- NOTA SOBRE variant
-- ------------------
-- La columna `variant` ('thumbnail'|'large') pierde su rol de determinar
-- dónde aparece la imagen (eso ahora lo hace is_cover). Sin embargo se mantiene
-- en el esquema para compatibilidad con datos existentes y con el API actual.
-- La recomendación es usar 'large' para todas las imágenes nuevas y dejar
-- que is_cover controle la visibilidad en el card.
--
-- CAMBIOS NECESARIOS EN API Y FRONTEND
-- -------------------------------------
-- Para aprovechar is_cover, actualizar:
--
--   1. netlify/functions/get-products.js
--      - Agregar `pi.is_cover` al jsonb_build_object de cada imagen
--      - Agregar campo cover_image (WHERE is_cover = true LIMIT 1) al SELECT
--        para que la ProductCard pueda usar la URL directamente sin filtrar arrays
--
--   2. types/products.ts
--      - ProductAttachment: agregar `is_cover: boolean`
--      - ProductFields: agregar `coverImage: ProductAttachment | null`
--
--   3. components/ProductCard.tsx
--      - Reemplazar thumbnailImages?.[0] por product.fields.coverImage
--
--   4. components/ProductImageModal.tsx
--      - La galería puede seguir usando largeImages[] o incluir todas las imágenes
--        (el modal ya es agnóstico al cover)
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nueva columna is_cover
-- -----------------------------------------------------------------------------
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- 2. Poblar is_cover con los datos existentes
--    Marcar como cover la imagen thumbnail de position=0 de cada producto,
--    que es lo que el frontend usaba como imagen del card hasta ahora.
-- -----------------------------------------------------------------------------
UPDATE product_images
SET is_cover = true
WHERE variant = 'thumbnail'
  AND position = 0;

-- Fallback: si un producto no tiene thumbnail, usar su primera imagen disponible.
UPDATE product_images pi
SET is_cover = true
FROM (
  SELECT DISTINCT ON (product_id) product_id, variant, position
  FROM product_images
  WHERE product_id NOT IN (
    SELECT DISTINCT product_id FROM product_images WHERE is_cover = true
  )
  ORDER BY product_id, position ASC
) sub
WHERE pi.product_id = sub.product_id
  AND pi.variant    = sub.variant
  AND pi.position   = sub.position;

-- -----------------------------------------------------------------------------
-- 3. Función del trigger: al marcar una imagen como cover (is_cover = true),
--    limpiar automáticamente el cover anterior del mismo producto.
--    Así el admin solo actualiza la nueva portada y el resto queda en false.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_single_cover_per_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_cover = true THEN
    UPDATE product_images
    SET    is_cover = false
    WHERE  product_id = NEW.product_id
      AND  is_cover   = true
      -- Excluir la propia fila usando la clave primaria compuesta
      AND  NOT (variant = NEW.variant AND position = NEW.position);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. Trigger BEFORE INSERT OR UPDATE OF is_cover
--    Se dispara solo cuando la columna is_cover cambia, no en toda actualización.
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_single_cover ON product_images;

CREATE TRIGGER trg_single_cover
  BEFORE INSERT OR UPDATE OF is_cover ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION fn_single_cover_per_product();

-- -----------------------------------------------------------------------------
-- 5. Índice único parcial: garantía a nivel BD de que solo existe
--    UNA fila con is_cover = true por producto, independientemente del trigger.
--    (doble capa de protección: trigger + constraint)
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uix_product_cover
  ON product_images (product_id)
  WHERE is_cover = true;

-- -----------------------------------------------------------------------------
-- 6. Índice de consulta rápida para la portada (usado en get-products.js)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_images_cover
  ON product_images (product_id, is_cover);

-- -----------------------------------------------------------------------------
-- Verificación del estado final
-- -----------------------------------------------------------------------------
-- SELECT
--   p.id, p.name,
--   COUNT(pi.position)                                  AS total_imagenes,
--   MAX(pi.url) FILTER (WHERE pi.is_cover)              AS cover_url,
--   COUNT(*) FILTER (WHERE pi.is_cover)                 AS covers_count  -- debe ser 1
-- FROM products p
-- LEFT JOIN product_images pi ON pi.product_id = p.id
-- GROUP BY p.id, p.name
-- ORDER BY p.name;
