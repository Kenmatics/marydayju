export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://marydayjuenterprise.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
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

      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        const text = await res.text(); // get raw body if not JSON
        return new Response(JSON.stringify({
          success: false,
          error: "Paystack response was not JSON",
          statusCode: res.status,
          raw: text,
        }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      if (!data || !data.status) {
        return new Response(JSON.stringify({
          success: false,
          error: "Empty or invalid response from Paystack",
          statusCode: res.status,
          paystackResponse: data
        }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      if (data.data && data.data.status.toLowerCase() === "success") {
        return new Response(JSON.stringify({ success: true, data: data.data }), {
          status: 200,
          headers: corsHeaders,
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: "Verification failed",
          paystackMessage: data.data?.gateway_response || data.message || "Unknown",
          statusCode: res.status
        }), {
          status: 400,
          headers: corsHeaders,
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message || "Unknown error",
        stack: err.stack,
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
