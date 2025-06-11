const express = require("express");
const router = express.Router();
const { addOrganization, getHackathonsByOrganization } = require("../controllers/Organization");

// Changed route to /add-new-organization
router.post("/add-new-organization", addOrganization);
router.post("/get-organization-hackathons", getHackathonsByOrganization);


module.exports = router;