'use strict';

const express = require('express');
const app = express();
const port =  process.env.PORT || 3000;
const { connectDB, disconnectDB } = require('./db');

// set the view engine to ejs
app.set('view engine', 'ejs');

// middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// routes
app.use('/', require('./routes/profile')());
app.use('/api', require('./routes/users')());
app.use('/api', require('./routes/comments')());
app.use('/api', require('./routes/votes')());

// Export app for testing
module.exports = app;

// start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  async function startServer() {
    try {
      await connectDB();
      
      const server = app.listen(port);
      console.log('Express started. Listening on %s', port);
      
      // Handle graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(async () => {
          console.log('HTTP server closed');
          await disconnectDB();
          process.exit(0);
        });
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
}
