// models/doctorModel.js
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    specialty: { type: String },
    specialization: { type: String },
    experience: { type: String },
    phone: { type: String },
    photo: { type: String },
    description: { type: String },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    consultationFee: {
      type: Number,
      required: true,
      default: 500,
      min: 0,
    },

    availableSlots: [
      {
        date: { type: Date, required: true },
        slots: {
          type: [String],
          enum: ["10:00 AM", "12:30 PM", "04:00 PM", "06:30 PM"],
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Doctor", doctorSchema);
