const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  refundPayment,
} = require("../controllers/paymentController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create-order", authMiddleware, createRazorpayOrder);
router.post("/verify-payment", authMiddleware, verifyRazorpayPayment);
router.post("/refund", authMiddleware, refundPayment);

module.exports = router;