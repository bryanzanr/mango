'use strict';

const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');

const defaultProfileData = {
  "id": 1,
  "name": "A Martinez",
  "description": "Adolph Larrue Martinez III.",
  "mbti": "ISFJ",
  "enneagram": "9w3",
  "variant": "sp/so",
  "tritype": 725,
  "socionics": "SEE",
  "sloan": "RCOEN",
  "psyche": "FEVL",
  "image": "https://soulverse.boo.world/images/1.png",
};

module.exports = function() {

  // Initialize database with default profile if empty
  router.use(async (req, res, next) => {
    try {
      const count = await Profile.countDocuments();
      if (count === 0) {
        await Profile.create(defaultProfileData);
      }
      next();
    } catch (error) {
      console.error('Error initializing profile:', error);
      next(error);
    }
  });

  router.get('/*', async function(req, res, next) {
    try {
      const profile = await Profile.findOne({ id: 1 });
      res.render('profile_template', {
        profile: profile,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      next(error);
    }
  });

  return router;
}

