const Review = require("../models/reviewModal");

/**
 * Create Review (Public)
 */
exports.createReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const errors = {};

    if (!name || name.trim().length < 2) {
      errors.name = "Name is required";
    }

    if (!rating || rating < 1 || rating > 5) {
      errors.rating = "Rating must be between 1 and 5";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        errors,
      });
    }

    const review = await Review.create({
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get All Reviews
 */
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete Review (Admin use)
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
