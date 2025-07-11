const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { reference } = JSON.parse(event.body);

  if (!reference) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing payment reference" }),
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: true, data: data.data }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ status: false, error: data.message }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: false, error: "Server error" }),
    };
  }
};
