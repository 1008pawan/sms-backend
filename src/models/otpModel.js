// models/otpModel.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phone: {
    type: Number,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("OTP", otpSchema);
