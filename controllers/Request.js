const Request = require("../Models/Request");
const User = require("../Models/User");
const Team = require("../Models/Team")
const Notification = require("../Models/Notification");

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
    try {
      console.log("reached");
      const fromUserId = req.user.id;
      const { toUserId, message } = req.body;
  
      // Prevent sending to self
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({ error: "You cannot send a friend request to yourself." });
      }
  
      // Check if a pending request already exists
      const existingRequest = await Request.findOne({
        type: "user-to-user",
        from: fromUserId,
        to: toUserId,
        status: "pending",
      });
  
      if (existingRequest) {
        return res.status(400).json({ error: "Friend request already sent." });
      }
  
      // Create new friend request
      const newRequest = await Request.create({
        type: "user-to-user",
        from: fromUserId,
        fromModel: "User",
        to: toUserId,
        toModel: "User",
        message,
      });
  
      // Add request to the recipient's "requests" array
      await User.findByIdAndUpdate(toUserId, {
        $addToSet: { requests: newRequest._id },
      });
  
      // Send notification to the receiver
      const fromUser = await User.findById(fromUserId);
      await Notification.create({
        user: toUserId,
        message: `You have a new friend request from ${fromUser.name}.`,
        type: "general",
        link: `/profile/${fromUserId}`,
      });
  
      res.status(201).json({ message: "Friend request sent successfully.", request: newRequest });
    } catch (error) {
      console.error("Error in sendFriendRequest:", error);
      res.status(500).json({ error: "Error sending friend request." });
    }
  };
  

// Get all friend requests (sent + received)
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const sent = await Request.find({
      type: "user-to-user",
      from: userId,
      fromModel: "User",
    }).populate("to", "name email");

    const received = await Request.find({
      type: "user-to-user",
      to: userId,
      toModel: "User",
    }).populate("from", "name email");

    res.json({ sent, received });
  } catch (error) {
    res.status(500).json({ error: "Error fetching friend requests." });
  }
};

// Accept or reject a friend request
exports.respondToFriendRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'accept' or 'reject'
    const userId = req.user.id;

    const request = await Request.findById(requestId);
    if (!request || request.type !== "user-to-user") {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to respond to this request." });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action." });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    await request.save();

    // On accept: add each other as friends
    if (action === "accept") {
      const fromUser = await User.findById(request.from);
      const toUser = await User.findById(request.to);

      // Avoid duplicates
      if (!fromUser.friends.includes(toUser._id)) {
        fromUser.friends.push(toUser._id);
        await fromUser.save();
      }

      if (!toUser.friends.includes(fromUser._id)) {
        toUser.friends.push(fromUser._id);
        await toUser.save();
      }

      // Send notification to sender
      await Notification.create({
        user: fromUser._id,
        message: `${toUser.name} accepted your friend request.`,
        type: "general",
        link: `/profile/${toUser._id}`,
      });
    }

    res.json({ message: `Friend request ${action}ed.` });
  } catch (error) {
    res.status(500).json({ error: "Error responding to friend request." });
  }
};

// Send team join request
exports.sendTeamJoinRequest = async (req, res) => {
    try {
      const fromUserId = req.user.id;
      const { teamId, message } = req.body;
  
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found." });
      }
  
      // Prevent sending request if user already in team
      if (team.members.includes(fromUserId)) {
        return res.status(400).json({ error: "You are already a member of this team." });
      }
  
      const existingRequest = await Request.findOne({
        type: "user-to-team",
        from: fromUserId,
        to: teamId,
        status: "pending",
      });
  
      if (existingRequest) {
        return res.status(400).json({ error: "Join request already sent to this team." });
      }
  
      const newRequest = await Request.create({
        type: "user-to-team",
        from: fromUserId,
        fromModel: "User",
        to: teamId,
        toModel: "Team",
        message,
        status: "pending",
      });
  
      // Add request reference to user and team leader
      await User.findByIdAndUpdate(fromUserId, { $push: { requests: newRequest._id } });
  
      const teamLeaderId = team.teamLeader.toString();
      await User.findByIdAndUpdate(teamLeaderId, { $push: { requests: newRequest._id } });
  
      // Notify team leader
      const fromUser = await User.findById(fromUserId);
      await Notification.create({
        user: teamLeaderId,
        message: `${fromUser.name} has requested to join your team "${team.name}".`,
        type: "general",
        link: `/teams/${teamId}`,
      });
  
      res.status(201).json({ message: "Team join request sent successfully.", request: newRequest });
    } catch (error) {
      res.status(500).json({ error: "Error sending team join request." });
    }
  };
  
  // Handle team join request (accept/reject)
  exports.handleTeamJoinRequest = async (req, res) => {
    try {
      const userId = req.user.id;
      const { requestId, action: decision } = req.body;
      console.log(req.body);
      console.log("decision", decision);
      if (!["accept", "reject"].includes(decision)) {
        return res.status(400).json({ error: "Decision must be 'accept' or 'reject'." });
      }
  
      const request = await Request.findById(requestId);
      if (!request || request.toModel !== "Team") {
        return res.status(404).json({ error: "Join request not found." });
      }
  
      const team = await Team.findById(request.to);
      if (!team) {
        return res.status(404).json({ error: "Team not found." });
      }
  
      // Only team leader can accept/reject
      if (team.teamLeader.toString() !== userId) {
        return res.status(403).json({ error: "Only team leader can respond to join requests." });
      }
  
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Join request already responded to." });
      }
  
      if (decision === "accept") {
        // Add user to team members if not already present
        if (!team.members.includes(request.from)) {
          team.members.push(request.from);
          await team.save();
  
          // Update user's currentTeam
          await User.findByIdAndUpdate(request.from, { currentTeam: team._id });
        }
        request.status = "accepted";
      } else {
        request.status = "rejected";
      }
      await request.save();
  
      // Remove request from user requests array of both parties
      await User.findByIdAndUpdate(userId, { $pull: { requests: request._id } });
      await User.findByIdAndUpdate(request.from, { $pull: { requests: request._id } });
  
      // Notify the user about the decision
      const teamLeader = await User.findById(userId);
      await Notification.create({
        user: request.from,
        message: `${teamLeader.name} has ${decision}ed your request to join team "${team.name}".`,
        type: "general",
        link: `/teams/${team._id}`,
      });
  
      res.json({ message: `Team join request ${decision}ed successfully.` });
    } catch (error) {
      res.status(500).json({ error: "Error handling team join request." });
    }
  };


  exports.sendTeamRequestToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { teamId, message } = req.body;
    const fromTeamId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (!team.teamLeader.equals(req.user._id))
      return res.status(403).json({ message: 'Only team leader can send requests' });

    const newRequest = await Request.create({
      type: 'team-to-user',
      from: team._id,
      fromModel: 'Team',
      to: userId,
      toModel: 'User',
      team: team._id,
      message,
    });

    // Add notification to user
    await Notification.create({
      user: userId,
      message: `You received a join request from team ${team.name}`,
      type: 'team-invite',
      link: `/teams/${team._id}`,
    });

    res.status(201).json({ message: 'Request sent to user', request: newRequest });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.respondToTeamRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" or "reject"

    const request = await Request.findById(requestId).populate('team');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'You are not authorized to respond to this request' });

    if (request.status !== 'pending')
      return res.status(400).json({ message: 'Request already handled' });

    if (action === 'accept') {
      request.status = 'accepted';

      const team = await Team.findById(request.team._id);
      if (!team.members.includes(req.user._id)) {
        team.members.push(req.user._id);
        await team.save();
      }

      // Notify team leader
      await Notification.create({
        user: team.teamLeader,
        message: `${req.user.name} has accepted your team invite.`,
        type: 'team-invite',
        link: `/teams/${team._id}`,
      });
    } else {
      request.status = 'rejected';
    }

    await request.save();

    res.status(200).json({ message: `Request ${action}ed successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTeamRequests = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id; // Assuming auth middleware sets req.user

    // Check if the user is the team leader
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (String(team.leader) !== String(userId)) {
      return res.status(403).json({ message: "Only the team leader can view requests" });
    }

    // Fetch all pending requests sent to this team
    const requests = await Request.find({
      to: teamId,
      toModel: "Team",
      status: "pending",
    })
      .populate("from")
      .populate("team")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
  