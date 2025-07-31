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
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      const { transaction_ref } = await request.json();
      if (!transaction_ref) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing transaction_ref" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Squad requires start_date/end_date for list query; use today for both
      const today = new Date().toISOString().split("T")[0];
      const url = new URL("https://api-d.squadco.com/transaction");
      url.searchParams.set("reference", transaction_ref);
      url.searchParams.set("start_date", today);
      url.searchParams.set("end_date", today);

      const resp = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.SQUAD_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const data = await resp.json();

      if (resp.status !== 200) {
        return new Response(
          JSON.stringify({
            success: false,
            error: data.message || "Failed to fetch transaction",
            paystackResponse: data,
          }),
          { status: resp.status, headers: corsHeaders }
        );
      }

      // data.data is expected to be an array of transactions
      const tx = Array.isArray(data.data)
        ? data.data.find(
            (t) => t.transaction_ref === transaction_ref
          )
        : null;

      if (!tx) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Transaction not found",
            paystackResponse: data,
          }),
          { status: 404, headers: corsHeaders }
        );
      }

      if (tx.transaction_status?.toLowerCase() === "success") {
        return new Response(
          JSON.stringify({ success: true, data: tx }),
          { status: 200, headers: corsHeaders }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Verification failed",
            transaction_status: tx.transaction_status,
            paystackResponse: tx,
          }),
          { status: 400, headers: corsHeaders }
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
