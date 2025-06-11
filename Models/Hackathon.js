const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["Online", "Offline", "Hybrid"],
    required: true,
    default: "Online",
  },
  tags: {
    type: [String],
    default: [],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "organizerModel",
  },
  organizerModel: {
    type: String,
    required: true,
    enum: ["User", "Organization"],
  },
  teams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
  maxTeamSize: {
    type: Number,
    required: true,
    min: [1, "Team must have at least 1 member"],
    max: [10, "Team size cannot exceed 10 members"],
  },
  minTeamSize: {
    type: Number,
    required: true,
    min: [1, "Minimum team size must be at least 1"],
    validate: {
      validator: function (value) {
        return value <= this.maxTeamSize;
      },
      message: "Minimum team size cannot be greater than maximum team size",
    },
  },
  feedbacks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
  ],
  timeline: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
  banner: {
    type: String,
    // required: true,
  },
  eligibility: {
    type: String,
    default: "Open to all",
  },
  rules: {
    type: [String],
    default: [],
  },
  policies: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Hackathon", hackathonSchema);
