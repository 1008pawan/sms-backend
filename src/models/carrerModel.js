const mongoose = require("mongoose");

const CareerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
  },
  applicationType: {
    type: String,
    enum: ["Full-time Job", "Internship"],
    default: "Full-time Job",
  },
  specialization: {
    type: String,
    required: true,
    enum: ["General Medicine", "Surgery", "Nursing", "Administration"],
  },
  resumeUrl: {
    type: String,
    required: [true, "Resume is required"],
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Career", CareerSchema);
