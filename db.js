'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

async function connectDB() {
  try {
    // Start the in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected via mongodb-memory-server');
    return mongoServer;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
      console.log('MongoDB disconnected');
    }
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
