import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const { cart } = req.body;

    const line_items = cart.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',

      success_url: 'https://heardmusicycsyh.com/success',
      cancel_url: 'https://heardmusicycsyh.com/cancel',

    });

    res.status(200).json({ url: session.url });

  } catch (error) {

    res.status(500).json({
      error: error.message,
    });

  }

}
