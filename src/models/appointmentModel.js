const mongoose = require("mongoose");

const DEPARTMENTS = [
  "Neonatology & Pediatrician Department",
  "General Medicine",
  "Orthopedic Department",
  "Surgery Department",
  "Gynecology Department",
  "Urology Department",
  "Psychiatric Department",
  "ENT Department",
  "Pathology Department",
  "Neurology",
  "Cardiology",
  "Dental Department",
  "General Surgery",
  "Pediatric Surgery",
  "Gastro Surgery",
];

const SLOTS = (() => {
  const slots = [];
  const startHour = 9; // 9:00 AM
  const endHour = 18; // 6:00 PM
  const interval = 10; // 10 minutes

  let totalMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (totalMinutes < endMinutes) {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const paddedMinutes = minutes.toString().padStart(2, "0");

    slots.push(`${hours12}:${paddedMinutes} ${period}`);
    totalMinutes += interval;
  }

  return slots;
})();

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"],
    },

    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    slot: {
      type: String,
      enum: SLOTS,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "approved", "rejected"],
      default: "Pending",
    },
    payment: {
      isPaid: { type: Boolean, default: false },
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      paidAt: { type: Date, default: null },

      // Naye refund fields
      isRefunded: { type: Boolean, default: false },
      refundId: { type: String, default: null },
      refundAmount: { type: Number, default: 0 },
      refundedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

appointmentSchema.index(
  { appointmentDate: 1, slot: 1, doctorId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
