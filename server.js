// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Port untuk server backend

// >>>>> PASTI KAN GANTI CONNECTION STRING DI BAWAH INI <<<<<
// Salin lengkap dari MongoDB Atlas Anda.
// Pastikan username dan password sudah benar.
const uri = "mongodb+srv://gzpedewe:gVQDwtDKBKWjvvnW@cluster0.9tzcust.mongodb.net/jajanan_ratings?retryWrites=true&w=majority&appName=Cluster0";
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

const client = new MongoClient(uri);

// Middleware
app.use(express.json()); // Untuk mem-parse JSON dari request body
// CORS configuration: Memungkinkan frontend di domain lain (misalnya http://localhost:5500 dari Live Server)
// untuk mengakses backend ini.
app.use(cors({
    origin: 'https://jajanan-bikin-nagih.vercel.app' // Ganti ini dengan URL frontend Anda saat deploy (misalnya: https://nama-aplikasi-anda.vercel.app)
}));

// Fungsi untuk koneksi ke MongoDB Atlas
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Terhubung ke MongoDB Atlas!");
    } catch (e) {
        console.error("Gagal terhubung ke MongoDB Atlas:", e);
        console.error("Penyebab error:", e.cause); // Menampilkan penyebab SSL error yang lebih spesifik
        process.exit(1); // Keluar dari aplikasi jika gagal koneksi
    }
}

// Panggil fungsi koneksi saat server dimulai
connectToMongo();

// Endpoint untuk menyimpan penilaian (POST request)
app.post('/api/submit-rating', async (req, res) => {
    try {
        const { rating } = req.body; // Ambil nilai rating dari request body

        // Validasi input rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating tidak valid. Harus angka 1-5." });
        }

        // Tentukan database dan koleksi
        // Nama database (misal: jajanan_ratings) harus sama dengan yang ada di connection string Anda
        const database = client.db("jajanan_ratings");
        const ratingsCollection = database.collection("ratings"); // Nama koleksi untuk menyimpan rating

        // Masukkan dokumen rating ke koleksi
        const result = await ratingsCollection.insertOne({
            rating: rating,
            timestamp: new Date() // Menyimpan waktu saat rating dikirim
        });

        console.log(`Penilaian ${rating} berhasil disimpan dengan ID:`, result.insertedId);
        res.status(200).json({ message: "Penilaian berhasil disimpan!", id: result.insertedId });
    } catch (error) {
        console.error("Gagal menyimpan penilaian:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan penilaian." });
    }
});

// Endpoint untuk mendapatkan ringkasan penilaian (GET request)
app.get('/api/get-rating-summary', async (req, res) => {
    try {
        const database = client.db("jajanan_ratings");
        const ratingsCollection = database.collection("ratings");

        // Hitung total dokumen (penilaian)
        const totalReviews = await ratingsCollection.countDocuments({});

        // Agregasi untuk menghitung jumlah rating per bintang
        const ratingBreakdown = await ratingsCollection.aggregate([
            {
                $group: {
                    _id: "$rating", // Kelompokkan berdasarkan nilai rating
                    count: { $sum: 1 } // Hitung jumlah setiap kelompok
                }
            },
            {
                $sort: { _id: 1 } // Urutkan berdasarkan nilai rating
            }
        ]).toArray();

        // Format hasil ke dalam objek ratingCounts {1: count, 2: count, ...}
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

// Mulai server Node.js
app.listen(port, () => {
    console.log(`Server backend berjalan di http://localhost:${port}`);
});
