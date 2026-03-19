// models/doctorModel.js
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: {
      type: String,
      enum: ["Cardiology", "Neurology", "Orthopedics", "General Surgery"], 
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
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
