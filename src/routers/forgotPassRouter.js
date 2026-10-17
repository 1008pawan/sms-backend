require("dotenv").config();
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  requestOTP,
  verifyOTP,
  resetPass,
} = require("../controllers/otpController");

// OTP Rate Limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later.",
  },
});

// OTP Routes
router.post("/request-otp", otpLimiter, requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPass);

module.exports = router;
