const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:4000", // fallback to localhost if env not set
    credentials: true, // allow cookies
    //methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"],
  // exposedHeaders: ["Set-Cookie"], // expose cookie headers if needed by frontend
}));


const hackathon = require('./routes/hackathonRoutes');
const team = require('./routes/team');
const user = require('./routes/user');
const request = require('./routes/request');
const notifications = require('./routes/notification');
const announcement = require('./routes/announcement');
const feedback = require('./routes/feedback');
const complaint = require('./routes/complaint');
const submission = require('./routes/submissions')
const organization = require('./routes/organization');
const PORT = process.env.PORT || 4000;

require('./config/database').connect();
require('./config/cloudinary').cloudinaryConnect();

app.use('/api/v1', user, hackathon, team, request, announcement, notifications, feedback, complaint, submission, organization);

app.listen(PORT, () => {
    console.log(`Server live at ${PORT}`);
})
