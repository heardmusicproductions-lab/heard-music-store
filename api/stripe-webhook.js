export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const beatLinks = {
  "A Stream Of Dreams - MP3 Lease": https://i5ubjntoku.ufs.sh/f/2qI0fpDRZN6b286GXy3DRZN6biQIdLjf8VBYtqrDFs7oKe9k,
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Payment completed:", session.customer_details?.email);
  }

  res.status(200).json({ received: true });
}
