const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getAllUsers,
  addUser,
  loginUser,
  updateUser,
  deleteUser,
  changePassword,
  getProfile,
} = require("../controllers/userController");

router.post("/add", addUser);
router.post("/authenticate", loginUser);
router.get("/getall", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateUser);
router.delete("/delete/:id", authMiddleware, deleteUser);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;
