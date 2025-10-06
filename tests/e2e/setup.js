/**
 * E2E test setup for Session Shepherd
 * Configures Puppeteer and Chrome extension testing
 */

const puppeteer = require('puppeteer');
const path = require('path');

// Global test configuration
global.E2E_CONFIG = {
  extensionPath: path.resolve(__dirname, '..', '..'),
  testTimeout: 30000,
  headless: false, // Set to true for CI/CD
  slowMo: 50 // Slow down operations for debugging
};

// Global browser and page instances
let browser, page;

beforeAll(async () => {
  // Launch browser with extension
  browser = await puppeteer.launch({
    headless: global.E2E_CONFIG.headless,
    slowMo: global.E2E_CONFIG.slowMo,
    args: [
      `--disable-extensions-except=${global.E2E_CONFIG.extensionPath}`,
      `--load-extension=${global.E2E_CONFIG.extensionPath}`,
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  // Create new page
  page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Make page and browser available globally
  global.browser = browser;
  global.page = page;
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

// Helper functions for extension testing
global.extensionHelpers = {
  // Open extension popup
  async openExtension() {
    const extensionId = await this.getExtensionId();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await page.waitForSelector('.popup-container', { timeout: 5000 });
  },

  // Get extension ID
  async getExtensionId() {
    const targets = await browser.targets();
    const extensionTarget = targets.find(target => 
      target.type() === 'background_page' && 
      target.url().includes('session-shepherd')
    );
    
    if (!extensionTarget) {
      throw new Error('Extension not found. Make sure it\'s loaded correctly.');
    }
    
    const url = extensionTarget.url();
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    return match ? match[1] : null;
  },

  // Create test tabs
  async createTestTabs() {
    const testUrls = [
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://developer.mozilla.org'
    ];
    
    for (const url of testUrls) {
      await page.goto(url, { waitUntil: 'networkidle0' });
    }
  },

  // Wait for element and click
  async clickElement(selector, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
    await page.click(selector);
  },

  // Wait for element and type
  async typeInElement(selector, text, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
    await page.type(selector, text);
  },

  // Wait for element and get text
  async getElementText(selector, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
    return await page.$eval(selector, el => el.textContent);
  },

  // Check if element exists
  async elementExists(selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  },

  // Take screenshot for debugging
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ 
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }
};
