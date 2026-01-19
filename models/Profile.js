'use strict';

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  mbti: {
    type: String,
  },
  enneagram: {
    type: String,
  },
  variant: {
    type: String,
  },
  tritype: {
    type: Number,
  },
  socionics: {
    type: String,
  },
  sloan: {
    type: String,
  },
  psyche: {
    type: String,
  },
  image: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
