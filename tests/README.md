# Session Shepherd Testing Guide

This directory contains comprehensive test suites for the Session Shepherd Chrome extension.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
├── e2e/                     # End-to-end tests with Puppeteer
├── performance/             # Performance and load tests
├── fixtures/                # Mock data and test fixtures
├── utils/                   # Test utilities and helpers
└── screenshots/             # E2E test screenshots (generated)
```

## Running Tests

### Unit Tests
```bash
npm test                    # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
```

### All Tests
```bash
npm run test:all           # Run unit and E2E tests
```

### Performance Tests
```bash
npm test tests/performance/ # Run performance tests
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **session-shepherd.test.js**: Core functionality tests
- **background.test.js**: Service worker tests

Tests individual functions and classes in isolation with mocked dependencies.

### E2E Tests (`tests/e2e/`)
- **extension-workflow.test.js**: Complete user workflows

Tests the full extension in a real Chrome environment using Puppeteer.

### Performance Tests (`tests/performance/`)
- **performance.test.js**: Load and performance testing

Tests extension performance with large datasets and concurrent operations.

## Test Data

### Mock Data (`tests/fixtures/mock-data.js`)
- Sample tabs, sessions, and Chrome API responses
- Test scenarios for different workflows
- Performance test data generators

### Test Helpers (`tests/utils/test-helpers.js`)
- Common testing utilities
- Chrome API mocking
- DOM manipulation helpers
- Performance measurement tools

## Writing Tests

### Unit Test Example
```javascript
describe('SessionShepherd', () => {
  test('should create session with correct structure', () => {
    const session = TestHelpers.createTestSession({
      name: 'Test Session',
      tabs: mockTabs
    });
    
    TestHelpers.assertSessionStructure(session);
    expect(session.name).toBe('Test Session');
  });
});
```

### E2E Test Example
```javascript
test('should create session with Save Only', async () => {
  await extensionHelpers.openExtension();
  await extensionHelpers.typeInElement('#session-name', 'Test Session');
  await extensionHelpers.clickElement('#save-only');
  
  await page.waitForSelector('#sessions-content.active');
  const sessionCards = await page.$$('.session-card');
  expect(sessionCards.length).toBeGreaterThan(0);
});
```

## Test Configuration

### Jest Configuration
- **Unit tests**: `jest` (default config)
- **E2E tests**: `jest.e2e.config.js`
- **Performance tests**: Included in unit test suite

### Chrome Extension Testing
- Uses Puppeteer for browser automation
- Loads extension in test Chrome instance
- Mocks Chrome APIs for unit tests

## Coverage

The test suite aims for:
- **Unit tests**: 90%+ code coverage
- **E2E tests**: All critical user workflows
- **Performance tests**: Large dataset handling

## Debugging Tests

### Unit Tests
```bash
npm run test -- --verbose    # Detailed output
npm run test -- --debug      # Debug mode
```

### E2E Tests
```bash
npm run test:e2e -- --verbose # Detailed output
```

Screenshots are automatically saved to `tests/screenshots/` for failed E2E tests.

## Continuous Integration

The test suite is designed to run in CI/CD environments:
- Headless mode for E2E tests
- Parallel execution where possible
- Performance thresholds for regression detection

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Mock external dependencies**: Use Chrome API mocks
3. **Test edge cases**: Empty states, errors, large datasets
4. **Performance awareness**: Set reasonable timeouts and thresholds
5. **Clear assertions**: Use descriptive test names and assertions

## Troubleshooting

### Common Issues

1. **Chrome extension not loading**: Check manifest.json and file paths
2. **E2E tests timing out**: Increase timeout values
3. **Performance tests failing**: Adjust thresholds for CI environment
4. **Mock data issues**: Verify fixture data matches expected structure

### Debug Commands

```bash
# Run specific test file
npm test tests/unit/session-shepherd.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create session"

# Run with debug output
npm test -- --verbose --no-coverage
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate test data to fixtures
3. Update this README if adding new test categories
4. Ensure tests pass in both local and CI environments
