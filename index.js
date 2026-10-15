require("dotenv").config();
const connectDB = require("./connection");

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const userRouter = require("./src/routers/userRouter");
const adminRouter = require("./src/routers/adminRouter");
const forgotPassRouter = require("./src/routers/forgotPassRouter");
const appointmentRouter = require("./src/routers/appointmentRouter");
const carrerRouter = require("./src/routers/carrerRouter");
const reviewRouter = require("./src/routers/reviewRouter");
const doctorRoutes = require("./src/routers/doctorRouter");
const paymentRoutes = require("./src/routers/paymentRoutes");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/otp", forgotPassRouter);
app.use("/api/appointment", appointmentRouter);
app.use("/api/carrer", carrerRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin/doctors", doctorRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Server is Running...");
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
