const Model = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
    let { fullName, phone, password, gender } = req.body;

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

    /* ================= DUPLICATE CHECK ================= */
    const existingUser = await Model.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Number already registered",
        errors: { phone: "Phone number already exists" },
      });
    }

    /* ================= CREATE USER ================= */
    const user = await Model.create({
      fullName: fullName.trim(),
      phone,
      password,
      gender,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
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
        gender: user.gender,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    phone = phone.trim();

    const user = await Model.findOne({ phone });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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
    const { fullName, phone, gender, password } = req.body;

    const user = await Model.findById(req.user.id);

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;

    if (password) {
      user.password = password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        fullName: user.fullName,
        phone: user.phone,
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

// FORGOT PASSWORD
exports.forgotPass = async (req, res) => {
  Model.find({ phone: req.params.phone })
    .then((res) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
};
