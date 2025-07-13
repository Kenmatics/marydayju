exports.handler = async (event, context) => {
  console.log("🚀 Event received:", event);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { reference } = JSON.parse(event.body);
  console.log("🧾 Verifying reference:", reference);

  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing payment reference' }),
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log("✅ Paystack response data:", JSON.stringify(data));

    if (data.status && data.data?.status === 'success') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: data.data,
        }),
      };
    } else {
      console.error("❌ Verification failed:", data.message);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: data.message || 'Payment not successful',
          data: data.data || null,
        }),
      };
    }
  } catch (error) {
    console.error("❌ Server error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Server error while verifying payment',
      }),
    };
  }
};
