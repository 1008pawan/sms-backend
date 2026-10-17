const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const OTP = require("../models/otpModel"); // 👈 Model update karna hoga
const sendMail = require("../utils/sendMail");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND OTP (EMAIL) ================= */
exports.requestOTP = async (req, res) => {
  let { email } = req.body;

  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }

    email = email.trim().toLowerCase();

    // ✅ RATE LIMIT PER EMAIL (1 min)
    const recentOtp = await OTP.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait 1 minute before requesting another OTP",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not registered" });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.create({
      email,
      code: hashedOtp,
      expiresAt,
    });

    // SMTP EMAIL
    await sendMail(
      email,
      "Your OTP for Password Reset",
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset</h2>
        <p>Your OTP is <b style="font-size: 24px; color: blue;">${otp}</b></p>
        <p>It is valid for 5 minutes. Do not share it with anyone.</p>
      </div>`,
    );

    try {
      await sendMail(email, "Your OTP", `<p>OTP: ${otp}</p>`);
    } catch (mailError) {
      console.error("MAIL ERROR:", mailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Check SMTP credentials.",
      });
    }

    res.json({ success: true, message: "OTP sent successfully to your email" });
  } catch (error) {
    console.error("OTP ERROR", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOTP = async (req, res) => {
  let { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email & OTP required" });
    }

    email = email.trim().toLowerCase();

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.code);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("VERIFY OTP ERROR", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPass = async (req, res) => {
  let { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    email = email.trim().toLowerCase();

    // Password validation
    if (
      newPassword.length < 8 ||
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[\W_]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ chars with uppercase, lowercase, number and special character",
      });
    }

    const otpRecord = await OTP.findOne({ email, verified: true });
    if (!otpRecord) {
      return res
        .status(403)
        .json({ success: false, message: "OTP not verified" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Model me pre-save hook hash kar raha hai, toh plain password save karo
    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("RESET ERROR", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
