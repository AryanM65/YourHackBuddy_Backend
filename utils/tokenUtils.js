// utils.js or utils/tokenUtils.js

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Always returns 6-digit string
  };
  
  // Generate secure reset token
  const generateToken = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  };
  
  module.exports = { generateOTP, generateToken };
  