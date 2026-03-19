const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/protectMiddleware");
const adminAuth = require("../middlewares/adminAuthMiddleware");

const {
  createAppointment,
  getAppointmentsByUser,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointmentController");

router.post("/create", protect, createAppointment);
router.get("/user", protect, getAppointmentsByUser);
router.get("/all", adminAuth, getAllAppointments);
router.patch("/:id/status", adminAuth, updateAppointmentStatus);
router.delete("/delete-appointment/:id", adminAuth, deleteAppointment);

module.exports = router;
