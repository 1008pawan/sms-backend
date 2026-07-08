require("dotenv").config();
require("./connection");

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

const app = express();
 
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/otp", forgotPassRouter);
app.use("/api/appointment", appointmentRouter);
app.use("/api/carrer", carrerRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin/doctors", doctorRoutes);

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