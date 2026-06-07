export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const beatLinks = {
  "A Stream Of Dreams - MP3 Lease": https://i5ubjntoku.ufs.sh/f/2qI0fpDRZN6b286GXy3DRZN6biQIdLjf8VBYtqrDFs7oKe9k,
};
  try {
    const { items } = req.body;

    const line_items = items.map(item => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",

success_url: "https://heard-music-store.vercel.app/success.html",
cancel_url: "https://heard-music-store.vercel.app/cancel.html",

 res.status(200).json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
