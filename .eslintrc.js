/**
 * ESLint configuration for Session Shepherd
 * Enforces code quality and consistency
 */

module.exports = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      // Chrome extension APIs
      'chrome': 'readonly',
      'browser': 'readonly',
      
      // Test globals
      'testUtils': 'readonly',
      'extensionHelpers': 'readonly',
      
      // Browser globals
      'window': 'readonly',
      'document': 'readonly',
      'console': 'readonly',
      'setTimeout': 'readonly',
      'clearTimeout': 'readonly',
      'setInterval': 'readonly',
      'clearInterval': 'readonly',
      'fetch': 'readonly',
      'Promise': 'readonly',
      'performance': 'readonly'
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  rules: {
    // Code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Style rules
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    
    // Chrome extension specific
    'no-undef': 'off' // Chrome APIs are global
  }
};
