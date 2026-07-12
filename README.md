# Tienda devsChile™

E-commerce oficial de la comunidad devsChile™. Venta de productos exclusivos con pago integrado vía MercadoPago, panel de administración, gestión de imágenes y configuración dinámica desde base de datos.

**Producción:** [tienda.devschile.cl](https://tienda.devschile.cl) · **Admin:** [tienda.devschile.cl/admin](https://tienda.devschile.cl/admin)

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | Tailwind CSS (paleta de marca devsChile) + Onest / Fira Mono |
| **UI Components** | Radix UI + shadcn/ui |
| **Animaciones** | Motion v12 (Framer Motion) — shared element, spring, stagger |
| **Routing** | React Router DOM v6 |
| **BD** | NeonDB — Postgres serverless |
| **Backend** | Netlify Functions (Node.js, CJS) |
| **Imágenes** | UploadThing v7 — CDN global |
| **Pagos** | MercadoPago SDK v2 — Checkout Pro (redirect) |
| **Emails** | Resend (staging) · Mailgun (producción) — multi-proveedor |
| **Despliegue** | Netlify (Frontend + Functions) |

---

## 🚀 Instalación

```bash
npm install
npm install --prefix netlify/functions   # deps de las funciones
cp .env.example .env                     # completar con credenciales reales
```

### Variables de entorno

```env
# NeonDB — solo backend, nunca prefijo VITE_
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# MercadoPago
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...   # frontend (seguro exponerse)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...       # backend solo
MERCADOPAGO_WEBHOOK_SECRET=whsec_...       # Panel MP → Tu app → Webhooks

# Email (cambiar solo EMAIL_PROVIDER para alternar)
EMAIL_PROVIDER=resend                      # resend | mailgun
RESEND_API_KEY=re_...
FROM_EMAIL=tienda@devschile.cl
ADMIN_EMAIL=huemul@devschile.cl
MAILGUN_API_KEY=key-...                    # solo producción
MAILGUN_DOMAIN=mg.tienda.devschile.cl      # solo producción

# UploadThing — imágenes de productos
UPLOADTHING_TOKEN=tu_token_aqui            # dashboard.uploadthing.com → API Keys

# Admin panel
ADMIN_EMAIL=admin@devschile.cl
ADMIN_PASSWORD=contraseña-segura
ADMIN_JWT_SECRET=string-aleatorio-64-chars  # openssl rand -base64 48

# CORS y entorno
ALLOWED_ORIGINS=https://tienda.devschile.cl,https://devschile-tienda.netlify.app
SITE_URL=http://localhost:3000
NODE_ENV=development
```

> Ver `docs/mercadopago-integration.md` para guía completa de MercadoPago.

---

## 💻 Desarrollo local

```bash
# Solo UI (mock data, sin funciones ni BD)
npm run dev

# Full stack (dos terminales)
npm run dev               # Terminal 1 — Vite en :3000
npm run dev:functions     # Terminal 2 — Netlify Functions en :9999

# Build producción
npm run build

# Migrar imágenes locales → UploadThing (one-shot)
npm run migrate:images

# Generar favicons desde el logo
npm run generate:favicons
```

El proxy de Vite redirige `/.netlify/functions/*` y `/admin-api/*` → `:9999` automáticamente.

---

## 🗄️ Base de datos (NeonDB)

### Migraciones

Aplica en orden desde `migrations/` en el SQL Editor de Neon:

| # | Archivo | Descripción |
|---|---|---|
| 01 | `create_products_schema.sql` | Tablas `products` y `product_images` |
| 02 | `seed_products_from_mock.sql` | Datos iniciales de ejemplo |
| 03 | `add_stock_and_available.sql` | Stock + trigger `available=false` si `stock=0` |
| 04 | `rename_active_to_visible.sql` | `active` → `visible` |
| 05 | `product_images_cover.sql` | `is_cover` + trigger single-cover por producto |
| 06 | `create_orders.sql` | Tablas `orders` y `order_items` |
| 07 | `add_on_sale.sql` | Badge de oferta en productos |
| 08 | `add_wants_newsletter.sql` | Consentimiento de newsletter en `orders` |
| 09 | `add_long_description_and_sale_price.sql` | Descripción larga (Markdown) + precio oferta |
| 10 | `add_original_price_to_order_items.sql` | Precio original para emails con descuentos |
| 11 | `add_notes_to_orders.sql` | Notas internas por orden (solo admin) |
| 12 | `create_settings.sql` | Configuración dinámica de la tienda |

### Esquema resumido

```
products
  id, name, description, long_description (Markdown)
  category, price, sale_price, on_sale
  visible, available, stock
  created_time

product_images
  id, product_id, variant, position
  url, filename, size, type
  is_cover  ← portada del card (trigger garantiza 1 sola por producto)

orders
  id (uuid), status (pending|approved|rejected|pending_transfer|refunded|cancelled)
  total_amount, customer_name, customer_email
  shipping_address, shipping_city, shipping_region, shipping_zip
  mp_preference_id, mp_payment_id
  wants_newsletter, notes, created_at, updated_at

order_items
  id, order_id, product_id, product_name
  quantity, unit_price, original_unit_price, subtotal
  — product_id='shipping' identifica el ítem de envío

settings
  key (PK), value, updated_at
  — pares clave/valor editables desde /admin/settings
```

---

## 💳 Flujo de pagos

```
Usuario → Catálogo → Carrito → Checkout Form
                                    ↓
                         Orden PENDING en NeonDB
                         Preferencia en MercadoPago
                         Emails de intención (comprador + admin)
                                    ↓
                          Redirect → MercadoPago
                                    ↓
                         Usuario paga (tarjeta, transferencia)
                           ↙                    ↘
            /success?order_id=            /failure|pending?
                    ↓                              ↓
              get-order (estado)             get-order (estado)
                                ↓ (asíncrono)
                      mercadopago-webhook
                        · Actualiza orders.status
                        · Descuenta stock si approved
                             (salta product_id='shipping')
                        · Emails de confirmación
```

**Costo de envío:** si el usuario selecciona envío a domicilio y aplica un costo (configurado en `/admin/settings`), se agrega como ítem `product_id='shipping'` al array de ítems — así MercadoPago lo cobra y los emails lo muestran con breakdown separado.

---

## 🖼️ Imágenes de productos (UploadThing)

Las imágenes se almacenan en UploadThing CDN (`ufs.sh`) y sus URLs en la tabla `product_images`.

```bash
# Migrar imágenes existentes en public/products/ → UploadThing
npm run migrate:images
# Lee: public/products/{slug}/*.jpg
# Sube a UploadThing, actualiza product_images en NeonDB
# is_cover = imagen cuyo basename coincide con el folder name
```

Desde el admin (`/admin/products → Editar`) puedes:
- Ver todas las imágenes del producto en grilla 3×3
- Subir nuevas (drag & drop o file picker, máx 8 MB)
- Cambiar la portada (⭐ siempre visible)
- Eliminar (borra de UploadThing + BD)
- Hacer zoom con navegación ←→ y teclado

---

## 📧 Emails

| Trigger | Destinatario | Template |
|---|---|---|
| Checkout (antes de pagar) | Comprador | Resumen carrito + link MP |
| Webhook `approved` | Comprador | Confirmación con detalle |
| Webhook `pending_transfer` | Comprador | Transferencia en proceso |
| Webhook `rejected` | Comprador | Pago fallido + reintentar |
| Checkout | Admin | Alerta nueva intención |
| Webhook `approved` / `pending_transfer` | Admin | Detalle completo de orden |

Los emails muestran precio original tachado + precio oferta en descuentos, y breakdown subtotal / envío / total cuando hay costo de envío.

**Cambiar proveedor:** solo cambia `EMAIL_PROVIDER=resend|mailgun` en Netlify.

---

## ⚙️ Panel de administración (`/admin`)

Acceso mediante JWT con credenciales de las variables de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). El token expira en 12h.

| Sección | Ruta | Funcionalidad |
|---|---|---|
| **Dashboard** | `/admin` | Stats por periodo (hoy/7d/30d/6m/todo), últimas órdenes, stock bajo |
| **Productos** | `/admin/products` | Tabla con skeleton, toggles inline (visible/disponible/oferta), filtros, crear, editar, gestión de imágenes, exportar CSV |
| **Pedidos** | `/admin/orders` | Tabs por estado, cambio de estado con confirmación, notas internas, detalle con breakdown de envío, exportar CSV |
| **Configuración** | `/admin/settings` | store_name, tagline, email contacto, modo mantenimiento, envío (habilitado/costo/umbral gratis), status integraciones |

Las tablas incluyen skeleton animado (Motion) en la carga y stagger spring en la entrada de filas.

---

## 📁 Estructura del proyecto

```
/
├── actions/
│   ├── createPayment.ts     # CartItem[] + CustomerData → MercadoPago
│   ├── getOrder.ts          # Consulta estado de orden por ID
│   ├── loadProducts.ts      # Carga productos desde NeonDB (fallback mock)
│   └── loadSettings.ts      # Configuración pública desde NeonDB (con fallback)
├── admin/                   # Panel de administración (/admin)
│   ├── AdminApp.tsx         # Rutas relativas + auth guard
│   ├── components/          # AdminLayout, AdminSidebar, OrderDetailPanel,
│   │                        # ProductEditPanel, ImageManager, TableSkeleton, Toggle...
│   ├── hooks/               # useAdminAuth, useAdminData, useAdminTitle, useRowSelection
│   ├── pages/               # DashboardPage, ProductListPage, OrderListPage,
│   │                        # SettingsPage, LoginPage
│   └── utils/adminFetch.ts  # Fetch autenticado con JWT
├── app/
│   ├── app.tsx              # Componente principal (catálogo, settings, carrito)
│   └── productsMock.ts      # Mock data para desarrollo local
├── components/
│   ├── CartDrawer.tsx        # Carrito lateral (Motion spring)
│   ├── CheckoutModal.tsx     # Form de datos + shipping props
│   ├── ProductCard.tsx       # Card con precio, oferta, badge, glow button
│   ├── ProductImageModal.tsx # Lightbox 2 columnas (shared element Motion)
│   ├── InfoModal.tsx         # "Sobre la tienda" con stagger
│   ├── OrderConfirmation.tsx # Páginas success/failure/pending
│   ├── CoinConfetti.tsx      # Confetti canvas-confetti en success
│   ├── MarkdownText.tsx      # Renderer Markdown sin dependencias
│   ├── DevTools.tsx          # Panel de dev (solo DEV mode)
│   └── ui/                  # shadcn/ui (button, dialog, toast...)
├── data/
│   └── comunas-chile.ts     # 346 comunas / 16 regiones de Chile
├── docs/
│   └── mercadopago-integration.md
├── hooks/
│   ├── useCart.ts           # Estado del carrito (localStorage)
│   └── useStoreSettings.ts  # Settings desde NeonDB con helpers parseados
├── migrations/              # 12 archivos SQL secuenciales para NeonDB
├── netlify/
│   └── functions/
│       ├── admin-api.js         # Router CRUD admin (JWT) — products, orders, images,
│       │                        # upload, settings, dashboard
│       ├── admin-auth.js        # POST login → JWT (timingSafeEqual, delay en fallo)
│       ├── create-payment.js    # Crea orden + preferencia MP + emails intención
│       ├── get-order.js         # Consulta orden por ID
│       ├── get-products.js      # Catálogo público desde NeonDB
│       ├── get-settings.js      # Configuración pública (cache 60s, fallback)
│       ├── mercadopago-webhook.js  # Webhook → actualiza estado + stock + emails
│       ├── emails/              # Templates HTML + providers (Resend/Mailgun)
│       └── package.json         # mercadopago, neon, resend, mailgun, uploadthing
├── public/
│   ├── products/            # Imágenes originales (backup — CDN en UploadThing)
│   ├── favicon-*.png
│   ├── apple-touch-icon.png
│   ├── social.jpg           # Imagen Open Graph (600×315)
│   └── site.webmanifest
├── scripts/
│   ├── generate-favicons.mjs           # npm run generate:favicons
│   └── migrate-images-to-uploadthing.mjs  # npm run migrate:images
├── src/
│   ├── main.tsx             # BrowserRouter + rutas lazy (tienda + admin)
│   ├── index.css            # Tailwind + custom CSS (glow buttons, etc.)
│   └── pages/               # SuccessPage, FailurePage, PendingPage, TerminosPage
├── types/
│   └── products.ts          # ProductRecord, ProductFields, CartItem...
├── .env.example             # Plantilla de variables (sin valores reales)
├── netlify.toml             # Build + headers seguridad + caché + noindex /admin*
└── tailwind.config.js       # Paleta de marca + tipografía
```

---

## 🎨 Diseño

### Paleta de colores

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#b45b38` | Botones, CTAs, precios |
| `brand-secondary` | `#85422b` | Títulos, bordes |
| `brand-accent` | `#d4a373` | Detalles, hovers |
| `brand-background` | `#fdfaf8` | Fondo general |
| `brand-surface` | `#f5ece4` | Cards, secciones |
| `devs-text` | `#2d1a12` | Texto principal |
| `devs-muted` | `#7a6b63` | Texto secundario |

### Tipografía

- **Onest** — textos, body, labels
- **Fira Mono** — títulos (h1–h4), `DialogTitle`, precios destacados

### Animaciones (Motion v12)

**Tienda:**
- Grid de productos: stagger + FLIP al filtrar por categoría
- Cards: shared element image (card → modal lightbox), `whileHover` spring
- Modal lightbox: slide entre imágenes con dirección, dots pill animados
- Carrito: slide spring desde la derecha, items `AnimatePresence popLayout`
- Checkout: stagger de campos, height reveal del bloque de envío, shake en validación
- Modales de info: backdrop blur + spring easing

**Admin:**
- Tablas: skeleton pulsante que replica la estructura de columnas → fade-out → stagger spring de filas de datos
- Dashboard: skeleton cards, números con flip vertical al cambiar periodo, `layoutId` en selector de periodo
- `ProductEditPanel` / `OrderDetailPanel`: slide desde la derecha + fade backdrop
- `ImageManager`: shared element `layoutId` (thumbnail → modal zoom), 3D tilt en hover, burst ⭐ al cambiar portada

---

## 🛡️ Seguridad

- CORS whitelist en todas las Netlify Functions
- Validación y sanitización de inputs en el backend
- Headers de seguridad en `netlify.toml` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- `X-Robots-Tag: noindex, nofollow` en todas las rutas `/admin*`
- Caché inmutable para assets hasheados de Vite (`/assets/*`)
- `Cache-Control: no-store` en endpoints de admin
- Credenciales MP solo en env vars del servidor (nunca en el bundle del cliente)
- Firma HMAC-SHA256 para validar webhooks de MercadoPago
- Webhook idempotente — órdenes ya aprobadas no se reprocesam
- Admin JWT: `crypto.timingSafeEqual()` en comparación de credenciales + delay de 500ms en fallos

---

## 📞 Contacto

Para consultas de la tienda: [huemul@devschile.cl](mailto:huemul@devschile.cl)

---

## 📄 Licencia

Proyecto privado — © 2026 Tienda devsChile™. Todos los derechos reservados.
