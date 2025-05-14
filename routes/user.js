const express = require('express');
const router = express.Router();

const {login, signup, logout, forgotPassword, resetPassword, sendOTP, verifyOTP} = require('../controllers/Auth');
const {auth, isStudent, isAdmin} = require('../middlewares/auth');

router.post('/login', login);
router.post('/signup', signup);
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

module.exports = router;