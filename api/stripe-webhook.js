module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    console.log("Stripe webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("Payment completed for:", session.customer_email || session.customer_details?.email);
      console.log("Session ID:", session.id);
      console.log("Amount total:", session.amount_total);
      console.log("Payment status:", session.payment_status);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).json({ received: true });
  }
};
