// netlify/functions/verifyPayment.js
export async function handler(event, context) {
  try {
    const body = JSON.parse(event.body);
    const reference = body.reference;

    if (!reference) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing reference' }),
      };
    }

    const paystackSecret = process.env.VITE_PAYSTACK_SECRET_KEY;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      return {
        statusCode: 200,
        body: JSON.stringify({ verified: true, data: result.data }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ verified: false, error: 'Verification failed' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
