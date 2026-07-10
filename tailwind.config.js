/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#b45b38', // Terracota del logo (Botones, CTAs)
          secondary: '#85422b', // Café oscuro (Títulos, Bordes)
          accent: '#d4a373', // Café claro (Detalles, Hovers)
          background: '#fdfaf8', // Crema muy claro (Fondo general)
          surface: '#f5ece4', // Arena suave (Cards, Secciones)
        },
        devs: {
          text: '#2d1a12', // Café casi negro para legibilidad
          muted: '#7a6b63', // Gris café para textos secundarios
        },
      },
      fontFamily: {
        sans: ['Onest', 'ui-sans-serif', 'system-ui'],
        mono: ['Fira Mono', 'ui-monospace', 'SFMono-Regular'], // Ideal para el look dev
      },
      borderRadius: {
        brand: '0.5rem', // Bordes ligeramente redondeados y modernos
      },
    },
  },
  plugins: [],
};
