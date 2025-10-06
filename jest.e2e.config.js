/**
 * Jest configuration for E2E tests
 * Uses Puppeteer for browser automation
 */

module.exports = {
  displayName: 'E2E Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/e2e/**/*.test.js',
    '<rootDir>/tests/e2e/**/*.spec.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],
  testTimeout: 30000,
  maxWorkers: 1, // Run E2E tests sequentially
  collectCoverage: false, // Don't collect coverage for E2E tests
  verbose: true
};
