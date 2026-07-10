# Integración MercadoPago — Tienda devsChile

> Documento técnico para el equipo de desarrollo.
> Cubre configuración de credenciales, webhooks, entornos y pruebas end-to-end.

---

## Tabla de contenidos

1. [Resumen del flujo de pago](#1-resumen-del-flujo-de-pago)
2. [Crear la aplicación en MercadoPago](#2-crear-la-aplicación-en-mercadopago)
3. [Configuración de dos entornos](#3-configuración-de-dos-entornos)
4. [Configurar el Webhook](#4-configurar-el-webhook)
5. [Tarjetas de prueba (sandbox)](#5-tarjetas-de-prueba-sandbox)
6. [Variables de entorno — referencia completa](#6-variables-de-entorno--referencia-completa)
7. [Configurar en Netlify Dashboard](#7-configurar-en-netlify-dashboard)
8. [Checklist pre-lanzamiento](#8-checklist-pre-lanzamiento)
9. [Flujo de prueba end-to-end](#9-flujo-de-prueba-end-to-end)
10. [Problemas comunes y soluciones](#10-problemas-comunes-y-soluciones)

---

## 1. Resumen del flujo de pago

### Flujo principal (Checkout Pro — redirect)

```mermaid
sequenceDiagram
    actor Usuario
    participant Frontend
    participant create-payment
    participant NeonDB
    participant MercadoPago
    participant get-order

    Usuario->>Frontend: Hace clic en "Comprar Ahora"
    Frontend->>Frontend: Muestra Checkout Form
    Usuario->>Frontend: Completa datos y confirma
    Frontend->>create-payment: POST con items + datos del comprador
    create-payment->>NeonDB: Crea orden con status = pending
    create-payment->>MercadoPago: POST /checkout/preferences (back_urls, notification_url)
    MercadoPago-->>create-payment: preference_id + init_point URL
    create-payment-->>Frontend: { order_id, init_point }
    Frontend->>MercadoPago: Redirect a init_point (sitio de MP)
    Usuario->>MercadoPago: Ingresa datos de tarjeta y paga
    MercadoPago->>Frontend: Redirect a /success?order_id= o /failure?order_id= o /pending?order_id=
    Frontend->>get-order: GET /.netlify/functions/get-order?order_id=
    get-order->>NeonDB: Consulta estado real de la orden
    NeonDB-->>get-order: { status, items, total }
    get-order-->>Frontend: Muestra estado actualizado al usuario
```

### Flujo paralelo del Webhook (notificación asíncrona)

```mermaid
sequenceDiagram
    participant MercadoPago
    participant mercadopago-webhook
    participant NeonDB

    MercadoPago->>mercadopago-webhook: POST notificación (payment.created / payment.updated)
    mercadopago-webhook->>mercadopago-webhook: Valida firma con MERCADOPAGO_WEBHOOK_SECRET
    mercadopago-webhook->>MercadoPago: GET /v1/payments/{payment_id}
    MercadoPago-->>mercadopago-webhook: Detalle del pago (status, order_id)
    mercadopago-webhook->>NeonDB: UPDATE orders SET status = approved|rejected|pending
    alt status = approved
        mercadopago-webhook->>NeonDB: Descuenta stock en tabla products
    end
    mercadopago-webhook-->>MercadoPago: HTTP 200 OK
```

> **Importante:** El redirect a `/success` ocurre inmediatamente después del pago en MP,
> pero el webhook puede llegar unos segundos después. Por eso `get-order` consulta la
> base de datos en tiempo real en lugar de confiar solo en el parámetro de la URL.

---

## 2. Crear la aplicación en MercadoPago

### Paso a paso

1. Ir a **https://www.mercadopago.cl/developers/panel**
2. Iniciar sesión con la cuenta de MercadoPago del negocio (no una cuenta personal de prueba).
3. Hacer clic en **"Crear aplicación"**.
4. Completar el formulario:
   - **Nombre de la aplicación:** `Tienda devsChile`
   - **¿Para qué usarás MercadoPago?** → `Pagos online`
   - **Integración:** `Checkout Pro`
   - **¿Usarás el modo binario?** → No (recomendado para manejar pagos `in_process`)
5. Aceptar los términos y hacer clic en **"Crear aplicación"**.

### Dónde encontrar las credenciales

Dentro de la aplicación creada, ir a **Credenciales** en el menú lateral:

| Credencial | Descripción | Pestaña |
|---|---|---|
| **Public Key** | Clave pública para el frontend (Checkout Bricks) | TEST / PRODUCCIÓN |
| **Access Token** | Token secreto para el backend (crear preferencias, consultar pagos) | TEST / PRODUCCIÓN |
| **Client ID** | Identificador de la aplicación | TEST / PRODUCCIÓN |
| **Client Secret** | Secreto de la aplicación (OAuth flows) | TEST / PRODUCCIÓN |

> **Diferencia entre TEST y PRODUCCIÓN:**
> El panel muestra dos pestañas claramente diferenciadas: **"Credenciales de prueba"**
> y **"Credenciales de producción"**. Las credenciales de prueba solo funcionan con
> tarjetas de prueba de MP y usuarios de sandbox. Las de producción procesan pagos
> reales con dinero real. **Nunca mezclar entre entornos.**

---

## 3. Configuración de dos entornos

### 3a. Desarrollo / Staging (`tienda-devschile.netlify.app`)

Usa las **credenciales de TEST** (pestaña "Credenciales de prueba") de la aplicación MP.

**Configurar en Netlify Dashboard:**
- Ir a **Netlify → Tu sitio → Site configuration → Environment variables**
- Al agregar cada variable, en el selector de **"Scope"** elegir:
  - `Deploy previews`
  - `Branch deploys`
  - (NO seleccionar `Production`)

| Variable | Valor esperado |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-xxxxxxxxxxxx-xxxxxx-...` (empieza con `TEST-`) |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret generado al registrar la URL de staging en MP Webhooks |
| `SITE_URL` | `https://tienda-devschile.netlify.app` |
| `ALLOWED_ORIGINS` | `https://tienda-devschile.netlify.app,http://localhost:5173` |

---

### 3b. Producción (`tienda.devschile.cl`)

Usa las **credenciales de PRODUCCIÓN** (pestaña "Credenciales de producción") de la aplicación MP.

**Configurar en Netlify Dashboard:**
- Ir a **Netlify → Tu sitio → Site configuration → Environment variables**
- Al agregar cada variable, en el selector de **"Scope"** elegir **solo `Production`**

| Variable | Valor esperado |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-xxxxxxxxxxxx-xxxxxx-...` (empieza con `APP_USR-`) |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret generado al registrar la URL de producción en MP Webhooks |
| `SITE_URL` | `https://tienda.devschile.cl` |
| `ALLOWED_ORIGINS` | `https://tienda.devschile.cl` |

> ⚠️ **Nunca** poner credenciales de producción en el archivo `.env` del repositorio
> ni en archivos que puedan quedar en el historial de git. Solo configurarlas
> directamente en el Netlify Dashboard con scope `Production`.

---

### 3c. Local (`.env`)

Para desarrollo local, usar las **credenciales de TEST**. Crear el archivo `.env` en la
raíz del proyecto (ya debe estar en `.gitignore`):

```env
# MercadoPago — credenciales de TEST
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-...
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=<secret generado en MP para la URL de staging o un valor local>

# Base de datos
NEON_DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Configuración del sitio
SITE_URL=http://localhost:8888
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8888
NODE_ENV=development
```

> Para probar el webhook localmente se puede usar **ngrok** (`ngrok http 8888`) y
> registrar la URL temporal de ngrok en el panel de MP. El `MERCADOPAGO_WEBHOOK_SECRET`
> deberá actualizarse con el secret de esa URL temporal.

---

## 4. Configurar el Webhook

El webhook es la pieza más crítica: permite que el sistema se entere de que un pago
fue aprobado incluso si el usuario cierra el navegador antes de volver al sitio.

### Paso a paso en el panel de MP

1. Ir a **https://www.mercadopago.cl/developers/panel**
2. Seleccionar la aplicación **Tienda devsChile**
3. En el menú lateral, ir a **Webhooks** (también puede aparecer como **Notificaciones IPN**)
4. Hacer clic en **"Agregar URL"** o **"Configurar notificaciones"**

### Registrar URL de producción

- **URL:** `https://tienda.devschile.cl/.netlify/functions/mercadopago-webhook`
- **Eventos a activar:**
  - ✅ `payment` → incluye `payment.created` y `payment.updated`
- Hacer clic en **"Guardar"**
- MP generará un **Webhook Secret** (clave de firma) — copiarlo inmediatamente
- Guardar ese secret como `MERCADOPAGO_WEBHOOK_SECRET` en Netlify (scope: `Production`)

### Registrar URL de staging

- **URL:** `https://tienda-devschile.netlify.app/.netlify/functions/mercadopago-webhook`
- **Eventos a activar:**
  - ✅ `payment` → incluye `payment.created` y `payment.updated`
- Hacer clic en **"Guardar"**
- MP generará un **Webhook Secret distinto** para esta URL — copiarlo
- Guardar ese secret como `MERCADOPAGO_WEBHOOK_SECRET` en Netlify (scope: `Deploy previews` y `Branch deploys`)
- También guardarlo en el `.env` local si se prueba con esa URL de staging

### Dónde guardar el Webhook Secret

| Entorno | Dónde guardarlo |
|---|---|
| Producción | Netlify Dashboard → Environment variables → scope: `Production` |
| Staging / Deploy previews | Netlify Dashboard → Environment variables → scope: `Deploy previews` + `Branch deploys` |
| Local | Archivo `.env` en la raíz del proyecto |

> ⚠️ **El webhook secret es diferente para cada URL registrada.** MP genera un secret
> único por URL. Si se registra la URL de producción y la de staging, cada una tendrá
> su propio secret y deben configurarse en el entorno correspondiente.

### Cómo valida el webhook la firma

La function `mercadopago-webhook` recibe el header `x-signature` de MP y lo compara
con un HMAC-SHA256 calculado con el `MERCADOPAGO_WEBHOOK_SECRET`. Si la firma no
coincide, retorna `401` y descarta la notificación. Esto protege el endpoint de
llamadas fraudulentas externas.

---

## 5. Tarjetas de prueba (sandbox)

Usar estas tarjetas **solo en entorno de TEST** con las credenciales de prueba de MP.

### Tarjetas principales para Chile (CLP)

| Resultado | Número de tarjeta | CVV | Vencimiento | Titular |
|---|---|---|---|---|
| ✅ Aprobado | `5416 7526 0258 2580` | `123` | `11/25` | `APRO` |
| ❌ Rechazado (fondos insuficientes) | `4000 0000 0000 0002` | `123` | `11/25` | `FUND` |
| ❌ Rechazado (tarjeta deshabilitada) | `4000 0000 0000 0002` | `123` | `11/25` | `CONT` |
| ❌ Rechazado (otro motivo) | `4000 0000 0000 0002` | `123` | `11/25` | `OTHE` |
| 🕐 Pendiente (en proceso) | `4170 0688 9820 0010` | `123` | `11/25` | `CONT` |

> El **nombre del titular** (campo "Nombre como aparece en la tarjeta") es lo que
> determina el resultado en sandbox, no el número de tarjeta. Usar exactamente los
> valores indicados en la columna "Titular".

### Monto mínimo en CLP para pruebas

El monto debe ser **mayor a $1 CLP**. Se recomienda usar montos reales de los productos
para que las pruebas sean representativas.

### Usuarios de prueba en MP (requerido para sandbox)

Para hacer una prueba completa en sandbox se necesitan **dos usuarios de prueba**:
uno que "vende" (el vendedor) y uno que "compra" (el comprador).

**Cómo crearlos:**

1. Ir a **https://www.mercadopago.cl/developers/panel**
2. En el menú lateral seleccionar **"Cuentas de prueba"** (dentro de la sección Testing)
3. Hacer clic en **"Crear cuenta de prueba"**
4. Crear dos cuentas:
   - **Tipo Vendedor:** usar sus credenciales en las variables de entorno del proyecto
   - **Tipo Comprador:** usar este email al completar el formulario de checkout en la prueba
5. Ambas cuentas tendrán dinero ficticio de MP para simular transacciones

> En la práctica, para pruebas básicas del flujo (sin verificar el balance del vendedor)
> es suficiente con crear solo el comprador de prueba y usar las credenciales TEST de la
> cuenta principal.

### Documentación oficial

- 📄 **Tarjetas de prueba para Chile:**
  https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards/chile
- 📄 **Cómo hacer pruebas con Checkout Pro:**
  https://www.mercadopago.cl/developers/es/docs/checkout-pro/test

---

## 6. Variables de entorno — referencia completa

| Variable | Entorno | Descripción | Dónde obtenerla | Ejemplo |
|---|---|---|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Backend only | Token de acceso para firmar requests a la API de MP. **Nunca exponer en el frontend.** | Panel MP → Tu aplicación → Credenciales → Access Token | `TEST-123...` (dev) / `APP_USR-123...` (prod) |
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Frontend bundle | Clave pública de MP. Hoy no se usa activamente; reservada para integrar Checkout Bricks en el futuro. Al tener prefijo `VITE_` queda expuesta en el bundle del cliente — es seguro, MP la diseña para ser pública. | Panel MP → Tu aplicación → Credenciales → Public Key | `TEST-abc...` (dev) / `APP_USR-abc...` (prod) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Backend only | Secret para validar la firma HMAC-SHA256 de las notificaciones entrantes de MP. Es diferente por cada URL registrada. | Panel MP → Tu aplicación → Webhooks → Secret (generado al registrar la URL) | `abc123xyz...` |
| `NEON_DATABASE_URL` | Backend only | Cadena de conexión PostgreSQL a la base de datos en Neon. | console.neon.tech → Tu proyecto → Connection string | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` |
| `ALLOWED_ORIGINS` | Backend only | Lista de orígenes permitidos por CORS, separados por coma. Las Netlify Functions la usan para el header `Access-Control-Allow-Origin`. | Definido manualmente según los dominios del proyecto | `https://tienda.devschile.cl,https://tienda-devschile.netlify.app` |
| `SITE_URL` | Backend only | URL base del sitio. Se usa para construir las `back_urls` (success, failure, pending) y la `notification_url` al crear preferencias en MP. | Definido manualmente | `https://tienda.devschile.cl` (prod) / `https://tienda-devschile.netlify.app` (staging) |
| `NODE_ENV` | Backend | Modo de ejecución de Node. Netlify lo define automáticamente como `production` en los deploys. Localmente será `development`. | Netlify lo inyecta automáticamente; en local no es necesario definirlo | `production` |

---

## 7. Configurar en Netlify Dashboard

### Paso 1 — Acceder a las variables de entorno

1. Ir a **https://app.netlify.com**
2. Seleccionar el sitio **tienda-devschile**
3. En el menú lateral ir a **Site configuration**
4. Hacer clic en **Environment variables**

### Paso 2 — Agregar `NEON_DATABASE_URL` (todos los contextos)

1. Hacer clic en **"Add a variable"** → **"Add a single variable"**
2. Key: `NEON_DATABASE_URL`
3. Values: pegar la cadena de conexión de Neon
4. En **"Scope"** seleccionar **"All scopes"** (esta variable es la misma en todos los entornos)
5. Hacer clic en **"Save"**

### Paso 3 — Agregar credenciales MP de PRODUCCIÓN

1. Hacer clic en **"Add a variable"** → **"Add a single variable"**
2. Key: `MERCADOPAGO_ACCESS_TOKEN`
3. Hacer clic en **"Add value by context"**
4. En el selector de contexto elegir **"Production"**
5. Pegar el Access Token de producción (`APP_USR-...`)
6. Hacer clic en **"Save"**
7. Repetir para `VITE_MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET` y `SITE_URL`
   con sus respectivos valores de producción

### Paso 4 — Agregar credenciales MP de STAGING

1. Seleccionar la variable `MERCADOPAGO_ACCESS_TOKEN` ya creada → hacer clic en **"Edit"**
2. Hacer clic en **"Add value by context"**
3. En el selector de contexto elegir **"Deploy previews"**
4. Pegar el Access Token de TEST (`TEST-...`)
5. Repetir seleccionando **"Branch deploys"** con el mismo valor de TEST
6. Hacer clic en **"Save"**
7. Repetir para `VITE_MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET` y `SITE_URL`

### Paso 5 — Verificar que las variables están disponibles en las Functions

Las Netlify Functions tienen acceso automático a todas las variables de entorno
configuradas en el Dashboard (equivalen a `process.env.NOMBRE_VARIABLE` en Node.js).

Para verificar:
1. Ir a **Netlify → Tu sitio → Deploys**
2. Abrir el log del último deploy
3. Buscar cualquier error de `undefined` en variables de entorno durante el build
4. Alternativamente, agregar temporalmente un `console.log` en una function y revisar
   **Functions → [nombre de la function] → Logs** en tiempo real desde el Dashboard

---

## 8. Checklist pre-lanzamiento

### MercadoPago

- [ ] Aplicación creada con nombre **"Tienda devsChile"** en el panel de MP
- [ ] Credenciales de TEST copiadas en `.env` local y en Netlify (scopes: Deploy previews + Branch deploys)
- [ ] Credenciales de PRODUCCIÓN copiadas en Netlify (scope: Production únicamente)
- [ ] Webhook registrado para `tienda.devschile.cl` con eventos `payment.*`
- [ ] Webhook registrado para `tienda-devschile.netlify.app` con eventos `payment.*` (staging)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` de producción guardado en Netlify (scope: Production)
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` de staging guardado en Netlify (scope: Deploy previews + Branch deploys)
- [ ] Prueba de pago completa en sandbox: flujo **aprobado** (tarjeta APRO)
- [ ] Prueba de pago completa en sandbox: flujo **rechazado** (titular FUND u OTHE)
- [ ] Prueba de pago completa en sandbox: flujo **pendiente** (cuando aplique)
- [ ] Verificar que el webhook recibe la notificación y actualiza el status de la orden en NeonDB
- [ ] Verificar que el stock se descuenta en la tabla `products` al aprobar el pago

### Netlify

- [ ] Variables de entorno configuradas por contexto (Production vs Deploy previews)
- [ ] `ALLOWED_ORIGINS` incluye `https://tienda.devschile.cl` y `https://tienda-devschile.netlify.app`
- [ ] Dominio custom `tienda.devschile.cl` configurado y con SSL activo en Netlify
- [ ] Deploy de producción exitoso (sin errores de build ni de functions)

### NeonDB

- [ ] Todas las migraciones aplicadas (01 al 06) en la base de datos de producción
- [ ] Trigger `trg_sync_available` funcionando (sincroniza stock disponible)
- [ ] Tablas `orders` y `order_items` creadas con las columnas correctas
- [ ] Conexión desde las Netlify Functions verificada (sin timeouts de SSL)

---

## 9. Flujo de prueba end-to-end

Guía para verificar que todo el sistema funciona de punta a punta antes de lanzar.

### Prerrequisitos

- Variables de entorno de TEST configuradas en `.env`
- Netlify CLI instalado: `npm install -g netlify-cli`
- Base de datos con al menos un producto con stock > 0

### Pasos

**1. Levantar el entorno local**

```bash
# En una terminal: levantar las Netlify Functions localmente
npm run dev:functions

# En otra terminal: levantar el frontend con Vite
npm run dev
```

Abrir el navegador en `http://localhost:5173` (o el puerto que indique Vite).

**2. Agregar producto al carrito**

Navegar al catálogo y agregar un producto al carrito.
*(Cuando el carrito esté implementado como flujo completo.)*

**3. Completar el formulario de checkout**

- Usar el email de un **usuario comprador de prueba** de MP
- Completar nombre, email y demás campos requeridos
- Hacer clic en **"Pagar"** o **"Comprar"**

**4. Pagar en MercadoPago (sandbox)**

- El navegador redirige al sitio de MP (entorno sandbox)
- Seleccionar tarjeta de crédito
- Ingresar los datos de la **tarjeta de prueba aprobada:**
  - Número: `5416 7526 0258 2580`
  - CVV: `123`
  - Vencimiento: `11/25`
  - Titular: `APRO`
- Confirmar el pago

**5. Verificar el redirect de retorno**

MP redirige de vuelta al sitio a la URL:
```
http://localhost:5173/success?order_id=<UUID>
```
(o `/failure` / `/pending` según el resultado)

**6. Verificar el estado de la orden en NeonDB**

```sql
SELECT id, status, total, created_at, updated_at
FROM orders
WHERE id = '<order_id del paso anterior>';
```

El status debe ser `approved` (puede tardar unos segundos si el webhook llega después del redirect).

**7. Verificar que el stock bajó**

```sql
SELECT id, name, stock, available
FROM products
WHERE id = '<product_id del producto comprado>';
```

El valor de `available` (o `stock`) debe haber disminuido en la cantidad comprada.

**8. Revisar los logs de la function del webhook**

En Netlify CLI, los logs de las functions aparecen en la terminal donde corre
`npm run dev:functions`. Buscar:

```
[mercadopago-webhook] Payment approved for order <order_id>
```

---

## 10. Problemas comunes y soluciones

### "Payment service unavailable" al crear la preferencia

**Causa:** La variable `MERCADOPAGO_ACCESS_TOKEN` no está configurada o tiene un valor
incorrecto en el entorno actual.

**Solución:**
1. Verificar que `.env` contiene `MERCADOPAGO_ACCESS_TOKEN` con un valor que empiece en `TEST-` (local)
2. Verificar que la function tiene acceso al token (agregar `console.log(!!process.env.MERCADOPAGO_ACCESS_TOKEN)` temporalmente)
3. Si está en Netlify, ir a Environment variables y confirmar que el scope incluye el contexto del deploy actual

---

### El webhook no llega (orden siempre en `pending`)

**Causas posibles:**

- La URL del webhook no está registrada en el panel de MP
- La URL está registrada pero con un error tipográfico
- MP no puede alcanzar la URL (entorno local sin tunnel)
- La firma HMAC no coincide y el endpoint retorna 401

**Solución:**
1. Ir al panel de MP → Webhooks → verificar que la URL está registrada y activa
2. En Netlify, ir a **Functions → mercadopago-webhook → Logs** y buscar errores
3. Para local, usar `ngrok http 8888` y registrar la URL de ngrok en MP
4. Verificar que `MERCADOPAGO_WEBHOOK_SECRET` corresponde al secret de esa URL específica

---

### "Origin not allowed" / Error de CORS

**Causa:** El dominio desde el que se hace la request no está incluido en `ALLOWED_ORIGINS`.

**Solución:**
1. Verificar el valor de `ALLOWED_ORIGINS` en el entorno actual
2. Debe incluir el origen exacto incluyendo protocolo y puerto si aplica:
   - Local: `http://localhost:5173`
   - Staging: `https://tienda-devschile.netlify.app`
   - Producción: `https://tienda.devschile.cl`
3. Actualizar la variable y hacer un nuevo deploy (las variables de entorno requieren redeploy para aplicarse)

---

### El stock no baja después de un pago aprobado

**Causa:** El webhook no procesó correctamente el evento de pago aprobado.

**Solución:**
1. Ir a **Netlify → Functions → mercadopago-webhook → Logs**
2. Buscar el log del evento correspondiente al `payment_id`
3. Verificar que no hay errores de SQL o de conexión a NeonDB
4. Verificar que la orden existe en la base de datos con el `order_id` correcto
5. Si el log muestra que el pago fue procesado pero el stock no bajó, revisar que el trigger `trg_sync_available` esté activo en la base de datos

---

### Redirect a `/success` pero la orden aparece en `pending`

**Causa:** MP redirige al usuario inmediatamente después del pago, pero el webhook
que actualiza el status de la orden puede llegar algunos segundos después.

**Este comportamiento es normal.** La UI de `/success` debe:
1. Mostrar un estado de carga mientras consulta `get-order`
2. Hacer polling o retry si el status sigue en `pending` por algunos segundos
3. Mostrar el estado final una vez que el webhook actualizó la orden

Si la orden permanece en `pending` por más de 2 minutos, entonces revisar los logs
del webhook para detectar un problema real.

---

### Las credenciales de TEST generan error 401

**Causa:** Se está usando el Access Token de TEST con la URL de producción de MP (o viceversa).

**Regla:**
- Access Token `TEST-...` → solo funciona con el endpoint sandbox de MP y tarjetas de prueba
- Access Token `APP_USR-...` → solo funciona en producción con tarjetas reales

Verificar que el entorno activo tiene el token correcto para el contexto en que se ejecuta.

---

*Última actualización: julio 2026 — devsChile*
