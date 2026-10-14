const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getAllUsers,
  addUser,
  loginUser,
  updateUser,
  deleteUser,
  changePassword,
  getProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/userController");

const rateLimit = require("express-rate-limit");
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

router.post("/add", addUser);
router.post("/authenticate", loginUser);
router.get("/getall", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateUser);
router.delete("/delete/:id", authMiddleware, deleteUser);
router.put("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
