const express = require("express");
const {
  getAllNotifications,
  markNotificationAsRead,
} = require("../controllers/Notification");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/get-all-notifications", auth, getAllNotifications);

router.put("/:id/read", auth, markNotificationAsRead);

module.exports = router;
