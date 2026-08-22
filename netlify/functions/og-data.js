// Netlify Function — devuelve los metadatos OG de un producto (JSON ligero).
// La consume el Edge Function de /p/* para inyectar las meta tags en el HTML de la SPA.
const { getProductById } = require('./lib/products');

const formatPrice = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(n);

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300',
  'Access-Control-Allow-Origin': '*',
};

exports.handler = async (event) => {
  const id = (event.path || '').split('/').filter(Boolean).pop();
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing product id' }) };
  }

  let product;
  try {
    product = await getProductById(process.env.NEON_DATABASE_URL, id);
  } catch (e) {
    console.error('og-data error:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load product' }) };
  }

  if (!product) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) };
  }

  const f = product.fields;
  const cover = f.coverImage ?? null;
  const currentPrice = f.on_sale && f.sale_price != null ? f.sale_price : f.price;
  const availability = f.visible && f.available && (f.stock ?? 0) > 0 ? 'in stock' : 'out of stock';

  const body = JSON.stringify({
    id,
    name: f.name,
    description: f.description || null,
    long_description: f.long_description || null,
    category: f.category || null,
    price: Number(currentPrice),
    price_display: formatPrice(currentPrice),
    currency: 'CLP',
    availability,
    cover_url: cover?.url ?? null,
    url: `/p/${id}`,
    image: `/og-image/${id}.png`,
  });

  return { statusCode: 200, headers, body };
};
