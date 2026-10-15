// const mongoose = require("mongoose");
// require("dotenv").config();

// const url = process.env.DB_URL;

// if (!url) {
//   console.error("DB_URL .env mein nahi mila");
//   process.exit(1);
// }

// const connectDB = async (retries = 5) => {
//   try {
//     await mongoose.connect(url, {
//       serverSelectionTimeoutMS: 10000,
//       family: 4,
//     });
//     console.log("Connected to MongoDB");
//   } catch (err) {
//     console.error("Error connecting to MongoDB:", err.message);

//     if (retries > 0) {
//       console.log(`Retrying in 5s... (${retries} left)`);
//       setTimeout(() => connectDB(retries - 1), 5000);
//     } else {
//       console.error("MongoDB se connect nahi ho paya, server band ho raha hai");
//       process.exit(1);
//     }
//   }
// };

// mongoose.connection.on("disconnected", () => {
//   console.log("MongoDB disconnected");
// });
// mongoose.connection.on("reconnected", () => {
//   console.log("MongoDB reconnected");
// });

// connectDB();

// module.exports = mongoose;


const mongoose = require("mongoose");
require("dotenv").config();

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectDB() {
  const url = process.env.DB_URL;
  if (!url) throw new Error("DB_URL missing hai");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(url, { serverSelectionTimeoutMS: 10000, family: 4 })
      .then((m) => {
        console.log("Connected to MongoDB");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // agli request pe dubara try ho
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;