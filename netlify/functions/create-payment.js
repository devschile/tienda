// Netlify Function to handle MercadoPago payment creation
const mercadopago = require('mercadopago');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get MercadoPago credentials from environment variables
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('MercadoPago access token not configured');
    }

    // Configure MercadoPago SDK
    mercadopago.configure({
      access_token: accessToken
    });

    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const { amount, productName, productId } = requestBody;

    // Validate required fields
    if (!amount || !productName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: amount, productName' 
        })
      };
    }

    // Create payment preference
    const preference = {
      items: [
        {
          id: productId || 'amigurumi-' + Date.now(),
          title: productName,
          description: `Amigurumi: ${productName}`,
          unit_price: parseFloat(amount),
          currency_id: 'CLP',
          quantity: 1
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          {
            id: 'ticket'
          }
        ]
      },
      back_urls: {
        success: `${process.env.URL || 'https://amigurumi-de-ines.netlify.app'}/success`,
        failure: `${process.env.URL || 'https://amigurumi-de-ines.netlify.app'}/failure`,
        pending: `${process.env.URL || 'https://amigurumi-de-ines.netlify.app'}/pending`
      },
      auto_return: 'approved',
      expires: false,
      marketplace_fee: 0,
      differential_pricing: {
        mode: 'grand_total'
      },
      shipments: {
        receiver_address: {
          zip_code: '0000000',
          city_name: 'Santiago',
          state_name: 'Región Metropolitana',
          country_name: 'Chile'
        }
      }
    };

    // Create the preference
    const response = await mercadopago.preferences.create(preference);

    // Return the checkout URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkout_url: response.body.init_point,
        preference_id: response.body.id
      })
    };

  } catch (error) {
    console.error('Error creating payment:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error creating payment. Please try again.',
        details: error.message
      })
    };
  }
};