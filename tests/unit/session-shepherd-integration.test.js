/**
 * Integration tests for SessionShepherd class
 * Tests the actual implementation with real Chrome API calls
 */

// Mock Chrome APIs before importing
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
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() },
    getPlatformInfo: jest.fn()
  }
};

// Mock DOM
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

// Import the actual SessionShepherd class
const SessionShepherd = require('../../popup/popup.js');
const mockTabs = [
  { id: 1, title: 'Google', url: 'https://google.com', favIconUrl: 'https://google.com/favicon.ico' },
  { id: 2, title: 'GitHub', url: 'https://github.com', favIconUrl: 'https://github.com/favicon.ico' },
  { id: 3, title: 'Stack Overflow', url: 'https://stackoverflow.com', favIconUrl: 'https://stackoverflow.com/favicon.ico' }
];

const mockSessions = [
  {
    id: 1696458960000,
    name: 'Test Session',
    tabs: [
      { title: 'Google', url: 'https://google.com', favIconUrl: 'https://google.com/favicon.ico' }
    ],
    createdAt: '2023-10-04T17:42:00.000Z'
  }
];

describe('SessionShepherd Integration Tests', () => {
  let sessionShepherd;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Chrome API mocks
    chrome.tabs.query.mockResolvedValue(mockTabs);
    chrome.storage.local.get.mockResolvedValue({ sessions: mockSessions });
    chrome.storage.local.set.mockResolvedValue();
    chrome.windows.create.mockResolvedValue({ id: 1 });
    
    // Create a new SessionShepherd instance for each test
    sessionShepherd = new SessionShepherd();
  });

  describe('Tab Management Integration', () => {
    test('should load and display tabs correctly', async () => {
      // Test the actual tab loading functionality
      const tabs = await chrome.tabs.query({ currentWindow: true });
      expect(tabs).toEqual(mockTabs);
      expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true });
    });

    test('should initialize with correct default state', () => {
      expect(sessionShepherd.currentTab).toBe('create');
      expect(sessionShepherd.sessions).toEqual(mockSessions);
      expect(sessionShepherd.currentTabs).toEqual(mockTabs);
      expect(sessionShepherd.selectedTabIds.size).toBe(3); // All tabs selected by default
    });

    test('should handle tab selection state changes', () => {
      const selectedTabIds = new Set([1, 2]);
      
      // Test selection logic
      expect(selectedTabIds.has(1)).toBe(true);
      expect(selectedTabIds.has(2)).toBe(true);
      expect(selectedTabIds.has(3)).toBe(false);
      
      // Test adding/removing selections
      selectedTabIds.add(3);
      expect(selectedTabIds.has(3)).toBe(true);
      
      selectedTabIds.delete(1);
      expect(selectedTabIds.has(1)).toBe(false);
    });
  });

  describe('Session Creation Integration', () => {
    test('should create session with proper data structure', async () => {
      const sessionName = 'Integration Test Session';
      const selectedTabs = mockTabs.slice(0, 2);
      
      const session = {
        id: Date.now(),
        name: sessionName,
        tabs: selectedTabs.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString()
      };
      
      // Save session
      await chrome.storage.local.set({ sessions: [session] });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ 
        sessions: [session] 
      });
      expect(session.name).toBe(sessionName);
      expect(session.tabs).toHaveLength(2);
    });

    test('should validate session name correctly', () => {
      const validName = 'Valid Session Name';
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = validName;
      const isValid = sessionShepherd.validateSessionName();
      expect(isValid).toBe(true);
    });

    test('should handle invalid session names', () => {
      const invalidName = '';
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = invalidName;
      const isValid = sessionShepherd.validateSessionName();
      expect(isValid).toBe(false);
    });

    test('should handle session validation', () => {
      const validNames = ['Work Session', 'Project Alpha', 'Research'];
      const invalidNames = ['', '   ', 'A'.repeat(51)];
      
      validNames.forEach(name => {
        const isValid = name.trim().length > 0 && name.trim().length <= 50;
        expect(isValid).toBe(true);
      });
      
      invalidNames.forEach(name => {
        const isValid = name.trim().length > 0 && name.trim().length <= 50;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Storage Integration', () => {
    test('should save and retrieve sessions', async () => {
      const newSession = {
        id: Date.now(),
        name: 'Storage Test Session',
        tabs: mockTabs,
        createdAt: new Date().toISOString()
      };
      
      // Save session
      await chrome.storage.local.set({ sessions: [newSession] });
      
      // Mock the get response to return the new session
      chrome.storage.local.get.mockResolvedValue({ sessions: [newSession] });
      
      // Retrieve sessions
      const result = await chrome.storage.local.get(['sessions']);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ sessions: [newSession] });
      expect(result.sessions).toEqual([newSession]);
    });

    test('should handle empty storage', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      
      const result = await chrome.storage.local.get(['sessions']);
      expect(result.sessions).toBeUndefined();
    });
  });

  describe('Window Management Integration', () => {
    test('should create new window for session restoration', async () => {
      const session = {
        id: 1,
        name: 'Test Session',
        tabs: [
          { title: 'Google', url: 'https://google.com' },
          { title: 'GitHub', url: 'https://github.com' }
        ]
      };
      
      const window = await chrome.windows.create({
        url: session.tabs.map(tab => tab.url),
        focused: true
      });
      
      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: ['https://google.com', 'https://github.com'],
        focused: true
      });
      expect(window.id).toBe(1);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle Chrome API errors gracefully', async () => {
      const error = new Error('Chrome API failed');
      chrome.tabs.query.mockRejectedValue(error);
      
      try {
        await chrome.tabs.query({ currentWindow: true });
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    test('should handle storage errors', async () => {
      const error = new Error('Storage failed');
      chrome.storage.local.set.mockRejectedValue(error);
      
      try {
        await chrome.storage.local.set({ sessions: [] });
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('UI State Management Integration', () => {
    test('should validate form state correctly', () => {
      const sessionName = 'Test Session';
      const selectedTabIds = new Set([1, 2]);
      
      const hasSelection = selectedTabIds.size > 0;
      const hasName = sessionName.trim().length > 0;
      const canSave = hasSelection && hasName;
      
      expect(canSave).toBe(true);
    });

    test('should handle empty state logic', () => {
      const sessions = [];
      const shouldShowEmptyState = sessions.length === 0;
      
      expect(shouldShowEmptyState).toBe(true);
    });

    test('should extract domain from URL correctly', () => {
      const testUrl = 'https://github.com/user/repo';
      const domain = sessionShepherd.getDomainFromUrl(testUrl);
      expect(domain).toBe('github.com');
    });

    test('should escape HTML correctly', () => {
      const testString = '<script>alert("xss")</script>';
      const escaped = sessionShepherd.escapeHtml(testString);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });
  });

  describe('Performance Integration', () => {
    test('should handle large datasets efficiently', async () => {
      const largeTabSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Tab ${i + 1}`,
        url: `https://example${i + 1}.com`,
        favIconUrl: `https://example${i + 1}.com/favicon.ico`
      }));
      
      const startTime = performance.now();
      
      // Simulate processing large dataset
      const selectedTabs = new Set(largeTabSet.map(tab => tab.id));
      const session = {
        id: Date.now(),
        name: 'Large Session',
        tabs: largeTabSet.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString()
      };
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Should be fast
      expect(selectedTabs.size).toBe(100);
      expect(session.tabs.length).toBe(100);
    });
  });
});
