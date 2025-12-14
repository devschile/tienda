// Netlify Function to handle MercadoPago payment creation
const mercadopago = require('mercadopago');

exports.handler = async (event, context) => {
  // Get allowed origins from environment (should be set in Netlify)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://amigurumi-de-ines.netlify.app'];
  
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  // Set secure CORS headers
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
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

  // Validate origin for security
  if (!isAllowedOrigin) {
    console.warn('Blocked request from unauthorized origin:', origin);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Origin not allowed' })
    };
  }

  try {
    // Get MercadoPago credentials from environment variables
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('MercadoPago access token not configured');
      throw new Error('Payment service unavailable');
    }

    // Configure MercadoPago SDK
    mercadopago.configure({
      access_token: accessToken
    });

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { amount, productName, productId } = requestBody;

    // Enhanced input validation
    if (!amount || !productName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: amount, productName'
        })
      };
    }

    // Validate data types and sanitize inputs
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid amount: must be a positive number'
        })
      };
    }

    if (numericAmount > 1000000) { // Max 1M CLP
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Amount exceeds maximum limit'
        })
      };
    }

    // Sanitize string inputs
    const sanitizedProductName = String(productName).substring(0, 100).replace(/[<>]/g, '');
    const sanitizedProductId = productId ? String(productId).substring(0, 50).replace(/[<>]/g, '') : null;

    // Get site URL from environment
    const siteUrl = process.env.URL || process.env.SITE_URL || 'https://amigurumi-de-ines.netlify.app';

    // Create payment preference with enhanced security
    const preference = {
      items: [
        {
          id: sanitizedProductId || `amigurumi-${Date.now()}`,
          title: sanitizedProductName,
          description: `Amigurumi: ${sanitizedProductName}`,
          unit_price: numericAmount,
          currency_id: 'CLP',
          quantity: 1,
          category_id: 'handmade'
        }
      ],
      payment_methods: {
        excluded_payment_types: [
          {
            id: 'ticket' // Exclude bank transfers for faster processing
          }
        ],
        installments: 1 // Limit to single payment for simplicity
      },
      back_urls: {
        success: `${siteUrl}/success`,
        failure: `${siteUrl}/failure`,
        pending: `${siteUrl}/pending`
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
    console.error('Error creating payment:', error.message);
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Payment service temporarily unavailable. Please try again.',
        ...(isDevelopment && { details: error.message })
      })
    };
  }
};