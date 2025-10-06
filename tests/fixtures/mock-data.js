/**
 * Mock data and fixtures for Session Shepherd tests
 * Provides consistent test data across unit and E2E tests
 */

const mockTabs = [
  {
    id: 1,
    title: 'Google',
    url: 'https://google.com',
    favIconUrl: 'https://google.com/favicon.ico',
    active: true,
    pinned: false,
    windowId: 1
  },
  {
    id: 2,
    title: 'GitHub',
    url: 'https://github.com',
    favIconUrl: 'https://github.com/favicon.ico',
    active: false,
    pinned: false,
    windowId: 1
  },
  {
    id: 3,
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    favIconUrl: 'https://stackoverflow.com/favicon.ico',
    active: false,
    pinned: false,
    windowId: 1
  },
  {
    id: 4,
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    favIconUrl: 'https://developer.mozilla.org/favicon.ico',
    active: false,
    pinned: false,
    windowId: 1
  },
  {
    id: 5,
    title: 'Chrome DevTools',
    url: 'chrome://devtools/',
    favIconUrl: null,
    active: false,
    pinned: false,
    windowId: 1
  }
];

const mockSessions = [
  {
    id: 1696458960000,
    name: 'Work Session',
    tabs: [
      {
        title: 'Google',
        url: 'https://google.com',
        favIconUrl: 'https://google.com/favicon.ico'
      },
      {
        title: 'GitHub',
        url: 'https://github.com',
        favIconUrl: 'https://github.com/favicon.ico'
      }
    ],
    createdAt: '2023-10-04T17:42:00.000Z'
  },
  {
    id: 1696458961000,
    name: 'Research Session',
    tabs: [
      {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        favIconUrl: 'https://stackoverflow.com/favicon.ico'
      },
      {
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        favIconUrl: 'https://developer.mozilla.org/favicon.ico'
      }
    ],
    createdAt: '2023-10-04T17:43:00.000Z'
  }
];

const mockWindows = [
  {
    id: 1,
    tabs: mockTabs,
    focused: true,
    type: 'normal'
  }
];

const mockStorageData = {
  sessions: mockSessions,
  lastTab: 'create'
};

const mockChromeAPIResponses = {
  tabs: {
    query: mockTabs,
    remove: Promise.resolve(),
    create: Promise.resolve({ id: 999 })
  },
  windows: {
    create: Promise.resolve({ id: 2 })
  },
  storage: {
    local: {
      get: Promise.resolve(mockStorageData),
      set: Promise.resolve(),
      remove: Promise.resolve(),
      clear: Promise.resolve()
    }
  }
};

const testUrls = [
  'https://google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://developer.mozilla.org',
  'https://jestjs.io',
  'https://puppeteer.dev'
];

const invalidSessionNames = [
  '', // Empty
  '   ', // Whitespace only
  'A'.repeat(51), // Too long
  null,
  undefined
];

const validSessionNames = [
  'Work Session',
  'Project Alpha',
  'Research',
  'Meeting Prep',
  'Learning JavaScript',
  'A'.repeat(50) // Exactly 50 characters
];

const mockErrorResponses = {
  storageError: new Error('Storage operation failed'),
  tabsError: new Error('Tabs API failed'),
  windowsError: new Error('Windows API failed'),
  networkError: new Error('Network request failed')
};

// Test scenarios for different workflows
const testScenarios = {
  emptyState: {
    sessions: [],
    tabs: mockTabs,
    expectedUI: 'empty-state'
  },
  singleSession: {
    sessions: [mockSessions[0]],
    tabs: mockTabs,
    expectedUI: 'session-cards'
  },
  multipleSessions: {
    sessions: mockSessions,
    tabs: mockTabs,
    expectedUI: 'session-cards'
  },
  noTabs: {
    sessions: mockSessions,
    tabs: [],
    expectedUI: 'no-tabs-message'
  },
  manyTabs: {
    sessions: mockSessions,
    tabs: [...mockTabs, ...mockTabs, ...mockTabs], // 15 tabs
    expectedUI: 'scrollable-tab-list'
  }
};

// Performance test data
const performanceTestData = {
  largeSession: {
    id: Date.now(),
    name: 'Large Session',
    tabs: Array.from({ length: 50 }, (_, i) => ({
      title: `Tab ${i + 1}`,
      url: `https://example${i + 1}.com`,
      favIconUrl: `https://example${i + 1}.com/favicon.ico`
    })),
    createdAt: new Date().toISOString()
  },
  manySessions: Array.from({ length: 100 }, (_, i) => ({
    id: Date.now() + i,
    name: `Session ${i + 1}`,
    tabs: [
      {
        title: 'Tab 1',
        url: `https://example${i + 1}.com`,
        favIconUrl: `https://example${i + 1}.com/favicon.ico`
      }
    ],
    createdAt: new Date().toISOString()
  }))
};

module.exports = {
  mockTabs,
  mockSessions,
  mockWindows,
  mockStorageData,
  mockChromeAPIResponses,
  testUrls,
  invalidSessionNames,
  validSessionNames,
  mockErrorResponses,
  testScenarios,
  performanceTestData
};
