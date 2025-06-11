const express = require("express");
const router = express.Router();
const { registerTeamForHackathon, getTeamById, getTeamsForHackathon, createTeam, generateJoinCode, joinTeamByCode, getTeamsFromYourInstitute, getUserTeams, shortlistTeam, getUserTeamForHackathon, suspendTeam} = require("../controllers/Team");
// const { createTeam } = require("../controllers/Team");
const { auth, isOrganization, isAdmin } = require("../middlewares/auth");



router.post("/create-team", auth, createTeam);
//only leader can register the team for hackathon
router.post("/register-team", registerTeamForHackathon);
router.get("/team/:teamId", getTeamById);
router.get("/hackathon/:hackathonId/teams", getTeamsForHackathon);
router.post('/:teamId/generate-join-code', auth, generateJoinCode);
router.get("/from-institute", auth, getTeamsFromYourInstitute);
router.post('/join-by-code', auth, joinTeamByCode);
router.post('/get-user-teams', auth, getUserTeams);
router.post('/your-team', auth, getUserTeamForHackathon);
router.post('/shortlist', auth, isOrganization, shortlistTeam);
router.put("/suspend", auth, isAdmin, suspendTeam);

module.exports = router;