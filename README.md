# Tienda devsChile™

E-commerce oficial de la comunidad devsChile™. Venta de productos exclusivos con pago integrado vía MercadoPago.

**Dominio de producción:** [tienda.devschile.cl](https://tienda.devschile.cl)

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | Tailwind CSS (paleta de marca) + Onest / Fira Mono (Google Fonts) |
| **UI Components** | Radix UI + shadcn/ui |
| **Animaciones** | Motion (Framer Motion v11) |
| **Routing** | React Router DOM v6 |
| **BD** | NeonDB — Postgres serverless |
| **Backend** | Netlify Functions (Node.js) |
| **Pagos** | MercadoPago SDK v2 — Checkout Pro (redirect) |
| **Emails** | Resend (testing/staging) · Mailgun (producción) |
| **Despliegue** | Netlify (Frontend + Functions) |

---

## 🚀 Instalación

```bash
npm install
cp .env.example .env   # completar con credenciales reales
```

### Variables de entorno

```env
# NeonDB — solo backend, nunca prefijo VITE_
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# MercadoPago
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-...   # frontend (puede exponerse)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...       # backend solo
MERCADOPAGO_WEBHOOK_SECRET=whsec_...       # generado al registrar la URL del webhook

# Email (Resend para staging, Mailgun para producción)
EMAIL_PROVIDER=resend                      # resend | mailgun
RESEND_API_KEY=re_...
FROM_EMAIL=tienda@andalaosa.cl
ADMIN_EMAIL=admin@devschile.cl
# Mailgun (solo producción)
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.tienda.devschile.cl

# CORS y entorno
ALLOWED_ORIGINS=https://tienda.devschile.cl,https://devschile-tienda.netlify.app
SITE_URL=http://localhost:3000
NODE_ENV=production
```

Ver `docs/mercadopago-integration.md` para guía completa de MercadoPago.

---

## 💻 Desarrollo local

```bash
# Solo UI (mock data, sin funciones)
npm run dev

# Full stack (requiere dos terminales)
npm run dev               # Terminal 1 — Vite en :3000
npm run dev:functions     # Terminal 2 — Netlify Functions en :9999

# Build de producción
npm run build

# Generar favicons (si cambia el logo)
npm run generate:favicons
```

El proxy de Vite redirige `/.netlify/functions/*` → `localhost:9999` automáticamente.

---

## 🗄️ Base de datos (NeonDB)

### Migraciones

Aplica en orden desde `migrations/` usando el SQL Editor de Neon o `psql`:

| Archivo | Descripción |
|---|---|
| `01_create_products_schema.sql` | Tablas `products` y `product_images` |
| `02_seed_products_from_mock.sql` | Datos iniciales de ejemplo |
| `03_add_stock_and_available.sql` | Stock y disponibilidad + trigger automático |
| `04_rename_active_to_visible.sql` | Renombra `active` → `visible` |
| `05_product_images_cover.sql` | `is_cover` por imagen + trigger single-cover |
| `06_create_orders.sql` | Tablas `orders` y `order_items` para compras |
| `07_add_on_sale.sql` | Campo `on_sale` (badge de oferta) |
| `08_add_wants_newsletter.sql` | Consentimiento de newsletter en `orders` |
| `09_add_long_description_and_sale_price.sql` | Descripción larga (Markdown) y precio oferta |
| `10_add_original_price_to_order_items.sql` | Precio original para mostrar descuentos en emails |

### Esquema resumido

```
products
  id, name, description, long_description (Markdown)
  category, price, sale_price
  visible, available, stock, on_sale
  created_time

product_images
  id, product_id, variant, position
  url, filename, size, type, is_cover ← portada del card

orders
  id (uuid), status (pending|approved|rejected|pending_transfer|refunded|cancelled)
  total_amount, customer_name, customer_email
  shipping_address, shipping_city, shipping_region, shipping_zip
  mp_preference_id, mp_payment_id
  wants_newsletter, created_at, updated_at

order_items
  id, order_id, product_id, product_name
  quantity, unit_price, original_unit_price, subtotal
```

### Gestión de productos

```sql
-- Marcar producto en oferta
UPDATE products SET on_sale = true, sale_price = 22000 WHERE id = 'mi-producto';

-- Cambiar imagen de portada del card (trigger limpia la anterior)
UPDATE product_images SET is_cover = true
WHERE product_id = 'mi-producto' AND variant = 'large' AND position = 0;

-- Reponer stock (el trigger pone available=false automáticamente si llega a 0)
UPDATE products SET stock = 20, available = true WHERE id = 'mi-producto';
```

---

## 💳 Flujo de pagos

```
Usuario → Catálogo → Carrito → Checkout Form → create-payment
                                    ↓
                          Orden PENDING en NeonDB
                          Preferencia en MercadoPago
                                    ↓
                        Redirect a MercadoPago
                                    ↓
                        Usuario paga (tarjeta, transferencia)
                              ↙         ↘
              /success?order_id=    /failure|pending?order_id=
                    ↓                       ↓
              get-order (estado real)   get-order (estado real)
                    ↓
          mercadopago-webhook (asíncrono)
              · Actualiza orders.status
              · Descuenta stock si approved
              · Envía emails de confirmación
```

**Páginas de confirmación (React):**
- `/success` — pago aprobado + confetti
- `/failure` — pago rechazado
- `/pending` — transferencia en proceso
- `/terminos` — Términos y Condiciones

---

## 📧 Emails

Sistema de emails multi-proveedor:

| Trigger | Destinatario | Contenido |
|---|---|---|
| Checkout (antes de pagar) | Comprador | Resumen del carrito + link a MercadoPago |
| Webhook `approved` | Comprador | Confirmación de compra con detalle |
| Webhook `pending_transfer` | Comprador | Transferencia en proceso |
| Webhook `rejected` | Comprador | Pago fallido + botón reintentar |
| Checkout | Admin | Alerta de nueva intención de compra |
| Webhook `approved` / `pending_transfer` | Admin | Detalle completo de la orden |

Los emails muestran precio original tachado + precio oferta cuando hay descuento.

**Cambiar proveedor:** solo modifica `EMAIL_PROVIDER` en Netlify Dashboard.

---

## 📁 Estructura del proyecto

```
/
├── app/
│   ├── app.tsx              # Componente principal (catálogo, filtros, carrito)
│   └── productsMock.ts      # Mock data para desarrollo local
├── actions/
│   ├── createPayment.ts     # Acción de pago (CartItem[], CustomerData)
│   ├── getOrder.ts          # Consulta estado de una orden
│   └── loadProducts.ts      # Carga productos desde NeonDB (fallback al mock)
├── components/
│   ├── CartDrawer.tsx        # Carrito lateral (Motion spring)
│   ├── CheckoutModal.tsx     # Form de datos del comprador
│   ├── ProductCard.tsx       # Card con precio, oferta, badge, glow button
│   ├── ProductImageModal.tsx # Lightbox 2 columnas (shared element Motion)
│   ├── InfoModal.tsx         # "Sobre la tienda" con stagger
│   ├── OrderConfirmation.tsx # Páginas success/failure/pending
│   ├── CoinConfetti.tsx      # Confetti canvas-confetti en success
│   ├── MarkdownText.tsx      # Renderer Markdown sin dependencias
│   ├── DevTools.tsx          # Panel de dev (solo import.meta.env.DEV)
│   └── ui/                  # shadcn/ui (button, dialog, toast, card...)
├── data/
│   └── comunas-chile.ts     # 346 comunas / 16 regiones Chile
├── docs/
│   └── mercadopago-integration.md  # Guía completa de integración MP
├── hooks/
│   └── useCart.ts           # Estado del carrito (localStorage)
├── migrations/              # SQL secuenciales para NeonDB
├── netlify/
│   └── functions/
│       ├── create-payment.js       # Crea orden + preferencia MP
│       ├── get-order.js            # Consulta orden por ID
│       ├── get-products.js         # Catálogo desde NeonDB
│       ├── mercadopago-webhook.js  # Webhook MP → actualiza estado + stock
│       ├── emails/                 # Templates y providers de email
│       └── package.json           # Deps de functions (mp SDK, neon, resend...)
├── public/
│   ├── products/            # Imágenes de productos (servidas estáticas)
│   ├── favicon-*.png        # Favicons generados desde el logo
│   ├── apple-touch-icon.png
│   ├── social.jpg           # Imagen Open Graph
│   └── site.webmanifest
├── scripts/
│   └── generate-favicons.mjs  # Genera favicons (npm run generate:favicons)
├── src/
│   ├── main.tsx             # BrowserRouter + rutas lazy
│   ├── index.css            # Tailwind + animaciones CSS custom
│   └── pages/               # SuccessPage, FailurePage, PendingPage, TerminosPage
├── types/
│   └── products.ts          # ProductRecord, ProductFields, CartItem...
├── .env.example             # Plantilla de variables
├── netlify.toml             # Build + headers de seguridad + caché
└── tailwind.config.js       # Paleta de marca
```

---

## 🎨 Diseño

### Paleta de colores

| Token | Color | Uso |
|---|---|---|
| `brand-primary` | `#b45b38` | Botones, CTAs, precios |
| `brand-secondary` | `#85422b` | Títulos, bordes |
| `brand-accent` | `#d4a373` | Detalles, hovers |
| `brand-background` | `#fdfaf8` | Fondo general |
| `brand-surface` | `#f5ece4` | Cards, secciones |
| `devs-text` | `#2d1a12` | Texto principal |
| `devs-muted` | `#7a6b63` | Texto secundario |

### Tipografía

- **Onest** (sans) — textos y body
- **Fira Mono** (mono) — todos los títulos (h1–h4, DialogTitle)

### Animaciones (Motion)

- Grid de productos: stagger + FLIP al filtrar por categoría
- Cards: shared element image (card → modal), whileHover spring, whileTap
- Carrito: slide spring desde la derecha, items AnimatePresence
- Checkout: stagger de campos, height reveal de envío, shake en validación
- Modales: overlay blur animado, spring easing `cubic-bezier(0.16,1,0.3,1)`
- Toast: slide-in-from-bottom con spring easing
- Success: confetti canvas-confetti + stagger de elementos

---

## 🛡️ Seguridad

- CORS whitelist en todas las Netlify Functions
- Validación y sanitización de inputs en el backend
- Headers de seguridad globales en `netlify.toml` (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- Caché inmutable para assets hasheados de Vite (`/assets/*`)
- `Cache-Control: no-store` en endpoints de productos y órdenes
- Credenciales MP solo en variables de entorno del servidor (nunca en el bundle)
- Firma HMAC-SHA256 para validar webhooks de MercadoPago
- Webhook idempotente (órdenes ya aprobadas no se reprocesanj)

---

## 📞 Soporte

Para problemas de integración con MercadoPago, consulta `docs/mercadopago-integration.md`.

Para consultas de la tienda: [huemul@devschile.cl](mailto:huemul@devschile.cl)

---

## 📄 Licencia

Proyecto privado — © 2026 Tienda devsChile™. Todos los derechos reservados.
