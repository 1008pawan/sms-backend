const Career = require("../models/carrerModel");
const fs = require("fs");
const path = require("path");

exports.createApplication = async (req, res) => {
  try {
    const errors = {};

    const { fullName, email, phoneNumber, applicationType, specialization } =
      req.body;

    if (!fullName || fullName.trim().length < 3) {
      errors.fullName = "Full name is required";
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Invalid email address";
    }

    if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
      errors.phoneNumber = "Invalid Indian phone number";
    }

    if (!specialization) {
      errors.specialization = "Specialization is required";
    }

    if (!req.file) {
      errors.resumeUrl = "Resume file is required (PDF)";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingApp = await Career.findOne({ email });
    if (existingApp) {
      return res.status(400).json({
        errors: { email: "You already applied with this email" },
      });
    }

    const newApplication = await Career.create({
      fullName,
      email,
      phoneNumber,
      applicationType,
      specialization,
      resumeUrl: req.file.path.replace(/\\/g, "/"),
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: newApplication,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Career.find().sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Career.findById(id);

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    const filePath = path.join(__dirname, "..", application.resumeUrl);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Career.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Application and file deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
