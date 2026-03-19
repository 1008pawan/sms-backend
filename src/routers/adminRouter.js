const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuthMiddleware");
const {
  adminSignup,
  adminLogin,
  getAllUsers,
  updateAdminProfile,
  getAdminProfile,
} = require("../controllers/adminController");
const doctorRoutes = require("../routers/doctorRouter");

// router.post("/signup", adminSignup);
router.post("/login", adminLogin);
router.get("/users", adminAuth, getAllUsers);
router.put("/profile", adminAuth, updateAdminProfile);
router.get("/me", adminAuth, getAdminProfile);

router.use("/", doctorRoutes);

module.exports = router;
