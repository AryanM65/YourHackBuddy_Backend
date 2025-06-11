// models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  againstType: {
    type: String,
    enum: ['User', 'Team', 'Hackathon', 'System'],
    required: true,
  },
  againstId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function () {
      return this.againstType !== 'System';
    },
    refPath: 'againstType',
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'rejected'],
    default: 'pending',
  },
  adminResponse: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Complaint', complaintSchema);
