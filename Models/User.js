const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true, // usernames should be unique
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
    enum: ["Student", "Admin"],
    default: "Student", // default role is Student
  },
  //for forget password functionality 
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetOTP: String,
  otpExpiry: Date
});

module.exports = mongoose.model("User", userSchema);
