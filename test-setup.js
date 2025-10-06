/**
 * Test setup script for Session Shepherd
 * Installs dependencies and runs initial test validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Setting up Session Shepherd test environment...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this from the project root.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error(`❌ Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or higher.`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'tests', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('✅ Created screenshots directory');
}

// Validate test files
const testFiles = [
  'tests/unit/session-shepherd.test.js',
  'tests/unit/background.test.js',
  'tests/e2e/extension-workflow.test.js',
  'tests/performance/performance.test.js'
];

console.log('\n🔍 Validating test files...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Run linting
console.log('\n🔍 Running ESLint...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint passed\n');
} catch (error) {
  console.log('⚠️  ESLint found issues. Run "npm run lint:fix" to auto-fix.\n');
}

// Run unit tests
console.log('🧪 Running unit tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Unit tests passed\n');
} catch (error) {
  console.log('❌ Unit tests failed. Check the output above.\n');
}

// Test summary
console.log('📊 Test Environment Summary:');
console.log('├── Unit Tests: Jest with jsdom environment');
console.log('├── E2E Tests: Puppeteer with Chrome extension');
console.log('├── Performance Tests: Load testing with large datasets');
console.log('├── Coverage: HTML and LCOV reports generated');
console.log('└── Linting: ESLint with Chrome extension rules\n');

console.log('🚀 Test environment ready! Available commands:');
console.log('  npm test              # Run unit tests');
console.log('  npm run test:watch    # Run tests in watch mode');
console.log('  npm run test:coverage # Run with coverage report');
console.log('  npm run test:e2e      # Run E2E tests');
console.log('  npm run test:all      # Run all tests');
console.log('  npm run lint          # Run ESLint');
console.log('  npm run lint:fix      # Auto-fix ESLint issues\n');

console.log('📚 For detailed testing information, see tests/README.md');
console.log('🎯 Happy testing! 🎯');
