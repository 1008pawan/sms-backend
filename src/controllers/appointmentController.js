const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");

/* ---------- Helper function ---------- */
const parseSlotToMinutes = (slotStr) => {
  const match = slotStr.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;

  let [, h, m, period] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);

  if (period.toUpperCase() === "PM" && h !== 12) h += 12;
  if (period.toUpperCase() === "AM" && h === 12) h = 0;

  return h * 60 + m;
};

/* ================= GET APPOINTMENTS BY USER ID ================= */
exports.getAppointmentsByUser = async (req, res) => {
  try {
    // 1. Query params se page & limit nikaalo
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.user._id };

    const [total, appointments, statusCounts] = await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.find(filter)
        .populate("doctorId", "_id name department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.aggregate([
        { $match: { userId: req.user._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { Pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach((s) => (stats[s._id] = s.count));

    res.status(200).json({
      success: true,
      data: appointments,
      stats: {
        total: total,
        pending: stats.Pending,
        approved: stats.approved,
        rejected: stats.rejected,
      },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET USER APPOINTMENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ================ Create Appointment ====================
exports.createAppointment = async (req, res) => {
  try {
    const { patientName, phone, department, appointmentDate, slot, doctorId } =
      req.body;

    const userId = req.user.id;

    /* ---------- 1. Basic Validation ---------- */
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

    /* ---------- 2. Check Doctor ---------- */
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

    /* ---------- 3. Date Validation (timezone-safe) ---------- */
    let selectedDate;
    if (typeof appointmentDate === "string" && appointmentDate.includes("-")) {
      const [y, m, d] = appointmentDate.split("-").map(Number);
      selectedDate = new Date(y, m - 1, d);
    } else {
      selectedDate = new Date(appointmentDate);
    }
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past date appointment is not allowed",
      });
    }

    /* ---------- 4. Same-day past-time check ---------- */
    const isToday = selectedDate.getTime() === today.getTime();

    if (isToday) {
      const slotMinutes = parseSlotToMinutes(slot);

      if (slotMinutes === null) {
        return res.status(400).json({
          success: false,
          message: "Invalid slot format",
        });
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (slotMinutes <= currentMinutes) {
        return res.status(400).json({
          success: false,
          message: "Ye slot nikal chuka hai, aage ka slot choose karo",
        });
      }
    }

    /* ---------- 5. Slot Availability Check ---------- */
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

    /* ---------- 6. Create Appointment ---------- */
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

    return res.status(201).json({
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

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
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
      { new: true },
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
