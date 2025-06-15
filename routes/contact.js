const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/sendEmail");

router.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  try {
    // 1 Email to admin
    const adminSubject = "New Contact Form Submission";
    const adminText = `
      Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Message:
      ${message}
    `;

    await sendEmail(process.env.EMAIL_USER, adminSubject, adminText);

    // 2️ Confirmation email to user
    const userSubject = "We've received your message";
    const userText = `
      Hi ${name},

      Thank you for reaching out to us! We've received your message and will get back to you as soon as possible.

      Here's what you submitted:
      ---------------------------------------
      Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Message:
      ${message}
      ---------------------------------------

      Best regards,  
      YourHackBuddy
    `;

    await sendEmail(email, userSubject, userText);

    res.json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, error: "Email sending failed." });
  }
});

module.exports = router;
