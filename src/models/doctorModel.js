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
        "Neurology Department",
        "Cardiology Department",
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

    availability: {
      days: {
        type: [String],
        default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
      timings: [
        {
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
        },
      ],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Doctor", doctorSchema);
