const mongoose = require("mongoose");
require("dotenv").config();

const url = process.env.DB_URL;

if (!url) {
  console.error("DB_URL .env mein nahi mila");
  process.exit(1);
}

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);

    if (retries > 0) {
      console.log(`Retrying in 5s... (${retries} left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error("MongoDB se connect nahi ho paya, server band ho raha hai");
      process.exit(1);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

connectDB();

module.exports = mongoose;
