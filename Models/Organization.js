const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  website: String,
  email: String,
  type: {
    type: String, // No enum constraint here
  },
  logo: String, // Optional: for branding
});

module.exports = mongoose.model("Organization", organizationSchema);