/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './admin/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#b45b38',
          secondary: '#85422b',
          accent: '#d4a373',
          background: '#fdfaf8',
          surface: '#f5ece4',
          // Verde oliva/ocre — color exclusivo de botones de compra
          cta: '#6b7c33',
          'cta-to': '#8c9e44',
          'cta-hover': '#59692b',
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
