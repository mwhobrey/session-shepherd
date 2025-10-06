/**
 * Test utility functions for Session Shepherd
 * Provides common testing helpers and assertions
 */

const { mockTabs, mockStorageData } = require('../fixtures/mock-data');

class TestHelpers {
  /**
   * Create a mock Chrome API with customizable responses
   */
  static createMockChromeAPI(overrides = {}) {
    const defaultAPI = {
      tabs: {
        query: jest.fn().mockResolvedValue(mockTabs),
        remove: jest.fn().mockResolvedValue(),
        create: jest.fn().mockResolvedValue({ id: 999 })
      },
      windows: {
        create: jest.fn().mockResolvedValue({ id: 2 })
      },
      storage: {
        local: {
          get: jest.fn().mockResolvedValue(mockStorageData),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          clear: jest.fn().mockResolvedValue()
        }
      },
      runtime: {
        onInstalled: { addListener: jest.fn() },
        onStartup: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() },
        getPlatformInfo: jest.fn().mockResolvedValue({ os: 'win' })
      }
    };

    return this.mergeDeep(defaultAPI, overrides);
  }

  /**
   * Create a mock DOM environment for testing
   */
  static createMockDOM() {
    document.body.innerHTML = `
      <div class="popup-container">
        <div class="header">
          <div class="tab-buttons">
            <button id="create-tab" class="tab-button active" data-tab="create">Create</button>
            <button id="sessions-tab" class="tab-button" data-tab="sessions">Sessions</button>
          </div>
        </div>
        <div id="create-content" class="tab-content active">
          <input id="session-name" type="text" placeholder="Enter session name...">
          <div id="tabs-list" class="tabs-list"></div>
          <button id="select-all" class="text-button">Select All</button>
          <button id="select-none" class="text-button">Select None</button>
          <button id="save-only" class="button outlined">Save Only</button>
          <button id="save-close" class="button filled primary">Save & Close</button>
        </div>
        <div id="sessions-content" class="tab-content">
          <div id="sessions-list" class="sessions-list"></div>
          <div id="empty-state" class="empty-state" style="display: none;">
            <button id="go-to-create" class="button filled">Create Your First Session</button>
          </div>
        </div>
        <div id="confirmation-dialog" class="dialog-overlay">
          <button id="cancel-delete" class="button outlined">Cancel</button>
          <button id="confirm-delete" class="button filled danger">Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Simulate user interactions
   */
  static async simulateUserInteraction(type, selector, value = null) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    switch (type) {
    case 'click':
      element.click();
      break;
    case 'type':
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      break;
    case 'check':
      if (element.type === 'checkbox') {
        element.checked = true;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'uncheck':
      if (element.type === 'checkbox') {
        element.checked = false;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    default:
      throw new Error(`Unknown interaction type: ${type}`);
    }
  }

  /**
   * Wait for element to appear
   */
  static async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element not found within timeout: ${selector}`);
  }

  /**
   * Assert session data structure
   */
  static assertSessionStructure(session) {
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('name');
    expect(session).toHaveProperty('tabs');
    expect(session).toHaveProperty('createdAt');
    
    expect(typeof session.id).toBe('number');
    expect(typeof session.name).toBe('string');
    expect(Array.isArray(session.tabs)).toBe(true);
    expect(typeof session.createdAt).toBe('string');
    
    session.tabs.forEach(tab => {
      expect(tab).toHaveProperty('title');
      expect(tab).toHaveProperty('url');
      expect(typeof tab.title).toBe('string');
      expect(typeof tab.url).toBe('string');
    });
  }

  /**
   * Assert tab data structure
   */
  static assertTabStructure(tab) {
    expect(tab).toHaveProperty('id');
    expect(tab).toHaveProperty('title');
    expect(tab).toHaveProperty('url');
    
    expect(typeof tab.id).toBe('number');
    expect(typeof tab.title).toBe('string');
    expect(typeof tab.url).toBe('string');
  }

  /**
   * Create test session with specific properties
   */
  static createTestSession(overrides = {}) {
    const defaultSession = {
      id: Date.now(),
      name: 'Test Session',
      tabs: [
        {
          title: 'Google',
          url: 'https://google.com',
          favIconUrl: 'https://google.com/favicon.ico'
        }
      ],
      createdAt: new Date().toISOString()
    };

    return { ...defaultSession, ...overrides };
  }

  /**
   * Create test tab with specific properties
   */
  static createTestTab(overrides = {}) {
    const defaultTab = {
      id: Date.now(),
      title: 'Test Tab',
      url: 'https://example.com',
      favIconUrl: 'https://example.com/favicon.ico',
      active: false,
      pinned: false,
      windowId: 1
    };

    return { ...defaultTab, ...overrides };
  }

  /**
   * Mock Chrome storage with specific data
   */
  static mockChromeStorage(data = {}) {
    const defaultData = { sessions: [], lastTab: 'create' };
    const mergedData = { ...defaultData, ...data };
    
    chrome.storage.local.get.mockImplementation((keys) => {
      const result = {};
      keys.forEach(key => {
        if (mergedData.hasOwnProperty(key)) {
          result[key] = mergedData[key];
        }
      });
      return Promise.resolve(result);
    });
  }

  /**
   * Assert Chrome API was called with specific parameters
   */
  static assertChromeAPICall(api, method, expectedParams) {
    expect(api[method]).toHaveBeenCalledWith(expectedParams);
  }

  /**
   * Assert Chrome API was called with specific parameters (partial match)
   */
  static assertChromeAPICallPartial(api, method, expectedParams) {
    const calls = api[method].mock.calls;
    const lastCall = calls[calls.length - 1];
    
    Object.keys(expectedParams).forEach(key => {
      expect(lastCall[0][key]).toEqual(expectedParams[key]);
    });
  }

  /**
   * Deep merge objects
   */
  static mergeDeep(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Create performance test data
   */
  static createPerformanceTestData(size = 100) {
    return {
      sessions: Array.from({ length: size }, (_, i) => ({
        id: Date.now() + i,
        name: `Performance Test Session ${i + 1}`,
        tabs: [
          {
            title: `Tab ${i + 1}`,
            url: `https://example${i + 1}.com`,
            favIconUrl: `https://example${i + 1}.com/favicon.ico`
          }
        ],
        createdAt: new Date().toISOString()
      })),
      tabs: Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        title: `Performance Test Tab ${i + 1}`,
        url: `https://example${i + 1}.com`,
        favIconUrl: `https://example${i + 1}.com/favicon.ico`,
        active: i === 0,
        pinned: false,
        windowId: 1
      }))
    };
  }

  /**
   * Measure execution time
   */
  static async measureExecutionTime(fn) {
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Assert performance threshold
   */
  static assertPerformanceThreshold(executionTime, threshold) {
    expect(executionTime).toBeLessThan(threshold);
  }
}

module.exports = TestHelpers;
