// controllers/complaintController.js
const Complaint = require('../Models/Complaint');
const Notification = require('../Models/Notification');
const User = require('../Models/User');

exports.submitComplaint = async (req, res) => {
  try {
    const { againstType, againstId, message } = req.body;
    const userId = req.user.id;
    console.log(userId);
    const complaint = await Complaint.create({
      from: userId,
      againstType,
      againstId: againstType !== 'System' ? againstId : undefined,
      message,
    });

    // Find all admins
    const admins = await User.find({ role: 'Admin' });

    // Send notifications to all admins
    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          user: admin._id,
          message: `New complaint from ${req.user.name || 'a user'}.`,
          type: 'complaint',
          link: `/admin/complaints/${complaint._id}`,
        })
      )
    );

    res.status(201).json({ message: 'Complaint submitted successfully.', complaint });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to submit complaint.' });
  }
};

exports.getAllComplaints = async (req, res) => {
  try {
    // Only allow access if the requester is an admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const complaints = await Complaint.find()
      .populate('from', 'name email')
      .populate('againstId', 'name title');

    res.status(200).json({ complaints });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
};
