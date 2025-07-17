export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    try {
      const { reference } = await request.json();

      if (!reference) {
        return new Response(JSON.stringify({ error: "Missing reference" }), { status: 400 });
      }

      const paystackSecret = env.PAYSTACK_SECRET_KEY;

      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (result.status && result.data.status === "success") {
        return new Response(JSON.stringify({ success: true, data: result.data }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Verification failed" }), { status: 400 });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
};
