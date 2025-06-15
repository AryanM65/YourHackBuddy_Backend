// controllers/complaintController.js
const Complaint = require('../Models/Complaint');
const Notification = require('../Models/Notification');
const User = require('../Models/User');
const sendEmail = require('../utils/sendEmail');

exports.submitComplaint = async (req, res) => {
  try {
    const { againstType, message } = req.body;
    const userId = req.user.id;
    console.log(userId);
    const complaint = await Complaint.create({
      from: userId,
      againstType,
      // againstId: againstType !== 'System' ? againstId : undefined,
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
      .populate('from')
      // .populate('title');

    res.status(200).json({ complaints });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    console.log("adminResponse", adminResponse);
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Update the complaint status and response
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status: 'resolved', adminResponse },
      { new: true }
    ).populate('from');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Notify the user
    await Notification.create({
      user: complaint.from._id,
      message: `Your complaint "${complaint.message}" has been resolved.`,
      type: "complaint"
    });

    // Send email to the user
    await sendEmail(
      complaint.from.email,
      'Your Complaint Has Been Resolved',
      `Hi ${complaint.from.name || 'user'},\n\nYour complaint ${complaint.message} has been marked as resolved.\n\nAdmin Response: ${adminResponse || 'No additional information provided.'}\n\nThank you for your patience.`
    );

    res.status(200).json({ message: 'Complaint resolved, user notified via notification and email.', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve complaint.' });
  }
};
