const Model = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// LOGIN USER (phone ya email se)
exports.loginUser = async (req, res) => {
  try {
    let identifier = (req.body.identifier || req.body.phone || "")
      .toString()
      .trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone/Email and password are required",
      });
    }

    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await Model.findOne(query).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Model.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ADD USER (FINAL FIX)
exports.addUser = async (req, res) => {
  try {
    let { fullName, phone, email, password, gender } = req.body;

    const errors = {};

    /* ================= FULL NAME ================= */
    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (!/^[A-Za-z ]+$/.test(fullName)) {
      errors.fullName = "Full name can contain only letters and spaces";
    }

    /* ================= PHONE ================= */
    if (!phone) {
      errors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits";
    }

    /* ================= EMAIL ================= */
    if (!email || email.trim().length === 0) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errors.email = "Enter a valid email address";
    }

    /* ================= PASSWORD ================= */
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Password must contain a lowercase letter";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain an uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain a number";
    } else if (!/[\W_]/.test(password)) {
      errors.password = "Password must contain a special character";
    }

    /* ================= GENDER ================= */
    if (!gender) {
      errors.gender = "Gender is required";
    } else if (!["male", "female", "other"].includes(gender)) {
      errors.gender = "Invalid gender value";
    }

    /* ================= RETURN ERRORS ================= */
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        errors,
      });
    }

    phone = phone.trim();
    email = email.trim().toLowerCase();

    /* ================= DUPLICATE CHECK ================= */
    const existingUser = await Model.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      const dupErrors = {};
      if (existingUser.phone === phone)
        dupErrors.phone = "Phone number already exists";
      if (existingUser.email === email)
        dupErrors.email = "Email already exists";

      return res.status(409).json({
        success: false,
        message: dupErrors.phone
          ? "Number already registered"
          : "Email already registered",
        errors: dupErrors,
      });
    }

    /* ================= CREATE USER ================= */
    const user = await Model.create({
      fullName: fullName.trim(),
      phone,
      email,
      password,
      gender,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
      },
    });
  } catch (err) {
    // unique index se race condition mein duplicate aaye toh
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `${field} already registered`,
        errors: { [field]: `${field} already exists` },
      });
    }
    console.error("REGISTER ERROR", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// get profile USER
exports.getProfile = async (req, res) => {
  try {
    const user = await Model.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { fullName, phone, email, gender } = req.body;

    const user = await Model.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (fullName) user.fullName = fullName.trim();
    if (gender) user.gender = gender;

    if (phone) {
      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res
          .status(400)
          .json({ success: false, message: "Phone must be 10 digits" });
      }
      const taken = await Model.findOne({
        phone: phone.trim(),
        _id: { $ne: user._id },
      });
      if (taken) {
        return res
          .status(409)
          .json({ success: false, message: "Phone already in use" });
      }
      user.phone = phone.trim();
    }

    if (email) {
      const e = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(e)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email" });
      }
      const taken = await Model.findOne({ email: e, _id: { $ne: user._id } });
      if (taken) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      user.email = e;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json(err);
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 👈 .select("+password") ZAROORI hai
    const user = await Model.findById(req.user.id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current",
      });
    }

    user.password = newPassword; // pre-save hook hash karega
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

