# Amigurumis de Inés - Ecommerce con MercadoPago

Sitio web para la venta de amigurumis tejidos a mano por Inés. Construido con React, TypeScript, Tailwind CSS y Vite. **Ahora con integración completa de MercadoPago para pagos reales**.

## ✨ Características

- 🎨 Diseño responsivo y atractivo con gradientes cálidos
- 📱 Interfaz moderna optimizada para móviles
- 🛍️ Catálogo de productos dinámico desde Airtable
- 💳 **Pagos reales con MercadoPago** (¡NUEVO!)
- 🔒 Pago seguro con redirección a MercadoPago
- ✅ Páginas de confirmación: éxito, falla y pendiente
- 📊 Gestión de estados de pago completa
- 🎯 Sin carrito de compras - compra directa por producto

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + Gradientes personalizados
- **UI Components**: Radix UI + shadcn/ui
- **Datos**: Airtable API
- **Pagos**: MercadoPago SDK + Netlify Functions
- **Despliegue**: Netlify (Frontend + Functions)

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

**Variables requeridas:**

#### Airtable (para productos)
```env
VITE_AIRTABLE_API_KEY=tu_airtable_api_key_aqui
VITE_AIRTABLE_BASE_ID=tu_base_id_aqui
VITE_AIRTABLE_TABLE_NAME=Productos
```

#### MercadoPago (para pagos)
```env
# Clave pública (frontend) - esta se puede exponer
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui

# Clave privada (backend) - solo en Netlify Functions
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
```

### 3. Configurar MercadoPago

1. **Crea una cuenta en [MercadoPago Developers](https://www.mercadopago.cl/developers)**
2. **Crea una nueva aplicación**
3. **Obtén tus credenciales:**
   - `Public Key`: Para el frontend (VITE_MERCADOPAGO_PUBLIC_KEY)
   - `Access Token`: Para el backend (MERCADOPAGO_ACCESS_TOKEN)

### 4. Configurar Airtable

La aplicación espera una tabla llamada "Productos" con estos campos:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | Texto | ✅ | Nombre del producto |
| `descripcion` | Texto largo | ✅ | Descripción detallada |
| `precio` | Número | ✅ | Precio en CLP |
| `imagen_miniatura` | Attachment | ✅ | Imagen 300x300px |
| `imagenes_grandes` | Attachment | ✅ | Imágenes alta resolución |
| `activo` | Checkbox | ✅ | Disponible para venta |

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
│       ├── create-payment.js      # Netlify Function para MercadoPago
│       └── package.json           # Dependencias de Functions
├── app/
│   └── app.tsx                    # Componente principal con pago
├── components/
│   └── ProductCard.tsx            # Card de producto con botón comprar
├── success.html                   # Página de pago exitoso
├── failure.html                   # Página de pago fallido
├── pending.html                   # Página de pago pendiente
├── netlify.toml                   # Configuración de Netlify
├── .env.example                   # Plantilla de variables
└── package.json                   # Dependencias del proyecto
```

## 🌐 Despliegue en Netlify

### Configuración Automática:

1. **Conecta tu repositorio a Netlify**
2. **Variables de entorno en Netlify Dashboard:**
   - Todas las variables `VITE_*` en "Build & deploy" → "Environment"
   - `MERCADOPAGO_ACCESS_TOKEN` en "Functions" → "Environment"
3. **Netlify detectará automáticamente:**
   - Build: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### URLs de Función:

- Crear pago: `https://tu-sitio.netlify.app/.netlify/functions/create-payment`

## 🔧 Personalización

### Modificar Productos:

Edita directamente en tu tabla de Airtable. Los cambios se reflejan automáticamente.

### Cambiar Precios:

Los precios se muestran en CLP (Pesos Chilenos) y se formatean automáticamente.

### Personalizar Estilos:

- Colores principales: `rose-500` y `orange-500`
- Gradientes: `from-rose-500 to-orange-500`
- Tipografía: Sistema fonts optimizados

## 📋 Checklist de Configuración

- [ ] ✅ Instalar dependencias
- [ ] ✅ Configurar variables de Airtable
- [ ] ✅ Crear cuenta en MercadoPago
- [ ] ✅ Obtener credenciales de MercadoPago
- [ ] ✅ Configurar variables de entorno
- [ ] ✅ Conectar repositorio a Netlify
- [ ] ✅ Probar flujo de pagos
- [ ] ✅ Verificar páginas de confirmación

## 🛡️ Seguridad

- **Claves públicas**: Se pueden exponer en el frontend
- **Claves privadas**: Solo en variables de entorno del servidor
- **HTTPS**: Netlify proporciona SSL automático
- **CORS**: Configurado en las Netlify Functions

## 📞 Soporte

Si tienes problemas con la integración de MercadoPago:

1. **Verifica credenciales**: Asegúrate de usar las correctas
2. **Revisa variables de entorno**: Tanto en `.env` como en Netlify
3. **Prueba en sandbox**: Usa credenciales de prueba primero
4. **Logs de Netlify**: Revisa los logs de Functions para errores

## 📄 Licencia

Proyecto privado - © 2025 Amigurumis de Inés. Todos los derechos reservados.

---

**🎉 ¡Listo para recibir pagos reales con MercadoPago!** 💳
