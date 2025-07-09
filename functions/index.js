const functions = require("firebase-functions");
const axios = require("axios");

exports.verifyPaystackPayment = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { reference } = req.body;
  const secretKey = functions.config().paystack.secret;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      }
    });

    return res.status(200).send(response.data);
  } catch (error) {
    console.error("Paystack error:", error.response?.data || error.message);
    return res.status(500).send({ error: "Verification failed." });
  }
});
