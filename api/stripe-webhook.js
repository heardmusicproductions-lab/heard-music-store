module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    console.log("Stripe webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail =
        session.customer_email || session.customer_details?.email;

      console.log("Payment completed for:", customerEmail);

      if (customerEmail) {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            sender: {
              name: "Heard Music",
              email: "heardmusicproductions@gmail.com"
            },
            to: [{ email: customerEmail }],
            subject: "Your Heard Music Beat Purchase",
            htmlContent: `
              <h2>Thank you for your purchase</h2>
              <p>Your payment has been received successfully.</p>
              <p>Your beat download and licence will be delivered here.</p>
              <p>Heard Music / YOU CAN SAY YOU HEARD</p>
            `
          })
        });

        console.log("Brevo email sent to:", customerEmail);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).json({ received: true });
  }
};
