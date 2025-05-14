const User = require('../Models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

