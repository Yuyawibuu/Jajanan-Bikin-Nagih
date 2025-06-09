// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// >>>>> GANTI CONNECTION STRING DENGAN YANG VALID <<<<<
const uri = "mongodb+srv://gzpedewe:gVQDwtDKBKWjvvnW@cluster0.9tzcust.mongodb.net/jajanan_ratings?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// Middleware
app.use(express.json());

// Konfigurasi CORS
const corsOptions = {
    origin: 'https://jajanan-bikin-nagih.vercel.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Tangani preflight request OPTIONS

// Koneksi ke MongoDB Atlas
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Terhubung ke MongoDB Atlas!");
    } catch (e) {
        console.error("Gagal terhubung ke MongoDB Atlas:", e);
        console.error("Penyebab error:", e.cause);
        process.exit(1);
    }
}

connectToMongo();

// Endpoint untuk menyimpan rating
app.post('/api/submit-rating', async (req, res) => {
    try {
        const { rating } = req.body;

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating tidak valid. Harus angka 1-5." });
        }

        const database = client.db("jajanan_ratings");
        const ratingsCollection = database.collection("ratings");

        const result = await ratingsCollection.insertOne({
            rating: rating,
            timestamp: new Date()
        });

        console.log(`Penilaian ${rating} berhasil disimpan dengan ID:`, result.insertedId);
        res.status(200).json({ message: "Penilaian berhasil disimpan!", id: result.insertedId });
    } catch (error) {
        console.error("Gagal menyimpan penilaian:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan penilaian." });
    }
});

// Endpoint untuk mendapatkan ringkasan rating
app.get('/api/get-rating-summary', async (req, res) => {
    try {
        const database = client.db("jajanan_ratings");
        const ratingsCollection = database.collection("ratings");

        const totalReviews = await ratingsCollection.countDocuments({});
        const ratingBreakdown = await ratingsCollection.aggregate([
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratingBreakdown.forEach(item => {
            ratingCounts[item._id] = item.count;
        });

        res.status(200).json({ totalReviews, ratingCounts });
    } catch (error) {
        console.error("Gagal mengambil ringkasan penilaian:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mengambil ringkasan penilaian." });
    }
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server backend berjalan di http://localhost:${port}`);
});
