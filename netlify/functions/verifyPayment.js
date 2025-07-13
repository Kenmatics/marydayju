import fetch from 'node-fetch';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { reference } = JSON.parse(event.body);
  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing payment reference' }),
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.VITE_PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log("✅ Paystack Response:", JSON.stringify(data));

    if (data.status && data.data?.status === 'success') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: data.data,
        }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: data.message || 'Payment not successful',
          data: data.data || null
        }),
      };
    }
  } catch (error) {
    console.error("❌ Server Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Server error',
      }),
    };
  }
}
