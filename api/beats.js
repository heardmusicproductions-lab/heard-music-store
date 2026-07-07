const { MongoClient, ObjectId } = require("mongodb");

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  cachedClient = client;
  return client;
}

module.exports = async function handler(req, res) {
  try {
    const client = await connectToDatabase();
    const db = client.db("test");
    const beats = db.collection("beats");

    if (req.method === "GET") {
      const allBeats = await beats.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json({ beats: allBeats });
    }

    if (req.method === "POST") {
      const beat = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        published: req.body.published !== false,
        sold: req.body.sold === true,
      };

      const result = await beats.insertOne(beat);

      return res.status(201).json({
        success: true,
        beatId: result.insertedId,
      });
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Missing beat id" });
      }

      await beats.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        }
      );

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Missing beat id" });
      }

      await beats.deleteOne({ _id: new ObjectId(id) });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Beats API error:", error);
    return res.status(500).json({ error: error.message });
  }
};
