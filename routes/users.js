'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/User');

module.exports = function() {

  // POST - Create new user account
  router.post('/users', async (req, res, next) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Name is required and must be a non-empty string',
        });
      }

      const user = new User({
        name: name.trim(),
      });

      const savedUser = await user.save();

      res.status(201).json({
        success: true,
        user: {
          _id: savedUser._id,
          name: savedUser.name,
          createdAt: savedUser.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET - Get user by ID
  router.get('/users/:userId', async (req, res, next) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET - List all users
  router.get('/users', async (req, res, next) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const users = await User.find()
        .skip(skip)
        .limit(limitNum)
        .lean();

      const total = await User.countDocuments();

      res.json({
        success: true,
        users: users.map(u => ({
          _id: u._id,
          name: u.name,
          createdAt: u.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
