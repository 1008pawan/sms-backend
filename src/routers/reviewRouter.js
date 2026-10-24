const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/protectMiddleware");

router.post("/", protect, reviewController.createReview);
router.get("/", reviewController.getAllReviews);
router.get("/my-reviews", protect, reviewController.getUserReviews);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;