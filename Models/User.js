const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Student", "Admin", "Organization"],
    default: "Student",
  },

  skills: [String],

  bio: String,

  linkedin: String,

  github: String,

  hackathonsParticipated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
    },
  ],

  institute: {
    type: String,
    required: function () {
      return this.role !== "Admin" && this.role !=="Organization";
    },
  },

  profilePicture: {
    type: String,
    default: "",
  },

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  designation: {
    type: String,
    enum: ["Student", "Working Professional", "Freelancer", "Other", ""],
    required: function () {
      return this.role !== "Admin" && this.role !== "Organization";
    },
    default: "Other",
  },

  currentTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },

  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
  ],

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetOTP: String,
  otpExpiry: Date,

  // NEW: organization reference for Organizer users
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: function () {
      return this.role === "Organization";
    },
  },
}, {timestamps: true});

userSchema.statics.getProfile = async function (userId) {
  return this.findById(userId)
    .select("-password -resetPasswordToken -resetPasswordExpires -resetOTP -otpExpiry") // Exclude sensitive fields
    .populate({
      path: "hackathonsParticipated",
      select: "title date",
    })
    .populate({
      path: "currentTeam",
      select: "teamName members",
      populate: {
        path: "members",
        select: "name username profilePicture",
      },
    })
    .populate({
      path: "friends",
      select: "name username profilePicture",
    })
    .populate({
      path: "organization",
      select: "name website",
    });
};

module.exports = mongoose.model("User", userSchema);
