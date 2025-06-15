const express = require('express');
const router = express.Router();

const {login, signup, logout, forgotPassword, resetPassword, sendOTP, verifyOTP, viewUserFriends, deleteFriend, getLoggedInUserProfile, updateProfile, getUsersFromYourInstitute, getUserParticipatedHackathons, getAllUsers,  fetchUserProfile} = require('../controllers/Auth');
const {auth, isStudent, isAdmin} = require('../middlewares/auth');
const { upload } = require("../middlewares/multer"); // adjust path

router.post('/login', login);
router.post('/signup', upload.single("profilePicture"), signup);
router.post("/logout", logout);

router.get('/test', auth, (req, res) => {
    res.json({
        success: true, 
        message: "authentication complete",
    })
})

router.get('/student', auth, isStudent, (req, res) => {
    res.json({
        success: true, 
        message: "welcome to the protected route for students",
    })
})

router.get('/admin', auth, isAdmin, (req, res) => {
    res.json({
        success: true, 
        message: "welcome to the protected route for Admin",
    })
})

router.post('/forgot-password', forgotPassword);
// router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);


router.get("/users/:userId/hackathons", getUserParticipatedHackathons);
router.get('/profile', auth, getLoggedInUserProfile)
router.put("/profile/edit", auth, upload.single("profilePicture"), updateProfile);
router.get('/getfriends', auth, viewUserFriends);
router.delete("/friends/:friendId", auth, deleteFriend);
router.get("/from-institute", auth, getUsersFromYourInstitute);
router.get("/admin/users", auth, isAdmin, getAllUsers);
router.get('/profile/:userId', fetchUserProfile)


module.exports = router;