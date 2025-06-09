const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connect() {
  if (!client.isConnected()) await client.connect();
  return client.db("jajanan_ratings").collection("ratings");
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const ratingsCollection = await connect();
    const totalReviews = await ratingsCollection.countDocuments({});
    const ratingBreakdown = await ratingsCollection.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingBreakdown.forEach(item => {
      ratingCounts[item._id] = item.count;
    });

    res.status(200).json({ totalReviews, ratingCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil ringkasan penilaian.' });
  }
}
