// Netlify Function — devuelve configuración pública de la tienda
// Sin JWT: es info pública. Cache corto para no saturar la BD.
const { neon } = require('@neondatabase/serverless');

const DEFAULTS = {
  store_name: 'Tienda devsChile',
  store_tagline: 'Productos exclusivos de la comunidad',
  contact_email: 'huemul@devschile.cl',
  store_open: 'true',
  maintenance_message: 'Estamos preparando algo increíble. ¡Vuelve pronto!',
  shipping_enabled: 'true',
  shipping_cost: '3000',
  free_shipping_threshold: '30000',
};

exports.handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const rows = await sql`SELECT key, value FROM settings`;
    const data = { ...DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
    return { statusCode: 200, headers, body: JSON.stringify({ data }) };
  } catch (e) {
    console.error('get-settings error:', e.message);
    // Fallback con defaults — la tienda sigue funcionando aunque la BD falle
    return { statusCode: 200, headers, body: JSON.stringify({ data: DEFAULTS }) };
  }
};
