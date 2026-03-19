const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const axios = require("axios");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND OTP ================= */
exports.requestOTP = async (req, res) => {
  let { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    phone = Number(phone);

    // ✅ RATE LIMIT PER PHONE (FIX)
    const recentOtp = await OTP.findOne({
      phone,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
      return res.status(429).json({
        message: "Please wait 1 minute before requesting another OTP",
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Phone not registered" });
    }

    await OTP.deleteMany({ phone });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.create({
      phone,
      code: hashedOtp,
      expiresAt,
    });

    // FAST2SMS
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "v3",
        sender_id: "TXTIND",
        message: `Your OTP is ${otp}. Valid for 5 minutes.`,
        language: "english",
        numbers: phone.toString(),
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP ERROR", error.response?.data || error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOTP = async (req, res) => {
  let { phone, otp } = req.body;

  try {
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone & OTP required" });
    }

    phone = Number(phone);

    const otpRecord = await OTP.findOne({ phone });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.code);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("VERIFY OTP ERROR", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPass = async (req, res) => {
  let { phone, newPassword } = req.body;

  try {
    if (!phone || !newPassword) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password min 6 characters" });
    }

    phone = Number(phone);

    const otpRecord = await OTP.findOne({ phone, verified: true });
    if (!otpRecord) {
      return res.status(403).json({ message: "OTP not verified" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await OTP.deleteMany({ phone });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("RESET ERROR", error);
    res.status(500).json({ message: "Server error" });
  }
};

