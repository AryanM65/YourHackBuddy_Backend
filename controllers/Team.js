const Hackathon = require("../Models/Hackathon");
const Team = require("../Models/Team");
const User = require("../Models/User")
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');

exports.createTeam = async (req, res) => {
    try {
      console.log(req.body);
      const { name, hackathonId, idea } = req.body;
      const leaderId = req.user.id;
  
      if (!leaderId) {
        return res.status(400).json({ success: false, message: "Leader ID missing" });
      }
  
      const leader = await User.findById(leaderId);
      if (!leader) {
        return res.status(404).json({ success: false, message: "Leader not found" });
      }
  
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) {
        return res.status(404).json({ success: false, message: "Hackathon not found" });
      }
  
      // Check if leader has already created a team for this hackathon
      const existingTeam = await Team.findOne({ teamLeader: leaderId, hackathon: hackathonId });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: "You already created a team for this hackathon.",
        });
      }
  
      const newTeam = new Team({
        name,
        teamLeader: leaderId,
        members: [leaderId], // Only the leader is a member initially
        hackathon: hackathonId,
        idea,
      });
  
      await newTeam.save();
  
      return res.status(201).json({
        success: true,
        message: "Team created successfully. Add more members before registering.",
        team: newTeam,
      });
    } catch (err) {
      console.error("Error creating team:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };

  exports.registerTeamForHackathon = async (req, res) => {
    try {
      const { teamId, hackathonId } = req.body;
  
      const team = await Team.findById(teamId);
      const hackathon = await Hackathon.findById(hackathonId);
  
      if (!team || !hackathon) {
        return res.status(404).json({ success: false, message: "Team or Hackathon not found" });
      }
  
      // Check if team already registered
      if (hackathon.teams.includes(team._id)) {
        return res.status(400).json({
          success: false,
          message: "Team is already registered for this hackathon",
        });
      }
  
      // Check registration deadline
      if (new Date() > new Date(hackathon.registrationDeadline)) {
        return res.status(400).json({
          success: false,
          message: "Registration deadline has passed",
        });
      }
  
      // Check minimum team size
      if (team.members.length < hackathon.minTeamSize) {
        return res.status(400).json({
          success: false,
          message: `Team must have at least ${hackathon.minTeamSize} members to register`,
        });
      }
  
      // No "idea" field check here since it's not part of your Hackathon model
  
      // Register the team
      team.isRegistered = true
      await team.save();
      hackathon.teams.push(team._id);
      hackathon.isRegistered = true;
      await hackathon.save();
  
      // Add hackathonId to each team member's hackathonsParticipated array (avoiding duplicates)
      await Promise.all(
        team.members.map(async (memberId) => {
          await User.findByIdAndUpdate(memberId, {
            $addToSet: { hackathonsParticipated: hackathon._id }
          });
        })
      );

      const members = await User.find({ _id: { $in: team.members } });

      // Send email to each team member
      await Promise.all(
        members.map(member => {
          const subject = `Hackathon Registration Successful: ${hackathon.title}`;
          const text = `Hi ${member.name || 'Participant'},\n\nYour team "${team.name || 'Unnamed Team'}" has been successfully registered for the hackathon "${hackathon.title}".\n\nGood luck!\n\nRegards,\nHackathon Team`;
          return sendEmail(member.email, subject, text);
        })
      );
  
      res.status(200).json({ success: true, message: "Team registered successfully!" });
    } catch (err) {
      console.error("Error registering team:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  exports.getTeamById = async (req, res) => {
    try {
      const { teamId: id } = req.params;
      console.log("Fetching team with ID:", id);
  
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid team ID format" });
      }
  
      const team = await Team.findById(id)
        .populate("members", "name email")
        .populate("teamLeader", "name email");
  
      if (!team) {
        return res.status(404).json({ success: false, message: "Team not found" });
      }
  
      res.status(200).json({
        success: true,
        team,
      });
    } catch (err) {
      console.error("Error fetching team:", err);
      res.status(500).json({ success: false, message: "Error fetching team" });
    }
  };

  // Helper function to generate a 6-character uppercase code
const generateCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

exports.generateJoinCode = async (req, res) => {
  try {
    console.log("reached here")
    const { teamId } = req.params;
    console.log(req.user.id);
    const userId = req.user.id;
    console.log(teamId, userId);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only leader can generate join code
    if (team.teamLeader.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the team leader can generate the join code' });
    }

    // Generate a unique join code
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      const existingTeam = await Team.findOne({ joinCode: code });
      if (!existingTeam) exists = false;
    }

    team.joinCode = code;
    await team.save();

    res.json({ message: 'Join code generated', joinCode: code });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


  exports.joinTeamByCode = async (req, res) => {
    try {
      const { joinCode } = req.body;
      const userId = req.user.id;

      const team = await Team.findOne({ joinCode }).populate('hackathon');

      if (!team) {
        return res.status(404).json({ error: 'Invalid join code' });
      }

      const hackathon = team.hackathon;

      // Already a member
      if (team.members.includes(userId)) {
        return res.status(400).json({ error: 'You are already a team member' });
      }

      // Check if team is full
      if (team.members.length >= hackathon.maxTeamSize) {
        return res.status(400).json({ error: `Team is full. Max team size is ${hackathon.maxTeamSize}` });
      }

      // Add user to team
      team.members.push(userId);
      await team.save();

      res.json({ message: 'Successfully joined the team', team });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.getTeamsForHackathon = async (req, res) => {
    try {
      const { hackathonId } = req.params;
      console.log("hackathonId", hackathonId);
      // Fetch teams associated with the hackathonId
      const teams = await Team.find({ hackathon: hackathonId })
        .populate("teamLeader", "name username email institute") // Populate team leader details
        .populate("members", "name username email institute") // Populate team members details
        .select("name teamLeader members isRegistered joinCode shortlisted") // Select fields to return
  
      // Return response with fetched teams
      return res.status(200).json({
        status: true,
        message: "Teams fetched successfully",
        teams,
      });
    } catch (error) {
      console.error("Error fetching teams:", error);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch teams. Please try again later.",
      });
    }
  };

  exports.getTeamsFromYourInstitute = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ error: "User not found." });
  
      const teams = await Team.find()
        .populate("leader")
        .populate("members")
        .where("leader")
        .ne(null);
  
      const filteredTeams = teams.filter(team => team.leader.institute === user.institute);
  
      res.status(200).json({ teams: filteredTeams });
    } catch (error) {
      res.status(500).json({ error: "Error fetching teams from your institute." });
    }
  };

  exports.getUserTeams = async (req, res) => {
  try {
    const {userId} = req.body;
    console.log("userId for teams", userId);
    const teams = await Team.find({ members: userId })
      .populate("members", "name email avatar")
      .populate("teamLeader", "name email")
      .populate("hackathon", "title startDate endDate");

    res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({ message: "Failed to fetch user teams" });
  }
};
  
exports.getUserTeamForHackathon = async (req, res) => {
  console.log("reached")
  console.log("req.user", req.user);
  const userId = req.user.id;
  console.log(userId);
  const { hackathonId } = req.body;
  console.log(hackathonId)
  if (!hackathonId) {
    return res.status(400).json({ message: "Hackathon ID is required" });
  }

  try {
    const team = await Team.findOne({
      hackathon: hackathonId,
      members: userId,
    }).populate("members", "name email")
      .populate("teamLeader", "name email");
    console.log(team);
    if (!team) {
      return res.status(404).json({ message: "You are not part of any team for this hackathon" });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error("Error fetching team for hackathon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.shortlistTeam = async (req, res) => {
  const { teamId } = req.body;

  try {
    // Fetch the complete user from DB
    const user = await User.findById(req.user.id).populate('organization');
    if (!user || !user.organization) {
      return res.status(403).json({ message: 'User or organization not found' });
    }
    console.log("user", user);
    const userOrgId = user.organization._id;

    // Fetch the team, hackathon, and team leader
    const team = await Team.findById(teamId)
      .populate('hackathon')
      .populate('teamLeader');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const hackathon = team.hackathon;

    // Check if requester is the organizer of the hackathon
    if (String(hackathon.organizer._id) !== String(userOrgId)) {
      return res.status(403).json({ message: 'Not authorized to shortlist this team' });
    }

    // Mark team as shortlisted
    team.shortlisted = true;
    await team.save();

    // Send email to the team leader
    const subject = `Your team has been shortlisted for ${hackathon.title}`;
    const text = `Congratulations! Your team "${team.name}" has been shortlisted for the hackathon "${hackathon.title}".`;

    await sendEmail(team.teamLeader.email, subject, text);

    res.status(200).json({ message: 'Team successfully shortlisted and email sent', team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendTeam = async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required in request body" });
    }

    const team = await Team.findById(teamId).populate("teamLeader", "email name");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.suspended = true;
    await team.save();

    // Send suspension email to the team leader
    if (team.teamLeader?.email) {
      const subject = `Team "${team.name}" Suspended`;
      const text = `Hello ${team.teamLeader.name || "Team Leader"},\n\nYour team "${team.name}" has been suspended due to a violation of the rules or other concerns.\n\nIf you believe this was a mistake, please contact the administrator.\n\nThank you.`;
      
      await sendEmail(team.teamLeader.email, subject, text);
    }

    res.status(200).json({ message: "Team suspended successfully", team });
  } catch (err) {
    console.error("Error suspending team:", err);
    res.status(500).json({ message: "Server error" });
  }
};