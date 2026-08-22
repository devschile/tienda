# Admin API — Contrato y referencia

Documentación técnica del router CRUD del panel administrativo. Todas las rutas pasan por la Netlify Function `netlify/functions/admin-api.js`, protegida con JWT (12h de expiración).

## Enrutamiento

`/admin-api/*` → `/.netlify/functions/admin-api/:splat` (redirect en `netlify.toml`). En desarrollo, el proxy de Vite envía `/admin-api/*` a `:9999`.

## Autenticación

Header `Authorization: Bearer <JWT>` en **toda** request. El JWT se obtiene en `POST /admin-api/auth` (ver `admin-auth.js`) y se verifica en cada request con `verifyJWT`.

---

## Rutas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin-api/products` | Lista paginada (filtros: search, on_sale, presale, visible, low_stock, archived) |
| GET | `/admin-api/products/:id` | Detalle de un producto |
| POST | `/admin-api/products` | Crear producto |
| PUT | `/admin-api/products/:id` | Actualizar producto |
| GET | `/admin-api/categories` | Categorías únicas ya usadas |
| GET | `/admin-api/orders` | Lista paginada de órdenes |
| PUT | `/admin-api/orders/:id` | Cambiar status / notes / archived |
| GET | `/admin-api/dashboard` | Stats (orders_count, revenue, pending, low_stock, products) |
| GET | `/admin-api/settings` | Pares clave/valor + estado de integraciones (`?integrations=1`) |
| PUT | `/admin-api/settings` | Guardar settings |
| GET | `/admin-api/images?productId=` | Imágenes de un producto |
| PUT | `/admin-api/images/:id` | Cambiar portada (`{ is_cover: true }`) |
| DELETE | `/admin-api/images/:id` | Eliminar imagen (borra también de UploadThing) |
| POST | `/admin-api/upload` | Subir imagen (base64 → UploadThing → `product_images`) |

---

## Objeto producto: columnas de BD vs campos calculados

El producto que devuelve el GET incluye **campos calculados** derivados de la tabla `product_images` **que NO existen en `products`**:

| Campo | Tipo | ¿Columna BD? | ¿Enviar en write? |
|---|---|---|---|
| `id` | text | Sí (PK) | No — read-only, va en la URL |
| `name`, `description`, `category`, `price` | text/int | Sí | Sí |
| `long_description` | text | Sí | Sí |
| `sale_price` | int | Sí | Sí |
| `visible`, `available`, `stock` | bool/int | Sí | Sí |
| `on_sale`, `presale` | bool | Sí | Sí (ver exclusividad abajo) |
| `archived` | bool | Sí | Sí |
| `product_type` | text | Sí | Sí (`standard`/`bundle`/`addon`) |
| `selectable_in_bundles` | bool | Sí | Sí |
| `bundle_unit_price` | int | Sí | Sí |
| `bundle_sizes` | text (JSON `[3,4,6]`) | Sí | Sí (como texto) |
| `bundle_allow_surprise` | bool | Sí | Sí |
| `shipping_enabled` | bool | Sí | Sí |
| `created_time` | timestamptz | Sí | No — read-only |
| **`cover_url`** | text | **No** — calculado en GET | **Nunca** |
| **`image_count`** | int | **No** — calculado en GET | **Nunca** |

> ⚠️ Regla de oro: el body de `PUT`/`POST` solo debe contener columnas reales de BD. Enviar `cover_url`, `image_count` o `created_time` en el write **ha causado errores 500** (incompatibilidad con el driver y tipos). El panel (`ProductEditPanel.tsx`) los descarta antes de enviar; el backend además ignora campos no declarados.

---

## `PUT /admin-api/products/:id`

Actualiza solo los campos presentes en el body (`COALESCE(..., columna)`). Campos ausentes mantienen su valor actual.

- `name` y `price` son requeridos; el resto opcional.
- `bundle_unit_price` se sanean con `sanitizeNullableInt` (> 0, si no → null).
- `bundle_sizes` se normaliza con `sanitizeSizes` a JSON `[3,4,6]`.
- `product_type` se sanean con `sanitizeProductType` (valores desconocidos → `standard`).
- **Exclusividad `on_sale` / `presale`:** son mutuamente excluyentes (CHECK `chk_presale_on_sale_exclusive`). **Gana `presale`**: si `presale=true`, `on_sale` queda `false`, y viceversa. El valor final se calcula **en JS** antes de armar el UPDATE (mismo criterio que el `POST`), no con expresiones `CASE` en SQL.

## Errores

| Status | Caso |
|---|---|
| 400 | Faltan campos requeridos / ID faltante |
| 401 | JWT faltante, inválido o expirado |
| 404 | Recurso no encontrado |
| 405 | Método no permitido |
| 500 | Error interno — body incluye `error.message` real |

---

## Runbook: depurar un 500 en el admin

1. Reproduce el fallo desde el admin y abre la pestaña Network del navegador.
2. El body del 500 ahora incluye el `error.message` real del servidor.
3. Si no basta, revisa los **logs de la función** en Netlify:
   - **Netlify → Functions → `admin-api` → Invocations** → selecciona la última fallida.
   - Busca la línea `admin-api [METHOD recurso/id]: <mensaje>` — es el error real de la BD/query.
4. Causas frecuentes históricas:
   - Enviar campos calculados (`cover_url`, `image_count`, `created_time`) en el write → strip antes de enviar.
   - Expresiones `CASE WHEN ${x} IS NOT NULL` en SQL del PUT → computar el booleano en JS y usar `COALESCE`.
   - Parámetro del `sql` tag sin posición inferible de tipo → pasarlo por `COALESCE(${x}, columna)` o una comparación directa.
5. Si la migración cambió el esquema, verifica que `migrations/` se aplicó en orden (ver `README.md` → Base de datos).