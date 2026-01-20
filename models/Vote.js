'use strict';

const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    ref: 'Comment',
  },
  userId: {
    type: String,
    required: true,
  },
  voteType: {
    type: Number,
    enum: [1, -1],
    required: true,
  },
}, { timestamps: true });

// Ensure one vote per user per comment
voteSchema.index({ commentId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
