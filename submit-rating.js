const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;  // simpan connection string di Environment Variables Vercel
const client = new MongoClient(uri);

async function connect() {
  if (!client.isConnected()) await client.connect();
  return client.db("jajanan_ratings").collection("ratings");
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  try {
    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating tidak valid. Harus angka 1-5.' });
      return;
    }

    const ratingsCollection = await connect();
    const result = await ratingsCollection.insertOne({
      rating,
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Penilaian berhasil disimpan!', id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menyimpan penilaian.' });
  }
}
