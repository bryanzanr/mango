'use strict';

const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');

module.exports = function() {

  // POST - Create new comment
  router.post('/:profileId/comments', async (req, res, next) => {
    try {
      const { profileId } = req.params;
      const { authorId, authorName, content, parentCommentId, authorAvatar } = req.body;

      if (!authorId || !authorName || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: authorId, authorName, content',
        });
      }

      const comment = new Comment({
        profileId: parseInt(profileId),
        authorId,
        authorName,
        authorAvatar: authorAvatar || 'https://soulverse.boo.world/images/1.png',
        content,
        parentCommentId: parentCommentId || null,
      });

      const savedComment = await comment.save();

      // If this is a reply, increment parent's replyCount
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(
          parentCommentId,
          { $inc: { replyCount: 1 } }
        );
      }

      res.status(201).json({
        success: true,
        comment: {
          _id: savedComment._id,
          profileId: savedComment.profileId,
          authorId: savedComment.authorId,
          authorName: savedComment.authorName,
          authorAvatar: savedComment.authorAvatar,
          content: savedComment.content,
          parentCommentId: savedComment.parentCommentId,
          upvoteCount: savedComment.upvoteCount,
          downvoteCount: savedComment.downvoteCount,
          replyCount: savedComment.replyCount,
          isEdited: savedComment.isEdited,
          createdAt: savedComment.createdAt,
          updatedAt: savedComment.updatedAt,
          userVote: 0,
        },
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET - List comments for a profile
  router.get('/:profileId/comments', async (req, res, next) => {
    try {
      const { profileId } = req.params;
      const { sortBy = 'newest', parentCommentId = null, userId = null, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const query = {
        profileId: parseInt(profileId),
        isDeleted: false,
      };

      if (parentCommentId && parentCommentId !== 'null') {
        query.parentCommentId = parentCommentId;
      } else {
        query.parentCommentId = null;
      }

      let sortOrder = { createdAt: -1 };
      if (sortBy === 'oldest') {
        sortOrder = { createdAt: 1 };
      } else if (sortBy === 'toprated') {
        sortOrder = { upvoteCount: -1, downvoteCount: 1 };
      } else if (sortBy === 'mostreplies') {
        sortOrder = { replyCount: -1 };
      }

      const comments = await Comment.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limitNum)
        .lean();

      const total = await Comment.countDocuments(query);

      // Add user's vote information if userId provided
      let commentsWithVotes = comments;
      if (userId) {
        commentsWithVotes = await Promise.all(
          comments.map(async (comment) => {
            const vote = await Vote.findOne({
              commentId: comment._id,
              userId,
            });
            return {
              ...comment,
              userVote: vote ? vote.voteType : 0,
            };
          })
        );
      } else {
        commentsWithVotes = comments.map(c => ({ ...c, userVote: 0 }));
      }

      res.json({
        success: true,
        comments: commentsWithVotes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET - Get single comment with replies
  router.get('/:profileId/comments/:commentId', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { userId = null } = req.query;

      const comment = await Comment.findOne({
        _id: commentId,
        profileId: parseInt(profileId),
        isDeleted: false,
      }).lean();

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
        });
      }

      // Get replies
      const replies = await Comment.find({
        parentCommentId: commentId,
        isDeleted: false,
      }).lean();

      // Add vote information
      let commentWithVote = comment;
      let repliesWithVotes = replies;

      if (userId) {
        const mainVote = await Vote.findOne({
          commentId: comment._id,
          userId,
        });
        commentWithVote = {
          ...comment,
          userVote: mainVote ? mainVote.voteType : 0,
        };

        repliesWithVotes = await Promise.all(
          replies.map(async (reply) => {
            const vote = await Vote.findOne({
              commentId: reply._id,
              userId,
            });
            return {
              ...reply,
              userVote: vote ? vote.voteType : 0,
            };
          })
        );
      } else {
        commentWithVote = { ...comment, userVote: 0 };
        repliesWithVotes = replies.map(r => ({ ...r, userVote: 0 }));
      }

      res.json({
        success: true,
        comment: commentWithVote,
        replies: repliesWithVotes,
      });
    } catch (error) {
      console.error('Error fetching comment:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // PUT - Edit comment
  router.put('/:profileId/comments/:commentId', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { content, authorId } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
        });
      }

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

      if (comment.authorId !== authorId) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own comments',
        });
      }

      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();
      const updated = await comment.save();

      res.json({
        success: true,
        comment: {
          _id: updated._id,
          profileId: updated.profileId,
          authorId: updated.authorId,
          authorName: updated.authorName,
          authorAvatar: updated.authorAvatar,
          content: updated.content,
          parentCommentId: updated.parentCommentId,
          upvoteCount: updated.upvoteCount,
          downvoteCount: updated.downvoteCount,
          replyCount: updated.replyCount,
          isEdited: updated.isEdited,
          editedAt: updated.editedAt,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          userVote: 0,
        },
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // DELETE - Delete comment (soft delete)
  router.delete('/:profileId/comments/:commentId', async (req, res, next) => {
    try {
      const { profileId, commentId } = req.params;
      const { authorId } = req.body;

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

      if (comment.authorId !== authorId) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
        });
      }

      comment.isDeleted = true;
      const updated = await comment.save();

      // If this was a reply, decrement parent's replyCount
      if (comment.parentCommentId) {
        await Comment.findByIdAndUpdate(
          comment.parentCommentId,
          { $inc: { replyCount: -1 } }
        );
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
};
