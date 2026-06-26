const Stripe = require("stripe");
const PDFDocument = require("pdfkit");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
function getLicenseTerms(licenseType) {
  const type = String(licenseType || "").toLowerCase();

  if (type.includes("trackout")) {
    return {
      rights: [
        "Full trackout/stem files supplied.",
        "Commercial release permitted.",
        "Unlimited streaming permitted.",
        "Unlimited music videos permitted.",
        "Radio play permitted.",
        "Professional mixing and mastering permitted."
      ],
      restrictions: [
        "This licence remains non-exclusive.",
        "Heard Music may continue licensing the instrumental to other artists.",
        "Stems may not be resold, redistributed, or transferred.",
        "This licence applies only to the original purchaser."
      ],
      ownership:
        "Heard Music retains ownership of the instrumental composition. The licensee owns their original lyrics and vocal performance."
    };
  }

  if (type.includes("wav")) {
    return {
      rights: [
        "High quality WAV file supplied.",
        "Non-exclusive usage rights granted.",
        "Commercial release permitted.",
        "Two commercial music videos permitted.",
        "Radio play permitted.",
        "Maximum streaming allowance: 100,000 streams."
      ],
      restrictions: [
        "This licence remains non-exclusive.",
        "Heard Music may continue licensing the instrumental to other artists.",
        "The instrumental may not be resold, redistributed, or transferred.",
        "This licence applies only to the original purchaser."
      ],
      ownership:
        "Heard Music retains ownership of the instrumental composition. The licensee owns their original lyrics and vocal performance."
    };
  }

  if (type.includes("exclusive")) {
    return {
      rights: [
        "Exclusive rights are granted to the purchaser from the date of purchase.",
        "No future licences will be issued for this instrumental after the exclusive sale.",
        "Full commercial exploitation permitted.",
        "Unlimited streams, music videos, broadcasts, and performances permitted.",
        "WAV file and trackout/stem files supplied where available."
      ],
      restrictions: [
        "Any licences issued before the date of this exclusive agreement remain valid.",
        "The instrumental may not be resold as a standalone beat or instrumental.",
        "The licence applies only to the purchaser named on this agreement.",
        "Purchase amount is private and not displayed on this licence."
      ],
      ownership:
        "The purchaser receives exclusive usage rights to the instrumental. Heard Music retains producer credit and any underlying publishing or writer share unless otherwise agreed in writing."
    };
  }

  return {
    rights: [
      "MP3 file supplied.",
      "Non-exclusive usage rights granted.",
      "One commercial audio release permitted.",
      "Distribution to major streaming platforms permitted.",
      "One commercial music video permitted.",
      "Radio play permitted.",
      "Maximum streaming allowance: 50,000 streams."
    ],
    restrictions: [
      "This licence remains non-exclusive.",
      "Heard Music may continue licensing the instrumental to other artists.",
      "The instrumental may not be resold, redistributed, or transferred.",
      "This licence applies only to the original purchaser."
    ],
    ownership:
      "Heard Music retains ownership of the instrumental composition. The licensee owns their original lyrics and vocal performance."
  };
}
function generateLicensePdf({ customerEmail, beatName, licenseType, orderId }) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    
doc.moveDown(1);
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    const purchaseDate = new Date().toLocaleString("en-GB", {
      timeZone: "Europe/London",
    });

    doc.fontSize(22).text("YOU CAN SAY YOU HEARD", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text("Official Beat Licence Certificate", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(13).text("Producer Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text("Producer Name: Heard Music");
    doc.text("Registered PRS Pseudonym: Heard Music");
    doc.text("PRS Pseudonym Number: 379132542");
    doc.text("CAE/IPI Number: 876594277");
    doc.text('Producer Tag: "You Can Say You Heard"');
    doc.text("Website: heardmusicycsyh.com");
    doc.text("YCSYH Producer ID: YCSYH");
    doc.moveDown(1.5);

    doc.fontSize(13).text("Licence Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Beat Title: ${beatName}`);
    doc.text(`Licence Type: ${licenseType}`);
    doc.text(`Customer Email: ${customerEmail}`);
    doc.text(`Purchase Date: ${purchaseDate}`);
    doc.text(`Licence ID: ${orderId}`);
    doc.moveDown(1.5);

    doc.fontSize(13).text("Producer Credit", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text("Credit must be given as:");
    doc.moveDown(0.3);
    doc.fontSize(14).text("Produced by Heard Music", { align: "center" });
    doc.moveDown(1.5);

   const terms = getLicenseTerms(licenseType);

doc.fontSize(13).text("Rights Granted", { underline: true });
doc.moveDown(0.5);
doc.fontSize(10);
terms.rights.forEach((right, index) => {
  doc.text(`${index + 1}. ${right}`);
});

doc.moveDown(1);

doc.fontSize(13).text("Restrictions", { underline: true });
doc.moveDown(0.5);
doc.fontSize(10);
terms.restrictions.forEach((restriction, index) => {
  doc.text(`${index + 1}. ${restriction}`);
});

doc.moveDown(1);

doc.fontSize(13).text("Publishing & Ownership", { underline: true });
doc.moveDown(0.5);
doc.fontSize(10).text(terms.ownership);

doc.moveDown(1);

doc.fontSize(13).text("Credit Requirement", { underline: true });
doc.moveDown(0.5);
doc.fontSize(11).text("All releases must credit: Produced by Heard Music");

doc.moveDown(1.5);

doc.fontSize(10).text(
  "This licence serves as proof of purchase and authorised use of the instrumental under the terms listed above."
);

doc.moveDown(1.5);
doc.fontSize(11).text("Issued by: Heard Music / YOU CAN SAY YOU HEARD");
doc.text("PRS / MCPS Registered Writer");
doc.text("CAE/IPI: 876594277");
    
    doc.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail =
        session.customer_email || session.customer_details?.email;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      const downloads = lineItems.data.map((item) => {
        const product = item.price.product;

        return {
          name: product.name,
          license: product.description || "Beat Licence",
          downloadUrl: product.metadata.downloadUrl,
        };
      });

      const downloadHtml = downloads
        .map(
          (item) => `
            <h3>${item.name}</h3>
            <p>${item.license}</p>
            <p><a href="${item.downloadUrl}">Download your beat</a></p>
          `
        )
        .join("");
const attachments = await Promise.all(
  downloads.map(async (item, index) => {
    const pdfBuffer = await generateLicensePdf({
      customerEmail,
      beatName: item.name || "Beat Purchase",
      licenseType: item.license || "Beat Licence",
      orderId: `${session.id}-${index + 1}`,
    });

    return {
      content: pdfBuffer.toString("base64"),
      name: `heard-music-licence-${item.name}-${item.license}.pdf`
        .replace(/[^a-z0-9.-]/gi, "-")
        .toLowerCase(),
    };
  })
);

      if (customerEmail) {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: "Heard Music",
              email: "heardmusicproductions@gmail.com",
            },
            to: [{ email: customerEmail }],
            subject: "Your Heard Music Beat Purchase",
            htmlContent: `
              <h2>Thank you for your purchase</h2>
              <p>Your payment has been received successfully.</p>
              <p>Here is your download:</p>
              ${downloadHtml}
              <p>Your official licence PDF is attached to this email.</p>
              <p>Heard Music / YOU CAN SAY YOU HEARD</p>
            `,
   attachment: attachments,
          }),
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
