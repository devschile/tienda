// Utilidades compartidas para consultar productos en NeonDB (Postgres serverless).
// Usado por get-products.js (catálogo) y por og-data.js / og-image.js (sharing/OG).
const { neon } = require('@neondatabase/serverless');

// Convierte una fila de la BD al shape { id, fields, createdTime } que usa la SPA.
const rowToFields = (row) => ({
  id: row.id,
  fields: {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    coverImage: row.cover_image ?? null,
    images: row.images,
    thumbnailImages: row.thumbnail_images,
    largeImages: row.large_images,
    visible: row.visible,
    available: row.available,
    stock: Number(row.stock),
    on_sale: !!row.on_sale,
    presale: !!row.presale,
    long_description: row.long_description ?? null,
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
    product_type: row.product_type || 'standard',
    selectable_in_bundles: !!row.selectable_in_bundles,
    bundle_unit_price: row.bundle_unit_price != null ? Number(row.bundle_unit_price) : null,
    bundle_sizes: row.bundle_sizes ? JSON.parse(row.bundle_sizes) : null,
    bundle_allow_surprise: row.bundle_allow_surprise,
    shipping_enabled: row.shipping_enabled !== false,
    shipping_tier: row.shipping_tier || 'xs',
  },
  createdTime: row.created_time instanceof Date ? row.created_time.toISOString() : row.created_time,
});

// Devuelve una instancia sql lista para consultar.
const getSql = (databaseUrl) => neon(databaseUrl);

// Feeching de un producto por id (con cover + galería). Retorna rowToFields(row) o null.
async function getProductById(databaseUrl, id) {
  if (!databaseUrl || !id) return null;

  const sql = getSql(databaseUrl);
  const rows = await sql`
    select
      p.id,
      p.name,
      p.description,
      p.category,
      p.price,
      p.visible,
      p.available,
      p.stock,
      p.on_sale,
      p.presale,
      p.long_description,
      p.sale_price,
      p.created_time,
      p.product_type,
      p.selectable_in_bundles,
      p.bundle_unit_price,
      p.bundle_sizes,
      p.bundle_allow_surprise,
      p.shipping_enabled,
      p.shipping_tier,

      (
        select jsonb_build_object(
          'id',       ci.id,
          'url',      ci.url,
          'filename', ci.filename,
          'size',     ci.size,
          'type',     ci.type,
          'is_cover', true
        )
        from product_images ci
        where ci.product_id = p.id
          and ci.is_cover = true
        limit 1
      ) as cover_image,

      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',       pi.id,
            'url',      pi.url,
            'filename', pi.filename,
            'size',     pi.size,
            'type',     pi.type,
            'is_cover', pi.is_cover
          )
          order by pi.is_cover desc, pi.position asc
        ),
        '[]'::jsonb
      ) as images,

      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', pi.id, 'url', pi.url, 'filename', pi.filename,
            'size', pi.size, 'type', pi.type, 'is_cover', pi.is_cover
          )
          order by pi.position
        ) filter (where pi.variant = 'thumbnail'),
        '[]'::jsonb
      ) as thumbnail_images,

      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', pi.id, 'url', pi.url, 'filename', pi.filename,
            'size', pi.size, 'type', pi.type, 'is_cover', pi.is_cover
          )
          order by pi.position
        ) filter (where pi.variant = 'large'),
        '[]'::jsonb
      ) as large_images

    from products p
    left join product_images pi on pi.product_id = p.id
    where p.archived = false
      and p.id = ${id}
    group by p.id
    limit 1
  `;

  return rows.length ? rowToFields(rows[0]) : null;
}

module.exports = { rowToFields, getSql, getProductById };
