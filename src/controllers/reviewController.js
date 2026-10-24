const Review = require("../models/reviewModal");

/**
 * Create Review (Protected)
 */
exports.createReview = async (req, res) => {
  try {
    const { name, rating, comment, doctorId } = req.body;
    const errors = {};

    if (!name || name.trim().length < 2) {
      errors.name = "Name is required";
    }
    if (!rating || rating < 1 || rating > 5) {
      errors.rating = "Rating must be between 1 and 5";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    const review = await Review.create({
      userId: req.user._id, // ✅ token se user attach karo
      doctorId: doctorId || null,
      name,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get All Reviews
 */
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email")
      .populate("doctorId", "name department")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ Get User's Own Reviews + Stats (MISSING THA)
 */
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ userId })
      .populate("doctorId", "name department")
      .sort({ createdAt: -1 });

    // Stats calculate karo
    const total = reviews.length;
    const avg =
      total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    // ratingCounts: { 1: 2, 2: 1, 3: 0, 4: 5, 5: 7 }
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });

    res.json({
      success: true,
      data: reviews,
      stats: {
        total,
        average: Number(avg.toFixed(1)),
        ratingCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Review
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    await review.deleteOne();
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
