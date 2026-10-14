const express = require("express");
const router = express.Router();

const {
  createDoctor,
  getAllDoctors,
  updateDoctor,
} = require("../controllers/doctorController");
const Doctor = require("../models/doctorModel");
const upload = require('../middlewares/multer');
const adminAuth = require("../middlewares/adminAuthMiddleware");


router.get("/public/all", async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching doctors" });
  }
});


// 🔐 ADMIN ONLY ROUTES
router.get("/doctors", adminAuth, getAllDoctors);
router.post('/doctors', upload.single('photo'), createDoctor);
router.put("/doctors/:id", upload.single("photo"), adminAuth, updateDoctor);

// USER SIDE (NO ADMIN AUTH)
router.get("/", async (req, res) => {
  try {
    const { department } = req.query;
    console.log("DEPARTMENT 👉", department);

    const doctors = await Doctor.find({ department });

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("DOCTOR FETCH ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
    });
  }
});


module.exports = router;
