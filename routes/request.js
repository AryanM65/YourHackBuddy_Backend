const express = require("express");
const router = express.Router();
const {auth} = require("../middlewares/auth");

const {
  sendFriendRequest,
  getFriendRequests,
  respondToFriendRequest,
  sendTeamJoinRequest,
  handleTeamJoinRequest,
  sendTeamRequestToUser,
  respondToTeamRequest,
  getTeamRequests
} = require("../controllers/Request");

// Route handlers must be functions!
router.post("/friend/send", auth, sendFriendRequest);
router.get("/friend", auth, getFriendRequests);
router.post("/friend/respond", auth, respondToFriendRequest);

// Team join requests
router.post("/team-join-request/send", auth, sendTeamJoinRequest);
router.post("/team-join-request/respond", auth, handleTeamJoinRequest);

// Team sends a join request to user
router.post('/team-request/:userId', auth, sendTeamRequestToUser);
// User accepts/rejects request
router.post('/respond/:requestId', auth, respondToTeamRequest);

router.get("/team/:teamId/view-requests", auth, getTeamRequests);

module.exports = router;
