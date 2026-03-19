const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer");
const {
  createApplication,
  getAllApplications,
  deleteApplication,
} = require("../controllers/carrerController");

router.post(
  "/add",
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          errors: { resumeUrl: err.message },
        });
      }
      next();
    });
  },
  createApplication
);

router.get("/getdata", getAllApplications);
router.delete("/:id", deleteApplication);

module.exports = router;
