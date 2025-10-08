// Acción para crear pago en la pasarela
import { action } from '@uibakery/data';

function createPayment() {
  return action('createPayment', 'HTTP', {
    datasourceName: 'httpApi',
    options: {
      method: 'POST',
      url: '{{params?.paymentGatewayUrl}}',
      headers: {
        'Content-Type': 'application/json',
      },
      bodyType: 'object',
      body: '{ amount: {{params?.amount}}, productName: {{params?.productName}}, currency: "CLP" }',
    },
  });
}

export default createPayment;
