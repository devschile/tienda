// Action to load all active products from the API
import { action } from '@uibakery/data';

function loadProducts() {
  return action('loadProducts', 'HTTP', {
    datasourceName: 'httpApi',
    options: {
      method: 'GET',
      url: '{{params?.apiUrl}}/products',
      queryParams: {
        active: 'true',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
}

export default loadProducts;
