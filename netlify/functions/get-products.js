// Netlify Function to fetch products from NeonDB (Postgres serverless)
const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // Get allowed origins from environment (should be set in Netlify)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://tienda-devschile.netlify.app'];

  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  // Set secure CORS headers
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
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

    const sql = neon(databaseUrl);

    // Fetch products together with their thumbnail/large images,
    // grouped back into the shape the frontend expects (ProductResponse).
    const rows = await sql`
      select
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.active,
        p.created_time,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'url', pi.url,
              'filename', pi.filename,
              'size', pi.size,
              'type', pi.type
            )
            order by pi.position
          ) filter (where pi.variant = 'thumbnail'),
          '[]'::jsonb
        ) as thumbnail_images,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'url', pi.url,
              'filename', pi.filename,
              'size', pi.size,
              'type', pi.type
            )
            order by pi.position
          ) filter (where pi.variant = 'large'),
          '[]'::jsonb
        ) as large_images
      from products p
      left join product_images pi on pi.product_id = p.id
      group by p.id
      order by p.created_time asc
    `;

    const records = rows.map((row) => ({
      id: row.id,
      fields: {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: Number(row.price),
        thumbnailImages: row.thumbnail_images,
        largeImages: row.large_images,
        active: row.active,
      },
      createdTime:
        row.created_time instanceof Date ? row.created_time.toISOString() : row.created_time,
    }));

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
