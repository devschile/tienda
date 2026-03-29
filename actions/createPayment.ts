// Acción para crear pago en la pasarela

export const createPayment = async (
  amount: number,
  productName: string,
  productId: string,
  quantity: number = 1,
) => {
  // En desarrollo, usamos un mock según los requerimientos
  if (import.meta.env.DEV) {
    console.log('Utilizando mock de pago para desarrollo');
    // Simulamos un pequeño retraso de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      checkout_url: '/success.html',
    };
  }

  // En producción, llamamos a la Netlify Function
  const response = await fetch('/.netlify/functions/create-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      productName,
      productId,
      quantity,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al crear el pago en el servidor');
  }

  return response.json();
};

export default createPayment;
