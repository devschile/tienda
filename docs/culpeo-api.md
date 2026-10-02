# culpeo API — Contrato y referencia

API de **solo lectura** para culpeo, el CRM interno de devsChile. culpeo cruza cada venta de su libro contable con los ítems de la orden de la tienda y les imputa sus costos de compra para calcular el margen real por producto.

Vive en su propia Netlify Function, `netlify/functions/culpeo-api.js`, separada a propósito de `admin-api.js`. El router del admin también escribe productos y órdenes y toca MercadoPago, así que su única puerta sigue siendo el JWT del panel. La superficie que lee culpeo queda explícita y mínima, igual que `get-order.js` y `get-products.js`.

## Enrutamiento

`/culpeo-api/*` → `/.netlify/functions/culpeo-api/:splat` (redirect en `netlify.toml`). En local se llama directo a `http://localhost:9999/.netlify/functions/culpeo-api/<ruta>` (con `npm run dev:functions`).

## Autenticación

```
Authorization: Bearer <CULPEO_API_TOKEN>
```

- El token se compara por **digest SHA-256 contra digest** con `crypto.timingSafeEqual`, en tiempo constante.
- **Falla cerrado:** si `CULPEO_API_TOKEN` no está configurada, toda request responde `401`. Nunca hay acceso abierto, tampoco en local.
- El token nunca se loguea.
- Generar con `openssl rand -hex 32` y configurarlo en Netlify (Site settings → Environment variables) y en culpeo.

## Respuestas comunes

| Código | Cuándo |
|---|---|
| 401 | Falta el header, el token es incorrecto o `CULPEO_API_TOKEN` no está configurada |
| 405 | Método distinto de `GET` |
| 404 | Ruta desconocida |
| 400 | Parámetro inválido (`status`, `from`, `to`) |
| 500 | Error de BD; el body trae `error.message` y el log de Netlify, `culpeo-api [GET <ruta>]: ...` |

Todas las respuestas llevan `Cache-Control: no-store` porque contienen datos de clientes.

---

## `GET /culpeo-api/orders`

Órdenes con sus ítems **embebidos**, resueltas en una sola query (`json_agg` sobre `order_items`, sin N+1). Orden: `created_at DESC`.

| Parámetro | Default | Descripción |
|---|---|---|
| `status` | `approved` | `pending`, `approved`, `rejected`, `pending_transfer`, `refunded` o `cancelled` |
| `mpPaymentId` | — | Filtra por `mp_payment_id` exacto |
| `from`, `to` | — | Fechas ISO, inclusivas, sobre `created_at`. Una fecha sin hora es medianoche UTC: para incluir todo el 28/08 usa `to=2026-08-29` o `to=2026-08-28T23:59:59Z` |
| `page` | `1` | |
| `pageSize` | `50` | Tope `100` |

```json
{
  "data": [{
    "id": "uuid",
    "status": "approved",
    "total_amount": 34200,
    "customer_name": "...",
    "customer_email": "...",
    "mp_payment_id": "...",
    "channel": "web",
    "discount_code": null,
    "discount_type": null,
    "discount_amount": 0,
    "shipping_amount": 4200,
    "archived": false,
    "created_at": "2026-10-02T13:58:23.525Z",
    "items": [
      { "product_id": "...", "product_name": "Tabla para picar",
        "quantity": 1, "unit_price": 30000,
        "original_unit_price": 30000, "subtotal": 30000 }
    ]
  }],
  "total": 7, "page": 1, "pageSize": 50
}
```

- `items` contiene **solo productos**. El envío no es un producto (no tiene costo de compra), así que su línea en `order_items` (`product_id = 'shipping'`) se excluye y se expone en `shipping_amount`.
- `archived` es la baja lógica del admin. No filtra nada: culpeo decide qué hacer con esas órdenes.
- Los precios de `items` son snapshots al momento de la compra y **no** tienen el descuento aplicado; el descuento vive en `discount_amount`.

### Envío cobrado y cuadratura del total

`total_amount` **incluye** el envío. Para cada orden se cumple:

```
total_amount = Σ items.subtotal − (discount_type = 'shipping' ? 0 : discount_amount) + shipping_amount
```

El envío cobrado al cliente es **`shipping_amount`**, que es lo que hay que comparar contra lo pagado al courier. No conviene derivarlo como `total_amount − Σ subtotal + discount_amount`: con un código de tipo `shipping` (envío gratis), `discount_amount` es el envío *ahorrado* y no se resta del total, así que esa fórmula devolvería el envío ahorrado en vez de 0.

---

## `GET /culpeo-api/products`

Catálogo completo, incluidos los archivados (las ventas históricas pueden apuntar a ellos). Orden: `name`.

```json
{ "data": [{ "id": "...", "name": "...", "price": 19990,
             "sale_price": null, "product_type": "standard",
             "shipping_tier": "m", "archived": false }] }
```

`product_type` es `standard`, `bundle` o `addon`. `shipping_tier` es `xs`, `s`, `m` o `l`.
