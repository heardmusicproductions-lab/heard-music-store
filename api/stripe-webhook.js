module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Stripe webhook received");

  return res.status(200).json({ received: true });
};
