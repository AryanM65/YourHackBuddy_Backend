const express = require("express");
const router = express.Router();
const {addAnnouncement, getannoucement} = require('../controllers/Announcement')
const {auth, isAdmin} = require('../middlewares/auth');

// Example: Only admin can post announcements (add auth middleware accordingly)
router.post("/add-announcement", auth, isAdmin, addAnnouncement);
router.get("/get-announcements", auth, getannoucement);

module.exports = router;
