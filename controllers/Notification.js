const Notification = require('../Models/Notification');

exports.getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all notifications (read and unread)
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: "Error fetching notifications." });
  }
};

// Mark a single notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Error updating notification." });
  }
};

// (Optional) Mark all notifications as read


