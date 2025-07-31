export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://marydayjuenterprise.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const body = await request.json();
      const {
        amount, // in Naira (e.g., 500)
        email,
        transaction_ref,
        callback_url,
        currency = "NGN",
        metadata = {},
        payment_channels = ["card", "bank", "ussd", "transfer"],
      } = body;

      if (!amount || !email || !transaction_ref || !callback_url) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required field(s)" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Squad expects amount in lowest unit (kobo), so multiply by 100
      const payload = {
        amount: Math.round(Number(amount) * 100),
        email,
        currency,
        initiate_type: "inline",
        transaction_ref,
        callback_url,
        payment_channels,
        metadata,
      };

      const resp = await fetch("https://api-d.squadco.com/transaction/initiate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SQUAD_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (resp.status === 200 && data?.data?.checkout_url) {
        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: data.data.checkout_url,
            raw: data,
          }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: data.message || "Failed to initiate Squad payment",
            raw: data,
          }),
          { status: resp.status || 500, headers: corsHeaders }
        );
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message || "Unknown error" }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
