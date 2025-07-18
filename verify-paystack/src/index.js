export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://marydayjuenterprise.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const { reference } = await request.json();

      if (!reference) {
        return new Response(JSON.stringify({ error: "Missing reference" }), {
          status: 400,
          headers: corsHeaders,
        });
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
        return new Response(JSON.stringify({ success: true, data: result.data }), {
          status: 200,
          headers: corsHeaders,
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Verification failed" }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
