'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Comment.deleteMany({});
  await Vote.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Comments API', () => {
  describe('POST /api/:profileId/comments - Create Comment', () => {
    test('should create a new top-level comment', async () => {
      const newComment = {
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'This is a great profile!',
      };

      const response = await request(app)
        .post('/api/1/comments')
        .send(newComment);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.authorName).toBe('John Doe');
      expect(response.body.comment.content).toBe('This is a great profile!');
      expect(response.body.comment.upvoteCount).toBe(0);
      expect(response.body.comment.downvoteCount).toBe(0);
      expect(response.body.comment.replyCount).toBe(0);
      expect(response.body.comment.userVote).toBe(0);
    });

    test('should create a reply comment with parentCommentId', async () => {
      // Create parent comment first
      const parent = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Parent comment',
      });

      const reply = {
        authorId: 'user2',
        authorName: 'Jane Smith',
        content: 'Reply to parent',
        parentCommentId: parent._id.toString(),
      };

      const response = await request(app)
        .post('/api/1/comments')
        .send(reply);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.parentCommentId).toBe(parent._id.toString());

      // Verify parent replyCount incremented
      const updatedParent = await Comment.findById(parent._id);
      expect(updatedParent.replyCount).toBe(1);
    });

    test('should use default avatar if not provided', async () => {
      const newComment = {
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Test comment',
      };

      const response = await request(app)
        .post('/api/1/comments')
        .send(newComment);

      expect(response.status).toBe(201);
      expect(response.body.comment.authorAvatar).toBe('https://soulverse.boo.world/images/1.png');
    });

    test('should accept custom avatar', async () => {
      const newComment = {
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Test comment',
        authorAvatar: 'https://example.com/avatar.jpg',
      };

      const response = await request(app)
        .post('/api/1/comments')
        .send(newComment);

      expect(response.status).toBe(201);
      expect(response.body.comment.authorAvatar).toBe('https://example.com/avatar.jpg');
    });

    test('should return 400 if required fields missing', async () => {
      const incompleteComment = {
        authorName: 'John Doe',
      };

      const response = await request(app)
        .post('/api/1/comments')
        .send(incompleteComment);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required fields');
    });
  });

  describe('GET /api/:profileId/comments - List Comments', () => {
    beforeEach(async () => {
      // Create test comments
      await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment 1',
        upvoteCount: 5,
      });

      await Comment.create({
        profileId: 1,
        authorId: 'user2',
        authorName: 'Jane Smith',
        content: 'Comment 2',
        upvoteCount: 10,
      });

      await Comment.create({
        profileId: 1,
        authorId: 'user3',
        authorName: 'Bob Johnson',
        content: 'Comment 3',
        upvoteCount: 2,
      });
    });

    test('should list all comments for a profile (newest first by default)', async () => {
      const response = await request(app).get('/api/1/comments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comments.length).toBe(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    test('should sort comments by newest first', async () => {
      const response = await request(app)
        .get('/api/1/comments')
        .query({ sortBy: 'newest' });

      expect(response.status).toBe(200);
      expect(response.body.comments[0].content).toBe('Comment 3');
    });

    test('should sort comments by oldest first', async () => {
      const response = await request(app)
        .get('/api/1/comments')
        .query({ sortBy: 'oldest' });

      expect(response.status).toBe(200);
      expect(response.body.comments[0].content).toBe('Comment 1');
    });

    test('should sort comments by top rated (most voted)', async () => {
      const response = await request(app)
        .get('/api/1/comments')
        .query({ sortBy: 'toprated' });

      expect(response.status).toBe(200);
      expect(response.body.comments[0].content).toBe('Comment 2');
      expect(response.body.comments[0].upvoteCount).toBe(10);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/1/comments')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });

    test('should not return deleted comments', async () => {
      await Comment.updateOne({ content: 'Comment 1' }, { isDeleted: true });

      const response = await request(app).get('/api/1/comments');

      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBe(2);
    });

    test('should only list top-level comments by default', async () => {
      const parent = await Comment.findOne({ content: 'Comment 1' });
      await Comment.create({
        profileId: 1,
        authorId: 'user4',
        authorName: 'Alice',
        content: 'Reply to comment 1',
        parentCommentId: parent._id,
      });

      const response = await request(app).get('/api/1/comments');

      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBe(3); // Only top-level comments
    });

    test('should include userVote information when userId provided', async () => {
      const response = await request(app)
        .get('/api/1/comments')
        .query({ userId: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body.comments[0]).toHaveProperty('userVote');
      expect(response.body.comments[0].userVote).toBe(0);
    });
  });

  describe('GET /api/:profileId/comments/:commentId - Get Single Comment', () => {
    test('should get single comment with replies', async () => {
      const parent = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Parent comment',
      });

      const reply = await Comment.create({
        profileId: 1,
        authorId: 'user2',
        authorName: 'Jane Smith',
        content: 'Reply',
        parentCommentId: parent._id,
      });

      const response = await request(app)
        .get(`/api/1/comments/${parent._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toBe('Parent comment');
      expect(response.body.replies.length).toBe(1);
      expect(response.body.replies[0].content).toBe('Reply');
    });

    test('should return 404 for non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/1/comments/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should not return deleted comments', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
        isDeleted: true,
      });

      const response = await request(app)
        .get(`/api/1/comments/${comment._id}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/:profileId/comments/:commentId - Edit Comment', () => {
    test('should edit own comment', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Original content',
      });

      const response = await request(app)
        .put(`/api/1/comments/${comment._id}`)
        .send({
          content: 'Updated content',
          authorId: 'user1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toBe('Updated content');
      expect(response.body.comment.isEdited).toBe(true);
      expect(response.body.comment.editedAt).toBeDefined();
    });

    test('should not allow editing others comments', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Original content',
      });

      const response = await request(app)
        .put(`/api/1/comments/${comment._id}`)
        .send({
          content: 'Hacked content',
          authorId: 'user2',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('only edit your own');
    });

    test('should return 400 if content is missing', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Original content',
      });

      const response = await request(app)
        .put(`/api/1/comments/${comment._id}`)
        .send({
          authorId: 'user1',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/:profileId/comments/:commentId - Delete Comment', () => {
    test('should soft delete own comment', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment to delete',
      });

      const response = await request(app)
        .delete(`/api/1/comments/${comment._id}`)
        .send({
          authorId: 'user1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment.isDeleted).toBe(true);
    });

    test('should decrement parent replyCount when deleting reply', async () => {
      const parent = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Parent',
        replyCount: 1,
      });

      const reply = await Comment.create({
        profileId: 1,
        authorId: 'user2',
        authorName: 'Jane Smith',
        content: 'Reply',
        parentCommentId: parent._id,
      });

      await request(app)
        .delete(`/api/1/comments/${reply._id}`)
        .send({
          authorId: 'user2',
        });

      const updatedParent = await Comment.findById(parent._id);
      expect(updatedParent.replyCount).toBe(0);
    });

    test('should not allow deleting others comments', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      const response = await request(app)
        .delete(`/api/1/comments/${comment._id}`)
        .send({
          authorId: 'user2',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Votes API', () => {
  describe('POST /api/:profileId/comments/:commentId/vote - Vote on Comment', () => {
    test('should cast an upvote', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      const response = await request(app)
        .post(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
          voteType: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.upvoteCount).toBe(1);
      expect(response.body.comment.downvoteCount).toBe(0);
      expect(response.body.comment.userVote).toBe(1);
    });

    test('should cast a downvote', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      const response = await request(app)
        .post(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
          voteType: -1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.upvoteCount).toBe(0);
      expect(response.body.comment.downvoteCount).toBe(1);
      expect(response.body.comment.userVote).toBe(-1);
    });

    test('should remove upvote when voting up again', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
        upvoteCount: 1,
      });

      await Vote.create({
        commentId: comment._id,
        userId: 'user2',
        voteType: 1,
      });

      const response = await request(app)
        .post(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
          voteType: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.comment.upvoteCount).toBe(0);
      expect(response.body.comment.userVote).toBe(0);
    });

    test('should change vote from upvote to downvote', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
        upvoteCount: 1,
      });

      await Vote.create({
        commentId: comment._id,
        userId: 'user2',
        voteType: 1,
      });

      const response = await request(app)
        .post(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
          voteType: -1,
        });

      expect(response.status).toBe(200);
      expect(response.body.comment.upvoteCount).toBe(0);
      expect(response.body.comment.downvoteCount).toBe(1);
      expect(response.body.comment.userVote).toBe(-1);
    });

    test('should return 400 for invalid voteType', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      const response = await request(app)
        .post(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
          voteType: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/1/comments/${fakeId}/vote`)
        .send({
          userId: 'user2',
          voteType: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/:profileId/comments/:commentId/votes - Get Vote Summary', () => {
    test('should return vote summary', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
        upvoteCount: 5,
        downvoteCount: 2,
      });

      const response = await request(app)
        .get(`/api/1/comments/${comment._id}/votes`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.votes.upvoteCount).toBe(5);
      expect(response.body.votes.downvoteCount).toBe(2);
      expect(response.body.votes.netScore).toBe(3);
      expect(response.body.votes.userVote).toBe(0);
    });

    test('should include user vote when userId provided', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      await Vote.create({
        commentId: comment._id,
        userId: 'user2',
        voteType: 1,
      });

      const response = await request(app)
        .get(`/api/1/comments/${comment._id}/votes`)
        .query({ userId: 'user2' });

      expect(response.status).toBe(200);
      expect(response.body.votes.userVote).toBe(1);
    });
  });

  describe('DELETE /api/:profileId/comments/:commentId/vote - Remove Vote', () => {
    test('should remove upvote', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
        upvoteCount: 1,
      });

      const vote = await Vote.create({
        commentId: comment._id,
        userId: 'user2',
        voteType: 1,
      });

      const response = await request(app)
        .delete(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comment.upvoteCount).toBe(0);
      expect(response.body.comment.userVote).toBe(0);
    });

    test('should return 404 if no vote exists', async () => {
      const comment = await Comment.create({
        profileId: 1,
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'Comment',
      });

      const response = await request(app)
        .delete(`/api/1/comments/${comment._id}/vote`)
        .send({
          userId: 'user2',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
