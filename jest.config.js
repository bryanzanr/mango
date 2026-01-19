module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'app.js',
    'routes/**/*.js',
    'models/**/*.js',
    'db.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  detectOpenHandles: true,
};
