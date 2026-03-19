const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");

/* ================= CREATE APPOINTMENT ================= */

exports.createAppointment = async (req, res) => {
  try {
    const { patientName, phone, department, appointmentDate, slot, doctorId } =
      req.body;

    const userId = req.user.id;

    /* ---------- Validation ---------- */
    if (
      !patientName ||
      !phone ||
      !department ||
      !appointmentDate ||
      !slot ||
      !doctorId
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields including doctor are required",
      });
    }

    /* ---------- Check Doctor ---------- */
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not available",
      });
    }

    /* ---------- Date Validation ---------- */
    const selectedDate = new Date(appointmentDate);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past date appointment is not allowed",
      });
    }

    /* ---------- Check Slot Availability ---------- */
    const existingAppointment = await Appointment.findOne({
      appointmentDate: selectedDate,
      slot,
      doctorId,
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    /* ---------- Create Appointment ---------- */
    const appointment = await Appointment.create({
      userId,
      patientName,
      phone,
      department,
      appointmentDate: selectedDate,
      slot,
      doctorId,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR 👉", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= GET APPOINTMENTS BY USER ID ================= */
exports.getAppointmentsByUser = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      userId: req.user._id,
    }).populate("doctorId", "_id name department");

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error("GET USER APPOINTMENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= GET ALL APPOINTMENTS ================= */
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("doctorId", "name department")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
};

/* ================= UPDATE APPOINTMENT STATUS ================= */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= DELETE APPOINTMENT ================= */
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // 1. Appointment dhundo aur delete karo
    const appointment = await Appointment.findByIdAndDelete(appointmentId);

    // 2. Agar appointment nahi mila
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // 3. Success response
    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE APPOINTMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting appointment",
    });
  }
};
