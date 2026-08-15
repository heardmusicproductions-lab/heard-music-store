const crypto = require("crypto");

function isAdminRequest(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(/(?:^|;\s*)heard_admin=([^;]+)/);

  if (!match || !process.env.ADMIN_SESSION_SECRET) {
    return false;
  }

  const [expires, signature] = decodeURIComponent(match[1]).split(".");

  if (!expires || !signature || Number(expires) < Date.now()) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
    .update(String(expires))
    .digest("hex");

  if (signature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

let uploadHandlerPromise;

async function getUploadHandler() {
  if (!uploadHandlerPromise) {
    uploadHandlerPromise = (async () => {
      const {
        createUploadthing,
        createRouteHandler,
        UploadThingError
      } = await import("uploadthing/server");

      const f = createUploadthing();

      const requireAdmin = async ({ req }) => {
        if (!isAdminRequest(req)) {
          throw new UploadThingError("Unauthorized");
        }

        return {};
      };

      const uploadRouter = {
        coverImage: f({
          image: {
            maxFileSize: "8MB",
            maxFileCount: 1
          }
        })
          .middleware(requireAdmin)
          .onUploadComplete(async () => {
            return { ok: true };
          }),

        beatFile: f({
          blob: {
            maxFileSize: "1GB",
            maxFileCount: 1
          }
        })
          .middleware(requireAdmin)
          .onUploadComplete(async () => {
            return { ok: true };
          })
      };

      return createRouteHandler({
        router: uploadRouter,
        config: {
          token: process.env.UPLOADTHING_TOKEN
        }
      });
    })();
  }

  return uploadHandlerPromise;
}

module.exports = async function handler(req, res) {


  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.UPLOADTHING_TOKEN) {
      return res.status(500).json({
        error: "UploadThing is not configured"
      });
    }

    const protocol =
      req.headers["x-forwarded-proto"] || "https";

    const url =
      `${protocol}://${req.headers.host}${req.url}`;

    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(", "));
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    }

    const options = {
      method: req.method,
      headers
    };

    if (req.method === "POST") {
      if (typeof req.body === "string") {
        options.body = req.body;
      } else if (req.body !== undefined) {
        options.body = JSON.stringify(req.body);
      }
    }

    const request = new Request(url, options);
    const uploadHandler = await getUploadHandler();
    const response = await uploadHandler(request);

    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = Buffer.from(await response.arrayBuffer());
    res.end(body);

  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      error: "Upload failed"
    });
  }
};
