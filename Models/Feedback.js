const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  hackathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // rating: {
  //   type: Number,
  //   required: true,
  //   min: 1,
  //   max: 5,
  // },
  comments: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
