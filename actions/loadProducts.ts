// Acción para cargar productos desde NeonDB (vía Netlify Function),
// con fallback automático a los datos mock si la función no está disponible.
import type { ProductResponse } from '@/types/products';
import { productsMock as records } from '@/app/productsMock';

export const loadProducts = async (): Promise<ProductResponse> => {
  const response = await fetch('/.netlify/functions/get-products', {
    cache: 'no-store', // siempre ir a Neon, nunca servir caché del browser
  });

  if (!response.ok) {
    throw new Error('Error al cargar los productos desde el servidor');
  }

  return response.json();
};

// Datos de respaldo si la Netlify Function no responde (ej. desarrollo con `vite dev`
// en lugar de `netlify dev`, o la base de datos momentáneamente no disponible).
export const productsMockFallback: ProductResponse = { records };

export default loadProducts;
