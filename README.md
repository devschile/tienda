# Tienda devsChile - Ecommerce con MercadoPago

Sitio web para la venta de productos de la comunidad devsChile.
Construido con React, TypeScript, Tailwind CSS y Vite.
**Ahora con integración completa de MercadoPago para transacciones reales**.

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + Gradientes personalizados
- **UI Components**: Radix UI + shadcn/ui
- **Datos**: API Genérica / Mock Data
- **Pagos**: MercadoPago SDK + Netlify Functions
- **Despliegue**: Netlify (Frontend + Functions)
- **Seguridad**: CORS whitelist, validación de entrada, headers de seguridad

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

**⚠️ IMPORTANTE**: Crea un archivo `.env` basado en `.env.example` o `.env.secure`:

```bash
cp .env.example .env
# O para más seguridad:
cp .env.secure .env
```

**Variables requeridas:**

#### API Configuration (para productos)

```env
VITE_API_URL=https://tu-api.com/v1
```

#### MercadoPago (para pagos)

```env
# Clave pública (frontend) - esta se puede exponer
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui

# Clave privada (backend) - solo en Netlify Functions
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
```

#### Seguridad (Netlify Functions)

```env
# Orígenes permitidos (comas separadas)
ALLOWED_ORIGINS=https://tienda-devschile.cl,http://localhost:3000

NODE_ENV=production
```

### 3. Configurar MercadoPago

1. **Crea una cuenta en [MercadoPago Developers](https://www.mercadopago.cl/developers)**
2. **Crea una nueva aplicación**
3. **Obtén tus credenciales:**
   - `Public Key`: Para el frontend (VITE_MERCADOPAGO_PUBLIC_KEY)
   - `Access Token`: Para el backend (MERCADOPAGO_ACCESS_TOKEN)

### 4. Configuración de API de Productos

La aplicación espera un endpoint `GET /products` que retorne una estructura compatible con `ProductResponse` conteniendo estos campos:

| Campo              | Tipo        | Requerido | Descripción              |
| ------------------ | ----------- | --------- | ------------------------ |
| `nombre`           | Texto       | ✅        | Nombre del producto      |
| `descripcion`      | Texto largo | ✅        | Descripción detallada    |
| `precio`           | Número      | ✅        | Precio en CLP            |
| `imagen_miniatura` | Attachment  | ✅        | Imagen 300x300px         |
| `imagenes_grandes` | Attachment  | ✅        | Imágenes alta resolución |
| `activo`           | Checkbox    | ✅        | Disponible para venta    |

## 🏃‍♂️ Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview

# Linting
npm run lint
```

## 💳 Flujo de Pagos

### Cómo Funciona:

1. **Usuario selecciona producto** → Click en "Comprar Ahora"
2. **Frontend crea preferencia** → Llama a Netlify Function
3. **Netlify Function procesa** → Crea preferencia en MercadoPago
4. **Redirección a MercadoPago** → Usuario completa pago
5. **Retorno al sitio** → Página de confirmación (success/failure/pending)

### Páginas de Confirmación:

- `/success` - Pago aprobado
- `/failure` - Pago rechazado
- `/pending` - Pago pendiente (transferencias)

## 📁 Estructura del Proyecto

```
/
├── netlify/
│   └── functions/
│       ├── create-payment.js      # Netlify Function para MercadoPago (segura)
│       └── package.json           # Dependencias de Functions
├── public/
│   └── images/                    # Imágenes estáticas (accesibles vía /images/*)
├── app/
│   └── app.tsx                    # Componente principal con pago
├── components/
│   └── ProductCard.tsx            # Card de producto con botón comprar
├── success.html                   # Página de pago exitoso
├── failure.html                   # Página de pago fallido
├── pending.html                   # Página de pago pendiente
├── netlify.toml                   # Configuración de Netlify
├── .env.example                   # Plantilla de variables
├── .env.secure                    # Plantilla segura con advertencias
├── SECURITY.md                    # Informe completo de auditoría de seguridad
└── package.json                   # Dependencias del proyecto
```

### URLs de Función:

- Crear pago: `https://tu-sitio.netlify.app/.netlify/functions/create-payment`

#### Comandos de Build Configurados:

```toml
[build]
  command = "npm ci && npm run build"
```

Esto asegura que las dependencias se instalen antes del build.

## 🔧 Personalización

### Modificar Productos:

Edita tus datos en el archivo `app/productsMock.ts` o configura tu API Genérica. Los cambios se reflejan automáticamente.

#### Imágenes Locales:

Puedes guardar imágenes estáticas en la carpeta `public/images/`. Para usarlas en tus productos, utiliza la ruta relativa comenzando con `/images/`.
Ejemplo: Si guardas `mi-producto.jpg` en `public/images/`, la URL en tu JSON/Mock será `/images/mi-producto.jpg`.

### Cambiar Precios:

Los precios se muestran en CLP (Pesos Chilenos) y se formatean automáticamente.

### Personalizar Estilos:

- Colores principales: `brand-primary` (#85422b) y `brand-secondary` (#b45b38)
- Texto principal: `brand-text` (#1d1d1d)
- Gradientes: `from-brand-primary to-brand-secondary`
- Tipografía: Sistema fonts optimizados

## 🛡️ Seguridad

### ⚠️ AUDITORÍA DE SEGURIDAD COMPLETADA

Se realizó una auditoría completa de seguridad que identificó y corrigió vulnerabilidades críticas:

#### Vulnerabilidades Corregidas:

- ✅ **CORS mejorado**: Reemplazado wildcard `*` con whitelist de orígenes
- ✅ **Validación de entrada**: Sanitización y validación de todos los inputs
- ✅ **Headers de seguridad**: X-Frame-Options, X-XSS-Protection, X-Content-Type-Options
- ✅ **Manejo seguro de errores**: Prevención de divulgación de información
- ✅ **Configuración basada en entorno**: URLs y configuraciones seguras

#### 🔴 CREDENCIALES EXPUESTAS - ROTACIÓN REQUERIDA:

**Las siguientes credenciales están expuestas y deben rotarse INMEDIATAMENTE:**

1. **MercadoPago Public Key**: `APP_USR-0ce0eeab-*` (Key completa expuesta)
2. **MercadoPago Access Token**: `APP_USR-2637451468197049-*` (Token completo expuesto)

#### Pasos de Rotación CRÍTICOS:

1. **🔄 Rotar credenciales inmediatamente:**
   - MercadoPago: [Developer Panel](https://www.mercadopago.com.ar/developers/panel/credentials)

2. **🗑️ Eliminar archivo .env actual** después de la rotación

3. **🧹 Limpiar historial de git** si las credenciales fueron commiteadas

4. **⚙️ Configurar en Netlify Dashboard:**
   ```
   MERCADOPAGO_ACCESS_TOKEN=nueva_token_rotado
   ALLOWED_ORIGINS=https://tienda-devschile.netlify.app,http://localhost:5173
   NODE_ENV=production
   ```

#### Medidas de Seguridad Implementadas:

- **Claves públicas**: Se pueden exponer en el frontend
- **Claves privadas**: Solo en variables de entorno del servidor
- **HTTPS**: Netlify proporciona SSL automático
- **CORS**: Configurado con whitelist de orígenes
- **Validación**: Sanitización completa de inputs
- **Headers**: Protección contra XSS, clickjacking y MIME sniffing
- **Gitignore**: Protección contra commits accidentales de credenciales

#### Archivos de Seguridad:

- `SECURITY.md` - Informe detallado de auditoría de seguridad
- `.env.secure` - Plantilla segura con advertencias
- `.env.example` - Plantilla con variables correctas

## 📞 Soporte

Si tienes problemas con la integración de MercadoPago:

1. **🔄 Verifica credenciales rotadas**: Asegúrate de usar las nuevas
2. **Revisa variables de entorno**: Tanto en `.env` como en Netlify
3. **Prueba en sandbox**: Usa credenciales de prueba primero
4. **Logs de Netlify**: Revisa los logs de Functions para errores
5. **Auditoría de seguridad**: Revisa `SECURITY.md` para medidas implementadas

## 📄 Licencia

Proyecto privado - © 2026 Tienda devsChile. Todos los derechos reservados.

---

**🎉 ¡Listo para recibir pagos reales con MercadoPago!** 💳
