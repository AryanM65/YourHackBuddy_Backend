const express = require("express");
const router = express.Router();
const {submitFeedback, getFeedbacksForHackathon} = require('../controllers/Feedback');
const { auth } = require("../middlewares/auth");

// POST: Submit feedback for a hackathon
router.post("/hackathons/:hackathonId/feedback", auth, submitFeedback);

// GET: Get all feedback for a hackathon
router.get("/hackathons/:hackathonId/feedback", getFeedbacksForHackathon);

module.exports = router;
