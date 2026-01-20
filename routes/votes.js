'use strict';

const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Comment = require('../models/Comment');

module.exports = function() {

  // POST - Cast or update a vote
  router.post('/:profileId/comments/:commentId/vote', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { userId, voteType } = req.body;

      if (!userId || !voteType || ![1, -1].includes(voteType)) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid required fields: userId, voteType (1 or -1)',
        });
      }

      // Verify comment exists
      const comment = await Comment.findOne({
        _id: commentId,
        profileId: parseInt(profileId),
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Check for existing vote
      let existingVote = await Vote.findOne({
        commentId,
        userId,
      });

      let previousVoteType = existingVote ? existingVote.voteType : 0;
      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (existingVote) {
        // If voting the same way, remove the vote
        if (existingVote.voteType === voteType) {
          await Vote.deleteOne({ _id: existingVote._id });
          if (voteType === 1) {
            upvoteDelta = -1;
          } else {
            downvoteDelta = -1;
          }
        } else {
          // Change vote type
          existingVote.voteType = voteType;
          await existingVote.save();
          if (previousVoteType === 1) {
            upvoteDelta = -1;
          } else {
            downvoteDelta = -1;
          }
          if (voteType === 1) {
            upvoteDelta += 1;
          } else {
            downvoteDelta += 1;
          }
        }
      } else {
        // Create new vote
        await Vote.create({
          commentId,
          userId,
          voteType,
        });
        if (voteType === 1) {
          upvoteDelta = 1;
        } else {
          downvoteDelta = 1;
        }
      }

      // Update comment vote counts
      const updateObj = {};
      if (upvoteDelta !== 0) {
        updateObj.upvoteCount = { $inc: upvoteDelta };
      }
      if (downvoteDelta !== 0) {
        updateObj.downvoteCount = { $inc: downvoteDelta };
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          upvoteCount: comment.upvoteCount + upvoteDelta,
          downvoteCount: comment.downvoteCount + downvoteDelta,
        },
        { new: true }
      );

      // Get current vote type
      const currentVote = await Vote.findOne({
        commentId,
        userId,
      });

      res.json({
        success: true,
        comment: {
          _id: updatedComment._id,
          upvoteCount: updatedComment.upvoteCount,
          downvoteCount: updatedComment.downvoteCount,
          userVote: currentVote ? currentVote.voteType : 0,
        },
      });
    } catch (error) {
      console.error('Error voting on comment:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET - Get vote summary for a comment
  router.get('/:profileId/comments/:commentId/votes', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { userId = null } = req.query;

      const comment = await Comment.findOne({
        _id: commentId,
        profileId: parseInt(profileId),
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      let userVote = 0;
      if (userId) {
        const vote = await Vote.findOne({
          commentId,
          userId,
        });
        userVote = vote ? vote.voteType : 0;
      }

      res.json({
        success: true,
        votes: {
          upvoteCount: comment.upvoteCount,
          downvoteCount: comment.downvoteCount,
          netScore: comment.upvoteCount - comment.downvoteCount,
          userVote,
        },
      });
    } catch (error) {
      console.error('Error fetching vote summary:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // DELETE - Remove vote (alternative to posting same vote type)
  router.delete('/:profileId/comments/:commentId/vote', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const vote = await Vote.findOne({
        commentId,
        userId,
      });

      if (!vote) {
        return res.status(404).json({
          success: false,
          error: 'No vote found for this user on this comment',
        });
      }

      const voteType = vote.voteType;
      await Vote.deleteOne({ _id: vote._id });

      // Update comment vote counts
      const comment = await Comment.findById(commentId);
      if (voteType === 1) {
        comment.upvoteCount = Math.max(0, comment.upvoteCount - 1);
      } else {
        comment.downvoteCount = Math.max(0, comment.downvoteCount - 1);
      }
      const updated = await comment.save();

      res.json({
        success: true,
        comment: {
          _id: updated._id,
          upvoteCount: updated.upvoteCount,
          downvoteCount: updated.downvoteCount,
          userVote: 0,
        },
      });
    } catch (error) {
      console.error('Error removing vote:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
