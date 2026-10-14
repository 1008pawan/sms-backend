const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");

/* ============ 1. CREATE RAZORPAY ORDER ============ */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId required" });
    }

    const appointment =
      await Appointment.findById(appointmentId).populate("doctorId");

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (appointment.payment?.isPaid) {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    const consultationFee = appointment.doctorId?.consultationFee || 500;

    const amountInPaise = consultationFee * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: process.env.RAZORPAY_CURRENCY || "INR",
      receipt: `rcpt_${appointment._id}`,
      notes: {
        appointmentId: appointment._id.toString(),
        patientName: appointment.patientName,
        doctorName: appointment.doctorId?.name,
        consultationFee: consultationFee,
      },
    });

    appointment.payment.razorpayOrderId = order.id;
    appointment.payment.amount = amountInPaise;
    appointment.payment.currency = order.currency;
    await appointment.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      consultationFee,
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============ 2. VERIFY PAYMENT SIGNATURE ============ */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !appointmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    // Signature verify karo
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // DB update
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        "payment.isPaid": true,
        "payment.razorpayPaymentId": razorpay_payment_id,
        "payment.razorpaySignature": razorpay_signature,
        "payment.paidAt": new Date(),
      },
      { new: true },
    );

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("VERIFY RAZORPAY PAYMENT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ============ 3. REFUND PAYMENT ============ */
exports.refundPayment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res
        .status(400)
        .json({ success: false, message: "appointmentId required" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (!appointment.payment?.isPaid) {
      return res.status(400).json({
        success: false,
        message: "Payment not done for this appointment",
      });
    }

    if (appointment.payment?.isRefunded) {
      return res
        .status(400)
        .json({ success: false, message: "Already refunded" });
    }

    // Razorpay refund API call
    const refund = await razorpay.payments.refund(
      appointment.payment.razorpayPaymentId,
      {
        amount: appointment.payment.amount, // paise me
        notes: {
          reason: "Appointment rejected by admin",
          appointmentId: appointment._id.toString(),
        },
      },
    );

    // DB update
    appointment.payment.isRefunded = true;
    appointment.payment.refundId = refund.id;
    appointment.payment.refundedAt = new Date();
    appointment.payment.refundAmount = refund.amount;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      data: appointment,
      refund,
    });
  } catch (error) {
    console.error("REFUND ERROR:", error);
    res.status(500).json({
      success: false,
      message: error?.error?.description || error.message || "Refund failed",
    });
  }
};
