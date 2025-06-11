const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hackathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hackathon",
    required: true,
  },
  joinRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  idea: {
    type: String,
    required: false,
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  shortlisted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  joinCode: {
    type: String,
    unique: true,
    sparse: true,
  }
});

module.exports = mongoose.model("Team", teamSchema);
