const Submission = require("../Models/Submission");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const Hackathon = require("../Models/Hackathon");
const User = require("../Models/User");

exports.uploadResume = async (req, res) => {
  try {
    const { teamId, hackathonId } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const supportedTypes = ["pdf"];
    const fileType = file.originalname.split('.').pop().toLowerCase();
    const mimeType = file.mimetype;

    if (!supportedTypes.includes(fileType) || mimeType !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF resume files are allowed.",
      });
    }

    const cloudinaryResponse = await uploadOnCloudinary(file.path);
    const resumeUrl = cloudinaryResponse.secure_url;

    // Update or create submission entry
    let submission = await Submission.findOne({ team: teamId, hackathon: hackathonId });

    if (!submission) {
      submission = await Submission.create({
        team: teamId,
        hackathon: hackathonId,
        resumes: [{ user: userId, resumeUrl }],
      });
    } else {
      const existing = submission.resumes.find(r => r.user.toString() === userId.toString());
      if (existing) {
        existing.resumeUrl = resumeUrl;
      } else {
        submission.resumes.push({ user: userId, resumeUrl });
      }
      await submission.save();
    }

    res.status(200).json({
      success: true,
      resumeUrl,
      message: "Resume uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Resume Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the resume.",
    });
  }
};

exports.getTeamSubmissions = async (req, res) => {
  try {
    const { teamId, hackathonId } = req.body;

    if (!teamId || !hackathonId) {
      return res.status(400).json({
        success: false,
        message: "teamId and hackathonId are required",
      });
    }

    const submission = await Submission.findOne({
      team: teamId,
      hackathon: hackathonId,
    })
      .populate("team", "name members")
      .populate("hackathon", "name")
      .populate("resumes.user", "name email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found for the provided team and hackathon",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission fetched successfully",
      submission,
    });
  } catch (error) {
    console.error("❌ Error in getTeamSubmission:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};