const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["user-to-team", "team-to-user", "user-to-user"], // Add 'user-to-user' for friend requests
    required: true,
  },

  from: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "fromModel",
    required: true,
  },
  fromModel: {
    type: String,
    enum: ["User", "Team"],
    required: true,
  },

  to: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "toModel",
    required: true,
  },
  toModel: {
    type: String,
    enum: ["User", "Team"],
    required: true,
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    // This is now optional, because it's only required for team-related requests
  },

  message: String,

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Request", requestSchema);
