require("dotenv").config();
require("./connection");

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

// Routers import
const userRouter = require("./src/routers/userRouter");
const adminRouter = require("./src/routers/adminRouter");
const forgotPassRouter = require("./src/routers/forgotPassRouter");
const appointmentRouter = require("./src/routers/appointmentRouter");
const carrerRouter = require("./src/routers/carrerRouter");
const reviewRouter = require("./src/routers/reviewRouter");
const doctorRoutes = require("./src/routers/doctorRouter");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/otp", forgotPassRouter);
app.use("/appointment", appointmentRouter);
app.use("/carrer", carrerRouter);
app.use("/review", reviewRouter);
app.use("/admin/doctors", doctorRoutes);

app.get("/", (req, res) => {
  res.send("Server is Running...");
});

app.listen(PORT, () => {
  console.log(`Server is running on port - ${PORT}`);
});