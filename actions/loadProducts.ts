// Acción para cargar todos los productos activos desde Airtable
import { action } from '@uibakery/data';

function loadProducts() {
  return action('loadProducts', 'HTTP', {
    datasourceName: 'httpApi',
    options: {
      method: 'GET',
      url: 'https://api.airtable.com/v0/{{params?.baseId}}/{{params?.tableName}}',
      queryParams: {
        filterByFormula: '{activo} = TRUE()',
      },
      headers: {
        Authorization: 'Bearer {{params?.apiKey}}',
      },
    },
  });
}

export default loadProducts;
