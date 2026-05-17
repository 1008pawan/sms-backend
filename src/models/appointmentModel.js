// models/appointmentModel.js
const mongoose = require("mongoose");

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
      enum: [
        "Neonatology & Pediatric Department",
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
      ],
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    slot: {
      type: String,
      enum: ["10:00 AM", "12:30 PM", "04:00 PM", "06:30 PM"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "approved", "rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

appointmentSchema.index(
  { appointmentDate: 1, slot: 1, doctorId: 1 },
  { unique: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
