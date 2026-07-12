// Netlify Function — router CRUD para el admin panel
// Todas las rutas admin pasan por aquí vía redirect en netlify.toml:
//   /admin-api/* → /.netlify/functions/admin-api/:splat
//
// JWT verificado en cada request. Sin dependencias externas.

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// ── JWT verify (inline) ────────────────────────────────────────────────────────
function verifyJWT(token, secret) {
  const parts = (token || '').replace('Bearer ', '').split('.');
  if (parts.length !== 3) throw new Error('Token malformado');
  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (expected !== sig) throw new Error('Firma inválida');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expirado');
  return payload;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const json = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(data),
});

const parsePath = (rawPath) => {
  // En prod (redirect netlify.toml): /admin-api/products
  // En dev  (proxy Vite):           /.netlify/functions/admin-api/products
  const parts = rawPath
    .replace(/^\/\.netlify\/functions\/admin-api\/?/, '')
    .replace(/^\/admin-api\/?/, '')
    .split('/')
    .filter(Boolean);
  return { resource: parts[0] || '', id: parts[1] || null };
};

// ── Handlers por recurso ───────────────────────────────────────────────────────

const handlers = {
  // ── products ──────────────────────────────────────────────────────────────
  products: {
    async GET({ id, qs, sql }) {
      if (id) {
        const [row] = await sql`
          SELECT p.*,
            (SELECT pi.url FROM product_images pi
             WHERE pi.product_id = p.id AND pi.is_cover = true LIMIT 1) AS cover_url,
            (SELECT COUNT(*)::int FROM product_images pi WHERE pi.product_id = p.id) AS image_count
          FROM products p WHERE p.id = ${id}
        `;
        return row ? json(200, { data: row }) : json(404, { error: 'Producto no encontrado' });
      }

      const page = Math.max(1, parseInt(qs.page || '1', 10));
      const pageSize = Math.min(50, parseInt(qs.pageSize || '20', 10));
      const offset = (page - 1) * pageSize;
      const search = qs.search ? `%${qs.search}%` : null;
      const onSale = qs.on_sale === 'true' ? true : qs.on_sale === 'false' ? false : null;
      const visibleF = qs.visible === 'true' ? true : qs.visible === 'false' ? false : null;
      const lowStock = qs.low_stock === 'true';

      const rows = await sql`
        SELECT p.id, p.name, p.category, p.price, p.sale_price,
               p.visible, p.available, p.stock, p.on_sale, p.created_time,
               (SELECT pi.url FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_cover = true LIMIT 1) AS cover_url
        FROM products p
        WHERE true
          ${search !== null ? sql`AND p.name ILIKE ${search}` : sql``}
          ${onSale !== null ? sql`AND p.on_sale = ${onSale}` : sql``}
          ${visibleF !== null ? sql`AND p.visible = ${visibleF}` : sql``}
          ${lowStock ? sql`AND p.stock < 5` : sql``}
        ORDER BY p.created_time DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total FROM products p
        WHERE true
          ${search !== null ? sql`AND p.name ILIKE ${search}` : sql``}
          ${onSale !== null ? sql`AND p.on_sale = ${onSale}` : sql``}
          ${visibleF !== null ? sql`AND p.visible = ${visibleF}` : sql``}
          ${lowStock ? sql`AND p.stock < 5` : sql``}
      `;
      return json(200, { data: rows, total, page, pageSize });
    },

    async PUT({ id, body, sql }) {
      if (!id) return json(400, { error: 'ID requerido' });
      const {
        name,
        description,
        long_description,
        category,
        price,
        sale_price,
        visible,
        available,
        stock,
        on_sale,
      } = body;

      const [updated] = await sql`
        UPDATE products SET
          name             = COALESCE(${name ?? null}, name),
          description      = COALESCE(${description ?? null}, description),
          long_description = ${long_description ?? null},
          category         = COALESCE(${category ?? null}, category),
          price            = COALESCE(${price ?? null}, price),
          sale_price       = ${sale_price ?? null},
          visible          = COALESCE(${visible ?? null}, visible),
          available        = COALESCE(${available ?? null}, available),
          stock            = COALESCE(${stock ?? null}, stock),
          on_sale          = COALESCE(${on_sale ?? null}, on_sale)
        WHERE id = ${id}
        RETURNING *
      `;
      return updated
        ? json(200, { data: updated })
        : json(404, { error: 'Producto no encontrado' });
    },
  },

  // ── orders ────────────────────────────────────────────────────────────────
  orders: {
    async GET({ id, qs, sql }) {
      if (id) {
        const [order] = await sql`
          SELECT * FROM orders WHERE id = ${id}
        `;
        if (!order) return json(404, { error: 'Orden no encontrada' });
        const items = await sql`
          SELECT product_name, quantity, unit_price, original_unit_price, subtotal
          FROM order_items WHERE order_id = ${id} ORDER BY created_at
        `;
        return json(200, { data: { ...order, items } });
      }

      const page = Math.max(1, parseInt(qs.page || '1', 10));
      const pageSize = Math.min(50, parseInt(qs.pageSize || '20', 10));
      const offset = (page - 1) * pageSize;
      const status = qs.status || null;

      const rows = await sql`
        SELECT o.id, o.status, o.total_amount, o.customer_name, o.customer_email,
               o.shipping_city, o.shipping_region, o.mp_payment_id,
               o.created_at, o.updated_at,
               COUNT(oi.id)::int AS items_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE ${status ? sql`o.status = ${status}::order_status` : sql`true`}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total FROM orders
        WHERE ${status ? sql`status = ${status}::order_status` : sql`true`}
      `;
      return json(200, { data: rows, total, page, pageSize });
    },

    async PUT({ id, body, sql }) {
      if (!id) return json(400, { error: 'ID requerido' });
      const { status } = body;
      if (!status) return json(400, { error: 'status requerido' });

      const [updated] = await sql`
        UPDATE orders SET status = ${status}::order_status
        WHERE id = ${id} RETURNING id, status, updated_at
      `;
      return updated ? json(200, { data: updated }) : json(404, { error: 'Orden no encontrada' });
    },
  },

  // ── dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    async GET({ sql }) {
      const [today] = await sql`
        SELECT COUNT(*)::int AS orders_today,
               COALESCE(SUM(total_amount), 0)::int AS revenue_today
        FROM orders WHERE created_at >= CURRENT_DATE AND status = 'approved'
      `;
      const [pending] =
        await sql`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'`;
      const [lowStock] =
        await sql`SELECT COUNT(*)::int AS count FROM products WHERE stock < 5 AND visible = true`;
      const [products] =
        await sql`SELECT COUNT(*)::int AS count FROM products WHERE visible = true`;

      return json(200, {
        data: {
          orders_today: today.orders_today,
          revenue_today: today.revenue_today,
          pending: pending.count,
          low_stock: lowStock.count,
          products: products.count,
        },
      });
    },
  },
};

// ── Handler principal ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // 1. Verificar JWT
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) return json(500, { error: 'Servidor no configurado' });

  try {
    verifyJWT(event.headers.authorization || '', jwtSecret);
  } catch (e) {
    return json(401, { error: e.message });
  }

  // 2. Parsear ruta y método
  const { resource, id } = parsePath(event.path);
  const method = event.httpMethod;

  const resourceHandler = handlers[resource];
  if (!resourceHandler) return json(404, { error: `Recurso desconocido: ${resource}` });

  const methodHandler = resourceHandler[method];
  if (!methodHandler) return json(405, { error: 'Método no permitido' });

  // 3. Ejecutar
  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const body = event.body ? JSON.parse(event.body) : {};
    const qs = event.queryStringParameters || {};
    return await methodHandler({ id, body, qs, sql });
  } catch (error) {
    console.error(`admin-api [${method} ${resource}/${id}]:`, error.message);
    return json(500, { error: 'Error interno del servidor' });
  }
};
