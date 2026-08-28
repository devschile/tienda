// Netlify Function to fetch products from NeonDB (Postgres serverless)
const { rowToFields, getSql } = require('./lib/products');

exports.handler = async (event, context) => {
  // Get allowed origins from environment (should be set in Netlify)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://tienda.devschile.cl', 'https://devschile-tienda.netlify.app'];

  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  // Set secure CORS headers
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store', // productos siempre frescos desde Neon, sin caché CDN ni browser
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const databaseUrl = process.env.NEON_DATABASE_URL;

    if (!databaseUrl) {
      console.error('NEON_DATABASE_URL not configured');
      throw new Error('Product database unavailable');
    }

    const sql = getSql(databaseUrl);

    // Fetch products with cover image, full image gallery, and legacy thumbnail/large arrays.
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
        p.bundle_item_ids,
        p.shipping_enabled,
        p.shipping_tier,

        -- Imagen de portada del card (is_cover = true, máximo 1 por producto)
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

        -- Todas las imágenes para el carousel del modal
        -- (cover primero, luego el resto por position)
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

        -- Legacy: thumbnailImages y largeImages (compatibilidad)
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
      group by p.id
      order by p.created_time desc
    `;

    const records = rows.map(rowToFields);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ records }),
    };
  } catch (error) {
    console.error('Error fetching products:', error.message);

    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to load products',
        ...(isDevelopment && { details: error.message }),
      }),
    };
  }
};
