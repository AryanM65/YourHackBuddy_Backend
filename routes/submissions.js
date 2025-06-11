const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multer");
const { uploadResume, getTeamSubmissions } = require("../controllers/Submissions");
const { auth } = require("../middlewares/auth");


router.post(
  "/upload/resume",
  auth,
  upload.single("file"),
  uploadResume
);

router.post("/get-team-submissions", getTeamSubmissions);
module.exports = router;