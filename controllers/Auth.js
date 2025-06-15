const User = require('../Models/User');
const Hackathon = require('../Models/Hackathon');
const Organization = require('../Models/Organization');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const {generateOTP, generateToken} = require('../utils/tokenUtils');
const { uploadOnCloudinary } = require('../utils/cloudinary'); // Adjust the path


require('dotenv').config();

exports.signup = async (req, res) => {
  console.log(req.body)
  try {
    const { 
      name, 
      username, 
      email, 
      password, 
      role, 
      skills, 
      bio, 
      linkedin, 
      github, 
      institute, 
      designation, 
      profilePicture,
      organizationEmail // 👈 Changed from organizationName to organizationEmail
    } = req.body;

    // Validate required fields
    if (!name || !username || !email || !password || !role) {
      return res.status(400).json({
        status: false,
        message: "All fields are required (name, username, email, password, role)",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User with this email or username already exists",
      });
    }

    // Check organization existence if role is Organization
    let organizationId = null;

    if (role === "Organization") {
      if (!organizationEmail) {
        return res.status(400).json({
          status: false,
          message: "Organization email is required for organizer signup",
        });
      }

      // Find organization by email instead of name
      const organization = await Organization.findOne({ email: organizationEmail });
      if (!organization) {
        return res.status(400).json({
          status: false,
          message: "Organization not registered. Please register it first.",
        });
      }

      organizationId = organization._id;
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Error while hashing password",
      });
    }

    let profilePictureUrl = '';

    if (req.file) {
      const cloudinaryResult = await uploadOnCloudinary(req.file.path); // multer saves to disk
      if (cloudinaryResult) {
        profilePictureUrl = cloudinaryResult.secure_url;
      }
    }

    // Create new user
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role,
      skills: role === "Student" ? (skills || []) : [], // Only students have skills
      bio: bio || '',
      linkedin: linkedin || '',
      github: github || '',
      institute: role === "Student" ? institute : '', // Only students have institute
      designation: role === "Student" ? (designation || 'Student') : '', // Only students have designation
      profilePicture: profilePictureUrl || '',
      organization: organizationId, // 👈 attach org ID if organizer
    });

    await newUser.save();

    try {
      await sendEmail(
        email,
        'Welcome to YourHackBuddy 🎉',
        `Hello ${name},\n\nWelcome to YourHackBuddy!\nWe're excited to have you on board.\n\nBest,\nThe YourHackBuddy Team`
      );
    } catch (emailErr) {
      console.error("Error sending welcome email:", emailErr);
      // Don't return error here to avoid blocking signup flow
    }

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
          httpOnly: true,            // Prevents JavaScript access to cookie
          secure: false,             // false for localhost (no HTTPS)
          sameSite: "lax",           // Allows cross-origin requests like login
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        
        
  
        return res.status(200).json({ success: true, message: "Logged in successfully"});
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
    if (!user || !user.resetOTP || !user.otpExpiry) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (user.resetOTP !== otp || Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after verification
    user.resetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,            // Prevents JavaScript access to cookie
      secure: false,             // Set to true in production (HTTPS)
      sameSite: "lax",           // Good balance of CSRF protection and usability
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({ message: 'OTP verified, login successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

  exports.getLoggedInUserProfile = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.getProfile(userId);
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Error fetching logged-in user profile:", error);
      res.status(500).json({
        success: false,
        message: "Something went wrong while fetching profile",
      });
    }
  };

  exports.updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const { bio, skills, linkedin, github } = req.body;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          bio,
          skills,
          linkedin,
          github,
        },
        { new: true }
      ).select("-password"); // Exclude password
  
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  };

  exports.viewUserFriends = async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you're using JWT authentication or some form of user context
  
      // Fetch the user with populated friends
      const user = await User.findById(userId).populate('friends', 'name username email profilePicture'); // Populate friends with necessary fields
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Send the list of friends
      res.status(200).json(user.friends);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching friends" });
    }
  };

  exports.deleteFriend = async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you're using JWT authentication or some form of user context
      const friendId = req.params.friendId; // Friend's ID to delete
  
      // Ensure the current user and the friend exist
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
  
      if (!user || !friend) {
        return res.status(404).json({ message: "User or Friend not found" });
      }
  
      // Remove the friend from the current user's friends list
      await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
  
      // Remove the current user from the friend's friends list
      await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
  
      res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error removing friend" });
    }
  };

  exports.getUsersFromYourInstitute = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
  
      if (!user) return res.status(404).json({ error: "User not found." });
  
      const users = await User.find({
        _id: { $ne: userId }, // exclude self
        institute: user.institute,
      }).select("-password -resetPasswordToken -resetPasswordExpires -resetOTP -otpExpiry");
  
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: "Error fetching users from your institute." });
    }
  };

  exports.getUserParticipatedHackathons = async (req, res) => {
    try {
      const userId = req.params.userId; // or get from req.user if using auth middleware
  
      // Find user and populate the hackathonsParticipated field with hackathon details
      const user = await User.findById(userId).populate("hackathonsParticipated");
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      res.status(200).json({
        success: true,
        hackathons: user.hackathonsParticipated,
      });
    } catch (err) {
      console.error("Error fetching user's participated hackathons:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  
exports.getAllUsers = async (req, res) => {
  try {
    console.log("here");
    const users = await User.find()
      .select("name username email createdAt role") // select fields + createdAt
      .populate({
        path: "organization",
        select: "name website"
      });
      console.log("reaching here");
      console.log("users", users)
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.fetchUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await User.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};