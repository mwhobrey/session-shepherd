/**
 * Jest setup file for Session Shepherd tests
 * Configures global test environment and mocks
 */

// Mock Chrome APIs
global.chrome = {
  tabs: {
    query: jest.fn(),
    remove: jest.fn(),
    create: jest.fn()
  },
  windows: {
    create: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    getPlatformInfo: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Mock DOM methods that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock Material Icons
// Mock Material Icons - commented out for now
// const mockMaterialIcons = {
//   add: 'add',
//   folder: 'folder',
//   save: 'save',
//   save_alt: 'save_alt',
//   open_in_new: 'open_in_new',
//   delete: 'delete'
// };

// Mock Google Fonts
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('/* Mock font CSS */')
  })
);

// Global test utilities
global.testUtils = {
  createMockTab: (id, title, url, favIconUrl = null) => ({
    id,
    title,
    url,
    favIconUrl,
    active: false,
    pinned: false,
    windowId: 1
  }),
  
  createMockSession: (id, name, tabs) => ({
    id,
    name,
    tabs,
    createdAt: new Date().toISOString()
  }),
  
  createMockWindow: (id, tabs = []) => ({
    id,
    tabs,
    focused: true,
    type: 'normal'
  })
};

// Console suppression for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
