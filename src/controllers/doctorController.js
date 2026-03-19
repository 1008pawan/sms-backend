const Doctor = require("../models/doctorModel");

/* ================= CREATE DOCTOR ================= */

exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      department,
      specialty,
      specialization,
      experience,
      phone,
      description,
    } = req.body;

    let photoPath = "";
    if (req.file) {
      photoPath = req.file.path.replace(/\\/g, "/");
    }

    const doctor = await Doctor.create({
      name,
      department,
      specialty,
      specialization,
      experience,
      phone,
      description,
      photo: photoPath,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL DOCTORS (With Filter) ================= */
exports.getAllDoctors = async (req, res) => {
  try {
    const { department } = req.query;

    const filter = department ? { department: department } : {};

    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
};

/* ================= UPDATE DOCTOR ================= */
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};
