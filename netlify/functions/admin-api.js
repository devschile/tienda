// Netlify Function — router CRUD para el admin panel
// Todas las rutas admin pasan por aquí vía redirect en netlify.toml:
//   /admin-api/* → /.netlify/functions/admin-api/:splat
//
// JWT verificado en cada request. Sin dependencias externas.

const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');
const { UTApi } = require('uploadthing/server');

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
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
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
      const archived = qs.archived === 'true';

      const rows = await sql`
        SELECT p.id, p.name, p.category, p.price, p.sale_price,
               p.visible, p.available, p.stock, p.on_sale, p.archived, p.created_time,
               (SELECT pi.url FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_cover = true LIMIT 1) AS cover_url
        FROM products p
        WHERE p.archived = ${archived}
          ${search !== null ? sql`AND p.name ILIKE ${search}` : sql``}
          ${onSale !== null ? sql`AND p.on_sale = ${onSale}` : sql``}
          ${visibleF !== null ? sql`AND p.visible = ${visibleF}` : sql``}
          ${lowStock ? sql`AND p.stock < 5` : sql``}
        ORDER BY p.created_time DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total FROM products p
        WHERE p.archived = ${archived}
          ${search !== null ? sql`AND p.name ILIKE ${search}` : sql``}
          ${onSale !== null ? sql`AND p.on_sale = ${onSale}` : sql``}
          ${visibleF !== null ? sql`AND p.visible = ${visibleF}` : sql``}
          ${lowStock ? sql`AND p.stock < 5` : sql``}
      `;
      return json(200, { data: rows, total, page, pageSize });
    },

    async POST({ body, sql }) {
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
      if (!name || price === undefined || price === null)
        return json(400, { error: 'Nombre y precio son requeridos' });

      // Generar ID único en formato legible (mismo estilo que los existentes)
      const id = `prod_${crypto.randomBytes(5).toString('hex')}`;

      const [created] = await sql`
        INSERT INTO products
          (id, name, description, long_description, category, price, sale_price,
           visible, available, stock, on_sale)
        VALUES (
          ${id},
          ${name},
          ${description ?? ''},
          ${long_description ?? null},
          ${category ?? ''},
          ${price},
          ${sale_price ?? null},
          ${visible ?? true},
          ${available ?? true},
          ${stock ?? 0},
          ${on_sale ?? false}
        )
        RETURNING *
      `;
      return json(201, { data: created });
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
        archived,
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
          on_sale          = COALESCE(${on_sale ?? null}, on_sale),
          archived         = COALESCE(${archived ?? null}, archived)
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
          SELECT product_id, product_name, quantity, unit_price, original_unit_price, subtotal
          FROM order_items WHERE order_id = ${id} ORDER BY created_at
        `;
        return json(200, { data: { ...order, items } });
      }

      const page = Math.max(1, parseInt(qs.page || '1', 10));
      const pageSize = Math.min(50, parseInt(qs.pageSize || '20', 10));
      const offset = (page - 1) * pageSize;
      const status = qs.status || null;
      const archived = qs.archived === 'true';

      const rows = await sql`
        SELECT o.id, o.status, o.total_amount, o.customer_name, o.customer_email,
               o.shipping_city, o.shipping_region, o.mp_payment_id,
               o.archived, o.created_at, o.updated_at,
               COUNT(oi.id)::int AS items_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.archived = ${archived}
          ${status ? sql`AND o.status = ${status}::order_status` : sql``}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      const [{ total }] = await sql`
        SELECT COUNT(*)::int AS total FROM orders
        WHERE archived = ${archived}
          ${status ? sql`AND status = ${status}::order_status` : sql``}
      `;
      return json(200, { data: rows, total, page, pageSize });
    },

    async PUT({ id, body, sql }) {
      if (!id) return json(400, { error: 'ID requerido' });
      const { status, notes, archived } = body;

      // Solo status, solo notes, solo archived, o combinación
      if (!status && notes === undefined && archived === undefined)
        return json(400, { error: 'status, notes o archived requerido' });

      const [updated] = await sql`
        UPDATE orders
        SET
          status   = ${status ? sql`${status}::order_status` : sql`status`},
          notes    = ${notes !== undefined ? notes || null : sql`notes`},
          archived = COALESCE(${archived ?? null}, archived)
        WHERE id = ${id}
        RETURNING id, status, notes, archived, updated_at
      `;
      return updated ? json(200, { data: updated }) : json(404, { error: 'Orden no encontrada' });
    },
  },

  // ── settings ─────────────────────────────────────────────────────────────
  settings: {
    async GET({ qs, sql }) {
      const rows = await sql`SELECT key, value FROM settings ORDER BY key`;
      const data = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      // Estado de integraciones (solo booleanos, sin exponer secrets)
      if (qs.integrations === '1') {
        const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
        data._integrations = JSON.stringify({
          mercadopago: {
            configured: !!mpToken,
            mode: mpToken.startsWith('TEST-')
              ? 'sandbox'
              : mpToken.startsWith('APP_USR-')
                ? 'production'
                : 'unknown',
          },
          email: {
            provider: process.env.EMAIL_PROVIDER || 'resend',
            configured: !!(process.env.RESEND_API_KEY || process.env.MAILGUN_API_KEY),
          },
          database: { configured: !!process.env.NEON_DATABASE_URL },
        });
      }

      return json(200, { data });
    },

    async PUT({ body, sql }) {
      const entries = Object.entries(body).filter(([k]) => !k.startsWith('_'));
      if (!entries.length) return json(400, { error: 'Sin cambios' });

      for (const [key, value] of entries) {
        await sql`
          INSERT INTO settings (key, value)
          VALUES (${key}, ${String(value ?? '')})
          ON CONFLICT (key) DO UPDATE SET value = ${String(value ?? '')}
        `;
      }
      return json(200, { data: Object.fromEntries(entries) });
    },
  },

  // ── dashboard ─────────────────────────────────────────────────────
  dashboard: {
    async GET({ qs, sql }) {
      // period: today (default) | 7d | 30d | 6m | all
      const period = qs.period || 'today';

      const dateFilter =
        {
          today: sql`created_at >= CURRENT_DATE`,
          '7d': sql`created_at >= NOW() - INTERVAL '7 days'`,
          '30d': sql`created_at >= NOW() - INTERVAL '30 days'`,
          '6m': sql`created_at >= NOW() - INTERVAL '6 months'`,
          all: sql`true`,
        }[period] ?? sql`created_at >= CURRENT_DATE`;

      const [stats] = await sql`
        SELECT COUNT(*)::int                               AS orders_count,
               COALESCE(SUM(total_amount), 0)::int         AS revenue,
               COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_count
        FROM orders WHERE archived = false AND ${dateFilter}
      `;
      const [pending] = await sql`
        SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending' AND archived = false
      `;
      const [lowStock] = await sql`
        SELECT COUNT(*)::int AS count FROM products
        WHERE stock < 5 AND visible = true AND archived = false
      `;
      const [products] = await sql`
        SELECT COUNT(*)::int AS count FROM products WHERE visible = true AND archived = false
      `;

      return json(200, {
        data: {
          orders_count: stats.orders_count,
          approved_count: stats.approved_count,
          revenue: stats.revenue,
          pending: pending.count,
          low_stock: lowStock.count,
          products: products.count,
          period,
        },
      });
    },
  },

  // ── images — galería por producto ──────────────────────────────────────────
  images: {
    async GET({ id, qs, sql }) {
      if (id) {
        // GET /admin-api/images/:id — detalle de una imagen (poco usado)
        const [img] = await sql`SELECT * FROM product_images WHERE id = ${id}`;
        return img ? json(200, { data: img }) : json(404, { error: 'Imagen no encontrada' });
      }
      const productId = qs.productId;
      if (!productId) return json(400, { error: 'productId requerido' });
      const rows = await sql`
        SELECT id, url, filename, is_cover, position, size, type
        FROM product_images
        WHERE product_id = ${productId}
        ORDER BY is_cover DESC, position ASC
      `;
      return json(200, { data: rows });
    },

    async PUT({ id, body, sql }) {
      // PUT /admin-api/images/:id  { is_cover: true } — cambiar portada
      if (!id) return json(400, { error: 'ID requerido' });
      if (body.is_cover !== true) return json(400, { error: 'Solo is_cover=true es válido' });
      const [img] = await sql`
        UPDATE product_images SET is_cover = true WHERE id = ${id} RETURNING *
      `;
      return img ? json(200, { data: img }) : json(404, { error: 'Imagen no encontrada' });
    },

    async DELETE({ id, sql }) {
      // DELETE /admin-api/images/:id
      if (!id) return json(400, { error: 'ID requerido' });
      const [img] = await sql`
        DELETE FROM product_images WHERE id = ${id}
        RETURNING url, filename, is_cover
      `;
      if (!img) return json(404, { error: 'Imagen no encontrada' });

      // Intentar borrar de UploadThing (best-effort, no falla si hay error)
      try {
        const key = img.url.split('/f/').pop();
        if (key && img.url.includes('/f/')) {
          const utapi = new UTApi();
          await utapi.deleteFiles([key]);
        }
      } catch (e) {
        console.warn('admin-api [DELETE images]: no se pudo borrar de UploadThing:', e.message);
      }

      return json(200, { data: img });
    },
  },

  // ── upload — sube imagen a UploadThing e inserta en product_images ──────────
  upload: {
    async POST({ body, sql }) {
      const { filename, contentType, base64, productId, setAsCover = false } = body;

      if (!filename || !contentType || !base64 || !productId)
        return json(400, { error: 'filename, contentType, base64 y productId son requeridos' });

      // Convertir base64 → File (Node 20+)
      const buffer = Buffer.from(base64, 'base64');
      const file = new File([buffer], filename, { type: contentType });

      const utapi = new UTApi();
      const { data, error } = await utapi.uploadFiles(file);

      if (error || !data) {
        console.error('admin-api [POST upload]:', error);
        return json(500, { error: error?.message ?? 'Error al subir imagen' });
      }

      // Calcular posición (siguiente disponible)
      const [{ next_pos }] = await sql`
        SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
        FROM product_images WHERE product_id = ${productId}
      `;

      const imageId = `img_${crypto.randomBytes(5).toString('hex')}`;
      const [image] = await sql`
        INSERT INTO product_images
          (id, product_id, url, filename, size, type, variant, position, is_cover)
        VALUES (
          ${imageId}, ${productId},
          ${data.ufsUrl ?? data.url},
          ${filename}, ${buffer.length}, ${contentType},
          'large', ${next_pos}, ${setAsCover}
        )
        RETURNING *
      `;

      return json(201, { data: image });
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
