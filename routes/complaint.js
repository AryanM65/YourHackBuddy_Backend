// routes/complaintRoutes.js
const express = require('express');
const {
  submitComplaint,
  getAllComplaints,
  resolveComplaint
} = require('../controllers/Complaint');

const { auth, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// Route 1: User submits complaint
router.post('/add-complaint', auth, submitComplaint);

// Route 2: Admin views all complaints
router.get('/admin/view-complaints', auth, isAdmin, getAllComplaints);

router.patch('/resolve/:id', auth, isAdmin, resolveComplaint);

module.exports = router;
