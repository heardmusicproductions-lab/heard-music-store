module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const event = req.body;

  console.log("Stripe webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Payment completed for:", session.customer_email);
    console.log("Session ID:", session.id);
  }

  return res.status(200).json({ received: true });
};
