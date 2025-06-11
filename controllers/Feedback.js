const Feedback = require("../Models/Feedback");
const Hackathon = require("../Models/Hackathon");

// Submit feedback for a hackathon
exports.submitFeedback = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { rating, comments } = req.body;
    const userId = req.user.id;

    // Prevent duplicate feedback by the same user
    const alreadyExists = await Feedback.findOne({ hackathon: hackathonId, user: userId });
    if (alreadyExists) {
      return res.status(400).json({ error: "Feedback already submitted for this hackathon." });
    }

    const feedback = await Feedback.create({
      hackathon: hackathonId,
      user: userId,
      rating,
      comments,
    });

    // Add feedback reference to hackathon
    await Hackathon.findByIdAndUpdate(hackathonId, {
      $push: { feedbacks: feedback._id },
    });

    res.status(201).json({ message: "Feedback submitted successfully.", feedback });
  } catch (err) {
    res.status(500).json({ error: "Error submitting feedback." });
  }
};

// Get all feedback for a hackathon
exports.getFeedbacksForHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const feedbacks = await Feedback.find({ hackathon: hackathonId }).populate("user", "name email");
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving feedbacks." });
  }
};
