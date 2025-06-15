const express = require("express");
const router = express.Router();
const {getAllHackathons, addHackathon, getHackathonById, getMyHackathons, getUnapprovedHackathons, updateHackathonStatus} = require('../controllers/Hackathon')
const { auth, isAdmin, isStudent, isOrganization } = require("../middlewares/auth");
const { upload } = require("../middlewares/multer"); // adjust path
// Route to add/organize a hackathon

router.get("/allhackathons", getAllHackathons);
router.post("/addhackathon", auth, isOrganization, upload.single("banner"), addHackathon);
router.get("/hackathon/:id",auth, getHackathonById);
router.get("/my-hackathons", auth, getMyHackathons);
router.get("/unapproved-hackathons", auth, isAdmin, getUnapprovedHackathons);
router.post("/hackathon/status", auth, isAdmin, updateHackathonStatus);
module.exports = router;