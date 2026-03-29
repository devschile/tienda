// Acción para cargar todos los productos activos desde la API
import { action } from '@uibakery/data';

function loadProducts() {
  return action('loadProducts', 'HTTP', {
    datasourceName: 'httpApi',
    options: {
      method: 'GET',
      url: '{{params?.apiUrl}}/products',
      queryParams: {
        activo: 'true',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
}

export default loadProducts;
