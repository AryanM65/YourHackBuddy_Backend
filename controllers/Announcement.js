const Announcement = require("../Models/Announcement");
const Notification = require("../Models/Notification");
const User = require("../Models/User");

exports.addAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body;

    if (!title || !message || !targetAudience) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newAnnouncement = new Announcement({
      title,
      message,
      targetAudience,
    });

    await newAnnouncement.save();

    // Determine recipients based on target audience
    let recipients = [];
    if (targetAudience === "All") {
      recipients = await User.find({}, "_id");
    } else if (targetAudience === "Users") {
      recipients = await User.find({ role: "Student" }, "_id");
    } else if (targetAudience === "Organizers") {
      recipients = await User.find({ role: "Organization" }, "_id");
    }

    // Create notifications
    const notifications = recipients.map((user) => ({
      user: user._id,
      message: `📢 ${title} - ${message}`,
      type: "general", // Announcement is a general type
      isRead: false,
      link: "", // Optional: could be a page showing all announcements
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: "Announcement created and notifications sent",
      announcement: newAnnouncement,
    });
  } catch (err) {
    console.error("Error adding announcement:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getannoucement = async (req, res) => {
  try {
    const userRole = req.user.role;

    let filter = {};

    if (userRole === "Admin") {
      filter = {}; // Admins can view all
    } else if (userRole === "Organization") {
      filter = {
        $or: [
          { targetAudience: "All" },
          { targetAudience: "Organizers" }
        ]
      };
    } else {
      // Student or other default roles
      filter = {
        $or: [
          { targetAudience: "All" },
          { targetAudience: "Users" }
        ]
      };
    }

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Error in getannoucement:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

