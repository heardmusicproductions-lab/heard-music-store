const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return res.status(500).json({
      ok: false,
      error: "Admin security is not configured"
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }

  const expires = Date.now() + (8 * 60 * 60 * 1000);

  const signature = crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(String(expires))
    .digest("hex");

  const token = `${expires}.${signature}`;

  res.setHeader(
    "Set-Cookie",
    `heard_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
  );

  return res.status(200).json({ ok: true });
};
