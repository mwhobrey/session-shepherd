/**
 * Clean npm install script that suppresses deprecation warnings
 * These warnings are not critical for our testing setup
 */

const { execSync } = require('child_process');

console.log('🧹 Installing dependencies with suppressed warnings...\n');

try {
  // Install with warnings suppressed
  execSync('npm install --silent', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      NPM_CONFIG_AUDIT: 'false',
      NPM_CONFIG_FUND: 'false'
    }
  });
  
  console.log('✅ Dependencies installed successfully!');
  console.log('📝 Note: Some deprecation warnings are normal and don\'t affect functionality.\n');
  
  console.log('🚀 Ready to run tests:');
  console.log('  npm test              # Run unit tests');
  console.log('  npm run test:e2e      # Run E2E tests');
  console.log('  npm run test:all      # Run all tests\n');
  
} catch (error) {
  console.error('❌ Installation failed:', error.message);
  process.exit(1);
}
