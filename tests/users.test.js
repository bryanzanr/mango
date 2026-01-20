'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
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
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Users API', () => {
  describe('POST /api/users - Create User', () => {
    test('should create a new user with only name', async () => {
      const newUser = {
        name: 'John Doe',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('John Doe');
      expect(response.body.user._id).toBeDefined();
      expect(response.body.user.createdAt).toBeDefined();
    });

    test('should trim whitespace from name', async () => {
      const newUser = {
        name: '  Jane Smith  ',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.name).toBe('Jane Smith');
    });

    test('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should return 400 if name is empty string', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 if name is not a string', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 123 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create multiple users with same name', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John Doe' });

      const response = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const users = await User.find({});
      expect(users.length).toBe(2);
    });
  });

  describe('GET /api/users/:userId - Get User', () => {
    test('should retrieve user by ID', async () => {
      const user = await User.create({ name: 'John Doe' });

      const response = await request(app)
        .get(`/api/users/${user._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('John Doe');
      expect(response.body.user._id).toBe(user._id.toString());
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/users - List Users', () => {
    beforeEach(async () => {
      await User.create({ name: 'User 1' });
      await User.create({ name: 'User 2' });
      await User.create({ name: 'User 3' });
    });

    test('should list all users', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBe(3);
      expect(response.body.pagination.total).toBe(3);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });

    test('should return empty array when no users exist', async () => {
      await User.deleteMany({});

      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(0);
      expect(response.body.pagination.total).toBe(0);
    });
  });
});
