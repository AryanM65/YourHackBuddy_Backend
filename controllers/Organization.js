const Organization = require("../Models/Organization");
const Hackathon = require("../Models/Hackathon");

exports.addOrganization = async (req, res) => {
  try {
    const { name, email, description } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const existing = await Organization.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Organization already exists" });
    }

    const organization = new Organization({ name, email, description });
    await organization.save();

    res.status(201).json({
      success: true,
      message: "Organization created",
      organization,
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllHackathons = async (req, res) => {
    try {
      const hackathons = await Hackathon.find()
        .populate({
          path: "organizer",
          select: "name email",
          model: function (doc) {
            return doc.organizerModel; // Dynamically populate based on model
          }
        })
        .populate("teams");
  
      res.status(200).json({
        success: true,
        count: hackathons.length,
        data: hackathons
      });
    } catch (error) {
      console.error("Error fetching hackathons:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  exports.getHackathonsByOrganization = async (req, res) => {
    try {
      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "Organization ID is required",
        });
      }

      const hackathons = await Hackathon.find({
        organizer: organizationId,
      }).populate("teams").populate("feedbacks");

      res.status(200).json({
        success: true,
        count: hackathons.length,
        data: hackathons,
      });
    } catch (error) {
      console.error("Error fetching organization hackathons:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
