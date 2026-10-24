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
      consultationFee,
      availability,
    } = req.body;

    let photoPath = "";
    if (req.file) photoPath = req.file.path.replace(/\\/g, "/");

    let parsedAvailability = {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      timings: [{ startTime: "10:00 AM", endTime: "05:00 PM" }],
    };
    if (availability) {
      try {
        parsedAvailability = JSON.parse(availability);
      } catch (e) {
        console.error("Availability parse error", e);
      }
    }

    const doctor = await Doctor.create({
      name,
      department,
      specialty,
      specialization,
      experience,
      phone,
      description,
      consultationFee: Number(consultationFee) || 500,
      photo: photoPath,
      availability: parsedAvailability,
    });

    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL DOCTORS ================= */
exports.getAllDoctors = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = department ? { department: department } : {};
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
};

/* ================= UPDATE DOCTOR ================= */
exports.updateDoctor = async (req, res) => {
  try {
    const {
      name,
      department,
      specialty,
      specialization,
      experience,
      phone,
      description,
      consultationFee,
      availability,
      isAvailable,
    } = req.body;

    const updateData = {
      name,
      department,
      specialty,
      specialization,
      experience,
      phone,
      description,
      consultationFee: Number(consultationFee) || 500,
    };

    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable === "true" || isAvailable === true;
    }

    if (availability) {
      try {
        updateData.availability = JSON.parse(availability);
      } catch (e) {}
    }

    if (req.file) updateData.photo = req.file.path.replace(/\\/g, "/");

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    res
      .status(200)
      .json({ success: true, data: doctor, message: "Doctor updated" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Update failed" });
  }
};

/* ================= TOGGLE STATUS (Naya Function) ================= */
exports.toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });

    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();

    res
      .status(200)
      .json({
        success: true,
        data: doctor,
        message: `Doctor is now ${doctor.isAvailable ? "Active" : "Inactive"}`,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
