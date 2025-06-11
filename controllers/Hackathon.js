const Hackathon = require("../Models/Hackathon");
const User = require("../Models/User");
const Organization = require("../Models/Organization");
const Team= require('../Models/Team');


exports.getAllHackathons = async (req, res) => {
    try {
      const hackathons = await Hackathon.find()
        .populate({
          path: "organizer",
          select: "name email", // Fields from User or Organization
          // no need to specify `model` function if refPath is already in schema
        })
        // Optional, if you want team data
  
      res.status(200).json({ success: true, data: hackathons });
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      res.status(500).json({ success: false, message: "Failed to fetch hackathons" });
    }
  };
  
  

  exports.addHackathon = async (req, res) => {
    try {
      const { 
        title, 
        description, 
        startDate, 
        endDate, 
        registrationDeadline, 
        location, 
        mode, 
        tags, 
        organizer, 
        organizerModel, 
        maxTeamSize, 
        minTeamSize,
        timeline,
        banner,
        rules,
        policies
      } = req.body;
  
      // Validate required fields
      if (
        !title || !organizer || !organizerModel || 
        !maxTeamSize || !minTeamSize ||
        !startDate || !endDate || !registrationDeadline || 
        !location || !mode || !description || 
        !timeline || !Array.isArray(timeline) || timeline.length === 0
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Validate timeline items
      const isTimelineValid = timeline.every(item =>
        item.title && item.description && item.date
      );
      if (!isTimelineValid) {
        return res.status(400).json({ message: "Each timeline item must have title, description, and date" });
      }
  
      // Validate team size
      if (minTeamSize > maxTeamSize) {
        return res.status(400).json({ message: "Minimum team size cannot be greater than maximum team size" });
      }
  
      // Validate rules and policies if provided
      if (rules && !Array.isArray(rules)) {
        return res.status(400).json({ message: "Rules must be an array" });
      }
  
      if (policies && !Array.isArray(policies)) {
        return res.status(400).json({ message: "Policies must be an array" });
      }
  
      const newHackathon = new Hackathon({
        title,
        description,
        startDate,
        endDate,
        registrationDeadline,
        location,
        mode,
        tags,
        organizer,
        organizerModel,
        maxTeamSize,
        minTeamSize,
        timeline,
        banner: banner || null,
        rules: rules || [],
        policies: policies || [],
      });
  
      await newHackathon.save();
  
      res.status(201).json({ message: "Hackathon created successfully", hackathon: newHackathon });
    } catch (error) {
      console.error("Error creating hackathon:", error);
      res.status(500).json({ message: "Error creating hackathon" });
    }
  };
  
  
  

  exports.getHackathonById = async (req, res) => {
    try {
      const hackathon = await Hackathon.findById(req.params.id);
      if (!hackathon) {
        return res.status(404).json({ success: false, message: "Hackathon not found" });
      }
  
      const leader = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      };
  
      res.status(200).json({
        success: true,
        data: hackathon,
        leader,
      });
    } catch (error) {
      console.error("Error fetching hackathon:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  exports.getMyHackathons = async (req, res) => {
    try {
      console.log("reached");
      const userId = req.user.id; // User ID from auth middleware
      console.log("userId", userId);
      // Find all teams where user is a member
      const userTeams = await Team.find({ members: userId }).select("hackathon");

      // Extract hackathon IDs from those teams
      console.log(userTeams);
      const hackathonIds = userTeams.map(team => team.hackathon);
      console.log(hackathonIds);
      // Find hackathons corresponding to those IDs
      const hackathons = await Hackathon.find({ _id: { $in: hackathonIds } });

      res.status(200).json({ success: true, data: hackathons });
    } catch (error) {
      console.error("Error in getMyHackathons:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.getUnapprovedHackathons = async (req, res) => {
  try {
    const unapprovedHackathons = await Hackathon.find({ status: "Pending" })
      .populate("organizer")
      .populate("teams")
      .populate("feedbacks");

    res.status(200).json({
      success: true,
      count: unapprovedHackathons.length,
      data: unapprovedHackathons,
    });
  } catch (error) {
    console.error("Error fetching unapproved hackathons:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateHackathonStatus = async (req, res) => {
  try {
    //id = hackathonId
    console.log("reaching here");
    const {id, status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const hackathon = await Hackathon.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!hackathon) {
      return res.status(404).json({ success: false, message: "Hackathon not found" });
    }

    res.status(200).json({ success: true, message: `Hackathon ${status.toLowerCase()}`, data: hackathon });
  } catch (error) {
    console.error("Error updating hackathon status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
  


  