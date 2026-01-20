'use strict';

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  profileId: {
    type: Number,
    required: true,
    index: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorAvatar: {
    type: String,
    default: 'https://soulverse.boo.world/images/1.png',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'Comment',
  },
  upvoteCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  downvoteCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  replyCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Index for querying comments by profile and parent
commentSchema.index({ profileId: 1, parentCommentId: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
