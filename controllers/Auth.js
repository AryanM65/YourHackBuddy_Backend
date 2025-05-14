const User = require('../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const {generateOTP, generateToken} = require('../utils/tokenUtils');

require('dotenv').config();


exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role} = req.body;

    // Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "All fields are required (name, username, email, password, institute)",
      });
    }

    // Check for existing user by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Error while hashing password",
      });
    }

    // Create new user with all fields
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    return res.status(200).json({
      status: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to create user. Please try again later.",
    });
  }
};




exports.login = async (req, res) => {

    try {
      const { email, password } = req.body;
      let user = await User.findOne({ email });
      
      if (!user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
  
      if (await bcrypt.compare(password, user.password)) {
        const payload = {
          id: user._id,
          name: user.name, // 👈 Add this line
          email: user.email,
          role: user.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });
  
        res.cookie("token", token, {
          httpOnly: true, // JS can't access
          secure: false, // set to false for localhost, true for HTTPS in prod
          sameSite: "lax", // allows cross-origin POST from your frontend (in most cases)
          maxAge: 24 * 60 * 60 * 1000,
        });
        
        
  
        return res.status(200).json({ success: true, message: "Logged in successfully" });
      } else {
        return res.status(403).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: "Login failed" });
    }
  };
  
  exports.logout = (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true, // Set to true in production
            sameSite: "strict",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error logging out",
        });
    }
};



exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  
      user.resetPasswordToken = token;
      user.resetPasswordExpires = expiry;
      await user.save();
  
      const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  
      await sendEmail(
        user.email,
        'Reset Your Password',
        `Click the link to reset your password: ${resetUrl}\n\nThis link will expire in 15 minutes.`
      );
  
      res.json({ message: 'Reset link sent to email' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error while sending reset link' });
    }
};


exports.resetPassword = async (req, res) => {
    const { newPassword, token } = req.body;
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
  
      // Clear reset fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await user.save();
  
      res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error while resetting password' });
    }
};

exports.sendOTP = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const otp = generateOTP();
      const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  
      user.resetOTP = otp;
      user.otpExpiry = expiry;
      await user.save();
  
      await sendEmail(
        user.email,
        'Your OTP Code',
        `Your OTP is: ${otp}. It expires in 5 minutes.`
      );
  
      res.json({ message: 'OTP sent to email' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  };

  exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user || !user.resetOTP || !user.otpExpiry)
        return res.status(400).json({ message: 'Invalid request' });
  
      if (user.resetOTP !== otp || Date.now() > user.otpExpiry)
        return res.status(400).json({ message: 'Invalid or expired OTP' });
  
      // Clear OTP after verification
      user.resetOTP = undefined;
      user.otpExpiry = undefined;
      await user.save();
  
      // Generate JWT token (adjust payload as needed)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
  
      res.json({ message: 'OTP verified, login successful', token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during OTP verification' });
    }
  };

