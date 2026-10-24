const express = require("express");
const router = express.Router();

const {
  createDoctor,
  getAllDoctors,
  updateDoctor,
  toggleDoctorStatus,
} = require("../controllers/doctorController");

const Doctor = require("../models/doctorModel");
const upload = require("../middlewares/multer");
const adminAuth = require("../middlewares/adminAuthMiddleware");

router.get("/public/all", async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching doctors" });
  }
});

router.get("/doctors", adminAuth, getAllDoctors);
router.post("/doctors", upload.single("photo"), createDoctor);
router.put("/doctors/:id", upload.single("photo"), adminAuth, updateDoctor);

router.patch("/doctors/:id/toggle-status", adminAuth, toggleDoctorStatus);

router.get("/", async (req, res) => {
  try {
    const { department } = req.query;
    const doctors = await Doctor.find({ department });
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch doctors" });
  }
});

module.exports = router;
