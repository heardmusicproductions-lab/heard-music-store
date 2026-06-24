const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { items } = req.body;

    const line_items = items.map(item => ({

      price_data: {
        currency: "gbp",

        product_data: {
          name: item.name,
          description: item.license,

          metadata: {
            downloadUrl: item.downloadUrl
          }
        },

        unit_amount: item.price * 100
      },

      quantity: 1

    }));


    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      mode: "payment",

      line_items,

      success_url:
        "https://heard-music-store.vercel.app/success.html?session_id={CHECKOUT_SESSION_ID}",

      cancel_url:
        "https://heard-music-store.vercel.app/cancel.html"

    });

    res.status(200).json({
      url: session.url
    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

};
