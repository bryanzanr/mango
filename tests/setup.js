'use strict';

const { connectDB, disconnectDB } = require('../db');
const Profile = require('../models/Profile');

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start MongoDB in-memory server
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongoServer = await MongoMemoryServer.create();
  
  const mongoUri = mongoServer.getUri();
  const mongoose = require('mongoose');
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  await Profile.deleteMany({});
});

// Teardown after all tests
afterAll(async () => {
  const mongoose = require('mongoose');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
