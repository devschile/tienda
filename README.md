# 🧸 Amigurumis de Inés

Una aplicación web de e-commerce para la venta de amigurumis hechos a mano, creada con React, TypeScript y Vite.

## ✨ Características

- 🎨 Diseño moderno y responsive con Tailwind CSS
- 🛍️ Catálogo de productos con modales de imagen
- 💳 Simulación de proceso de pago
- 🔔 Sistema de notificaciones toast
- 📱 Totalmente responsive
- ⚡ Desarrollo rápido con Vite
- 🎯 TypeScript para mayor seguridad de tipos

## 🛠️ Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de build y desarrollo
- **Tailwind CSS** - Framework de CSS utilitario
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos
- **ESLint** - Linting de código

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de instalación

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd amigurumis-ines
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador en:**
   ```
   http://localhost:3000
   ```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Preview de la build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run lint:fix` - Ejecuta ESLint y corrige errores automáticamente
- `npm run type-check` - Verifica tipos de TypeScript

## 📁 Estructura del Proyecto

```
amigurumis-ines/
├── public/                 # Archivos públicos estáticos
├── src/                   # Código fuente principal
│   ├── main.tsx          # Punto de entrada de la aplicación
│   └── index.css         # Estilos globales con Tailwind
├── app/                   # Componente principal de la aplicación
│   └── app.tsx           # Aplicación principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   ├── ProductCard.tsx   # Tarjeta de producto
│   ├── ProductImageModal.tsx # Modal de imagen de producto
│   └── InfoModal.tsx     # Modal de información
├── hooks/                 # Hooks personalizados
│   └── use-toast.ts      # Hook para notificaciones
├── lib/                   # Utilidades y configuraciones
│   └── utils.ts          # Funciones utilitarias
├── types/                 # Definiciones de tipos TypeScript
│   └── products.ts       # Tipos relacionados con productos
├── actions/               # Acciones/servicios
│   ├── loadProducts.ts   # Carga de productos
│   └── createPayment.ts  # Creación de pagos
└── package.json          # Configuración del proyecto
```

## 🔧 Configuración de Airtable (Opcional)

El proyecto está configurado para trabajar con Airtable como base de datos. Para conectar con tu propia base de datos:

1. **Configura las variables en `app/app.tsx`:**
   ```typescript
   const AIRTABLE_CONFIG = {
     apiKey: 'tu_api_key_de_airtable',
     baseId: 'tu_base_id',
     tableName: 'Productos',
   };
   ```

2. **Estructura requerida de la tabla en Airtable:**
   - `nombre` (Single line text) - Nombre del producto
   - `precio` (Number) - Precio del producto
   - `descripcion` (Long text) - Descripción del producto
   - `imagen` (Attachment) - Imágenes del producto

## 🎨 Personalización

### Colores y Tema
El proyecto utiliza una paleta de colores cálidos (rosa, naranja, ámbar). Para cambiar los colores, modifica las clases de Tailwind CSS en los componentes.

### Componentes UI
Los componentes base se encuentran en `components/ui/` y utilizan Radix UI como base. Puedes personalizarlos según tus necesidades.

## 🚀 Despliegue

### Build para Producción
```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`.

### Opciones de Despliegue
- **Netlify**: Conecta tu repositorio y despliega automáticamente
- **Vercel**: Ideal para proyectos React/Vite
- **GitHub Pages**: Para hosting gratuito
- **Servidor propio**: Sube los archivos de `dist/` a tu servidor

## 🤝 Contribución

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📋 Lista de Tareas Completadas

- [x] Conectar Airtable como fuente de datos
- [x] Crear layout principal con encabezado
- [x] Implementar grilla responsive de productos
- [x] Crear modal para visualizar imágenes grandes
- [x] Implementar botón de compra con simulación de pago
- [x] Aplicar estilos con diseño limpio y responsive
- [x] Crear modal de información de la tienda
- [x] Configurar proyecto con Vite y TypeScript

## 📋 Lista de Tareas Pendientes

- [ ] Integración completa con pasarela de pagos real
- [ ] Sistema de autenticación de usuarios
- [ ] Panel de administración para gestión de productos
- [ ] Carrito de compras
- [ ] Sistema de búsqueda y filtros
- [ ] Optimización SEO
- [ ] Tests unitarios y de integración

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Creadora**: Inés
- **Desarrollador**: Jorge Puñán
- **Email**: [tu-email@ejemplo.com]

---

¡Gracias por visitar Amigurumis de Inés! 🧸❤️
