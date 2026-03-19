const Appointment = require("../models/appointmentModel");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ================= ADMIN SIGNUP ================= */
exports.adminSignup = async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    const errors = {};

    /* ---------- Validation ---------- */
    if (!fullName) errors.fullName = "Full name is required";

    if (!phone) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      errors.phone = "Phone number must be 10 digits";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    /* ---------- Check Existing Admin ---------- */
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists with this phone number",
      });
    }

    /* ---------- Create Admin ---------- */
    const admin = await Admin.create({
      fullName,
      phone,
      password, // hashed via pre-save hook
    });

    /* ---------- Generate Token ---------- */
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin signup failed",
    });
  }
};

/* ================= ADMIN LOGIN ================= */
exports.adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account disabled",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🔑 JWT PAYLOAD (IMPORTANT)
    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin", // 🔥 FORCE ROLE
        type: "admin", // optional but clean
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        phone: admin.phone,
        role: "admin",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
};

/* ================= GET ALL USERS ================= */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/* ================= UPDATE ADMIN PROFILE ================= */
exports.updateAdminProfile = async (req, res) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized admin",
      });
    }

    const { fullName, newPassword } = req.body;

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (fullName) admin.fullName = fullName;

    if (newPassword && newPassword.length >= 6) {
      admin.password = newPassword; // 🔥 pre-save hash
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
    });
  } catch (error) {
    console.error("ADMIN UPDATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

/* ================= GET ADMIN PROFILE ================= */
exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id; // from adminAuth middleware

    const admin = await Admin.findById(adminId).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile",
    });
  }
};


