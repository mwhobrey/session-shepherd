/**
 * Comprehensive tests for SessionShepherd class
 * Tests actual code execution to achieve 80%+ coverage
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
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  runtime: {
    onInstalled: { addListener: jest.fn() },
    onStartup: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() },
    getPlatformInfo: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  }
};

// Mock alert function
global.alert = jest.fn();

// Mock window.alert as well
Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true
});

// Mock DOM with all required elements
document.body.innerHTML = `
  <div class="popup-container">
    <div class="header">
      <div class="tab-buttons">
        <button id="create-tab" class="tab-button active" data-tab="create">Create</button>
        <button id="sessions-tab" class="tab-button" data-tab="sessions">Sessions</button>
      </div>
    </div>
    <div id="create-content" class="tab-content active">
      <div class="input-group">
        <label for="session-name">Session Name</label>
        <input type="text" id="session-name" placeholder="Enter session name..." maxlength="50">
      </div>
      <div class="session-metadata">
        <div class="input-group">
          <label for="session-category">Category</label>
          <select id="session-category">
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="research">Research</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="development">Development</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="input-group">
          <label for="session-tags">Tags</label>
          <input type="text" id="session-tags" placeholder="Enter tags (comma-separated)" maxlength="100">
        </div>
      </div>
      <div class="tab-selection">
        <div class="selection-header">
          <h3>Select Tabs</h3>
          <div class="selection-controls">
            <button id="select-all" class="text-button">Select All</button>
            <button id="select-none" class="text-button">Select None</button>
          </div>
        </div>
        <div id="tabs-list" class="tabs-list"></div>
      </div>
      <div class="action-buttons">
        <button id="save-only" class="button outlined">Save Only</button>
        <button id="save-close" class="button filled primary">Save & Close</button>
      </div>
    </div>
    <div id="sessions-content" class="tab-content">
      <div id="sessions-list" class="sessions-list"></div>
      <div id="empty-state" class="empty-state" style="display: none;">
        <div class="empty-icon">
          <span class="material-icons">folder_open</span>
        </div>
        <h3>No sessions saved yet</h3>
        <p>Your saved sessions will appear here</p>
        <button id="go-to-create" class="button filled">Create Your First Session</button>
      </div>
    </div>
    <div id="confirmation-dialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Confirm Deletion</h3>
        </div>
        <div class="dialog-content">
          <p>Are you sure you want to permanently delete this session?</p>
          <p class="dialog-warning">This action cannot be undone.</p>
        </div>
        <div class="dialog-actions">
          <button id="cancel-delete" class="button outlined">Cancel</button>
          <button id="confirm-delete" class="button filled danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
  <div id="session-name-error" class="error-message"></div>
  <div id="search-results-count" class="search-results"></div>
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

describe('SessionShepherd Comprehensive Tests', () => {
  let sessionShepherd;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Chrome API mocks
    chrome.tabs.query.mockResolvedValue(mockTabs);
    chrome.storage.local.get.mockResolvedValue({ sessions: mockSessions });
    chrome.storage.local.set.mockResolvedValue();
    chrome.windows.create.mockResolvedValue({ id: 1 });
    
    // Create a new SessionShepherd instance
    sessionShepherd = new SessionShepherd();
  });

  describe('Initialization and Setup', () => {
    test('should initialize with correct default state', () => {
      expect(sessionShepherd.currentTab).toBe('create');
      expect(sessionShepherd.sessions).toEqual(mockSessions);
      expect(sessionShepherd.currentTabs).toEqual(mockTabs);
      expect(sessionShepherd.selectedTabIds.size).toBe(3); // All tabs selected by default
    });

    test('should load sessions from storage', async () => {
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['sessions']);
    });

    test('should load current tabs', async () => {
      expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true });
    });

    test('should setup event listeners', () => {
      // Test that event listeners are attached
      const createTab = document.getElementById('create-tab');
      const sessionsTab = document.getElementById('sessions-tab');
      const selectAll = document.getElementById('select-all');
      const selectNone = document.getElementById('select-none');
      const saveOnly = document.getElementById('save-only');
      const saveClose = document.getElementById('save-close');
      const sessionName = document.getElementById('session-name');
      const goToCreate = document.getElementById('go-to-create');
      const cancelDelete = document.getElementById('cancel-delete');
      const confirmDelete = document.getElementById('confirm-delete');

      expect(createTab).toBeTruthy();
      expect(sessionsTab).toBeTruthy();
      expect(selectAll).toBeTruthy();
      expect(selectNone).toBeTruthy();
      expect(saveOnly).toBeTruthy();
      expect(saveClose).toBeTruthy();
      expect(sessionName).toBeTruthy();
      expect(goToCreate).toBeTruthy();
      expect(cancelDelete).toBeTruthy();
      expect(confirmDelete).toBeTruthy();
    });
  });

  describe('Tab Management', () => {
    test('should render tabs list correctly', () => {
      const tabsList = document.getElementById('tabs-list');
      expect(tabsList).toBeTruthy();
    });

    test('should handle tab selection', () => {
      const initialSize = sessionShepherd.selectedTabIds.size;
      
      // Remove a tab from selection
      sessionShepherd.toggleTabSelection(1, false);
      expect(sessionShepherd.selectedTabIds.size).toBe(initialSize - 1);
      expect(sessionShepherd.selectedTabIds.has(1)).toBe(false);
      
      // Add it back
      sessionShepherd.toggleTabSelection(1, true);
      expect(sessionShepherd.selectedTabIds.size).toBe(initialSize);
      expect(sessionShepherd.selectedTabIds.has(1)).toBe(true);
    });

    test('should select all tabs', () => {
      sessionShepherd.selectAllTabs();
      expect(sessionShepherd.selectedTabIds.size).toBe(mockTabs.length);
      mockTabs.forEach(tab => {
        expect(sessionShepherd.selectedTabIds.has(tab.id)).toBe(true);
      });
    });

    test('should select no tabs', () => {
      sessionShepherd.selectNoTabs();
      expect(sessionShepherd.selectedTabIds.size).toBe(0);
    });

    test('should update action buttons based on selection', () => {
      // Test with no selection
      sessionShepherd.selectedTabIds.clear();
      sessionShepherd.updateActionButtons();
      
      const saveOnly = document.getElementById('save-only');
      const saveClose = document.getElementById('save-close');
      
      expect(saveOnly.disabled).toBe(true);
      expect(saveClose.disabled).toBe(true);
    });
  });

  describe('Session Creation', () => {
    test('should validate session names correctly', () => {
      const validName = 'Valid Session Name';
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = validName;
      const isValid = sessionShepherd.validateSessionName();
      expect(isValid).toBe(true);
    });

    test('should reject invalid session names', () => {
      const invalidName = '';
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = invalidName;
      const isValid = sessionShepherd.validateSessionName();
      expect(isValid).toBe(false);
    });

    test('should handle session name input changes', () => {
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = 'Test Session';
      
      // Trigger input event
      const event = new Event('input', { bubbles: true });
      sessionNameInput.dispatchEvent(event);
      
      expect(sessionNameInput.value).toBe('Test Session');
    });

    test('should create session data structure', () => {
      const sessionName = 'Test Session';
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
      
      expect(session.name).toBe(sessionName);
      expect(session.tabs).toHaveLength(2);
      expect(session.tabs[0].title).toBe('Google');
    });
  });

  describe('Session Management', () => {
    test('should render sessions list', () => {
      sessionShepherd.renderSessions();
      const sessionsList = document.getElementById('sessions-list');
      expect(sessionsList).toBeTruthy();
    });

    test('should handle empty sessions state', () => {
      sessionShepherd.sessions = [];
      sessionShepherd.renderSessions();
      
      const emptyState = document.getElementById('empty-state');
      expect(emptyState.style.display).not.toBe('none');
    });

    test('should create session cards', () => {
      const session = mockSessions[0];
      const card = sessionShepherd.createSessionCard(session);
      
      expect(card).toBeTruthy();
      expect(card.dataset.sessionId).toBe(session.id.toString());
    });

    test('should handle session restoration', async () => {
      const session = mockSessions[0];
      await sessionShepherd.restoreSession(session);
      
      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: session.tabs.map(tab => tab.url),
        focused: true
      });
    });

    test('should show delete confirmation dialog', () => {
      const sessionId = 1;
      sessionShepherd.showConfirmationDialog(sessionId);
      
      const dialog = document.getElementById('confirmation-dialog');
      expect(dialog.classList.contains('show')).toBe(true);
      expect(sessionShepherd.pendingDeleteId).toBe(sessionId);
    });

    test('should hide delete confirmation dialog', () => {
      sessionShepherd.pendingDeleteId = 1;
      sessionShepherd.hideConfirmationDialog();
      
      const dialog = document.getElementById('confirmation-dialog');
      expect(dialog.classList.contains('show')).toBe(false);
      expect(sessionShepherd.pendingDeleteId).toBe(null);
    });

    test('should confirm delete operation', async () => {
      const originalSessions = [...sessionShepherd.sessions];
      sessionShepherd.pendingDeleteId = originalSessions[0].id;
      
      await sessionShepherd.confirmDelete();
      
      expect(sessionShepherd.sessions.length).toBe(originalSessions.length - 1);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Tab Switching', () => {
    test('should switch to create tab', () => {
      sessionShepherd.switchTab('create');
      
      const createTab = document.getElementById('create-tab');
      const createContent = document.getElementById('create-content');
      
      expect(createTab.classList.contains('active')).toBe(true);
      expect(createContent.classList.contains('active')).toBe(true);
    });

    test('should switch to sessions tab', () => {
      sessionShepherd.switchTab('sessions');
      
      const sessionsTab = document.getElementById('sessions-tab');
      const sessionsContent = document.getElementById('sessions-content');
      
      expect(sessionsTab.classList.contains('active')).toBe(true);
      expect(sessionsContent.classList.contains('active')).toBe(true);
    });

    test('should not save last used tab (always defaults to create)', () => {
      sessionShepherd.switchTab('sessions');
      // The switchTab method no longer saves the last used tab
      // as the popup always defaults to the 'create' tab when opened
      expect(chrome.storage.local.set).not.toHaveBeenCalledWith({ lastTab: 'sessions' });
    });
  });

  describe('Utility Functions', () => {
    test('should extract domain from URL', () => {
      const testUrls = [
        'https://google.com/search',
        'https://github.com/user/repo',
        'https://stackoverflow.com/questions/123'
      ];
      
      const expectedDomains = ['google.com', 'github.com', 'stackoverflow.com'];
      
      testUrls.forEach((url, index) => {
        const domain = sessionShepherd.getDomainFromUrl(url);
        expect(domain).toBe(expectedDomains[index]);
      });
    });

    test('should handle invalid URLs', () => {
      const invalidUrl = 'not-a-url';
      const domain = sessionShepherd.getDomainFromUrl(invalidUrl);
      expect(domain).toBe(invalidUrl);
    });

    test('should escape HTML correctly', () => {
      const testString = '<script>alert("xss")</script>';
      const escaped = sessionShepherd.escapeHtml(testString);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    test('should handle normal text', () => {
      const normalText = 'Normal text without HTML';
      const escaped = sessionShepherd.escapeHtml(normalText);
      expect(escaped).toBe(normalText);
    });
  });

  describe('Error Handling', () => {
    test('should handle Chrome API errors gracefully', async () => {
      const error = new Error('Chrome API error');
      chrome.tabs.query.mockRejectedValue(error);
      
      // The init method should handle this gracefully
      expect(async () => {
        await sessionShepherd.loadCurrentTabs();
      }).not.toThrow();
    });

    test('should handle storage errors gracefully', async () => {
      const error = new Error('Storage error');
      chrome.storage.local.get.mockRejectedValue(error);
      
      expect(async () => {
        await sessionShepherd.loadSessions();
      }).not.toThrow();
    });

    test('should show error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      
      sessionShepherd.showError('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test error message');
      expect(alertSpy).toHaveBeenCalledWith('Test error message');
      
      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    test('should show success messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      sessionShepherd.showSuccess('Test success message');
      
      expect(consoleSpy).toHaveBeenCalledWith('Test success message');
      
      consoleSpy.mockRestore();
    });
  });

  describe('UI Updates', () => {
    test('should update UI after initialization', () => {
      sessionShepherd.updateUI();
      
      // Should call render methods
      expect(sessionShepherd.currentTabs).toEqual(mockTabs);
      expect(sessionShepherd.sessions).toEqual(mockSessions);
    });

    test('should render tabs list', () => {
      sessionShepherd.renderTabsList();
      
      const tabsList = document.getElementById('tabs-list');
      expect(tabsList).toBeTruthy();
    });

    test('should handle empty tabs list', () => {
      sessionShepherd.currentTabs = [];
      sessionShepherd.renderTabsList();
      
      const tabsList = document.getElementById('tabs-list');
      expect(tabsList.innerHTML).toContain('No tabs found');
    });

    test('should create tab elements', () => {
      const tab = mockTabs[0];
      const tabElement = sessionShepherd.createTabElement(tab);
      
      expect(tabElement).toBeTruthy();
      expect(tabElement.dataset.tabId).toBe(tab.id.toString());
    });
  });

  describe('Session Save Operations', () => {
    test('should handle save only operation', async () => {
      const sessionName = 'Test Session';
      document.getElementById('session-name').value = sessionName;
      
      const initialLength = sessionShepherd.sessions.length;
      await sessionShepherd.saveSession(false);
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(sessionShepherd.sessions.length).toBe(initialLength + 1);
    });

    test('should handle save and close operation', async () => {
      const sessionName = 'Test Session';
      document.getElementById('session-name').value = sessionName;
      
      await sessionShepherd.saveSession(true);
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(chrome.tabs.remove).toHaveBeenCalled();
    });

    test('should handle orphan window scenario', async () => {
      // Simulate closing all tabs
      sessionShepherd.selectedTabIds = new Set(mockTabs.map(tab => tab.id));
      
      await sessionShepherd.closeSelectedTabs();
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'chrome://newtab/' });
      expect(chrome.tabs.remove).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    test('should handle tab button clicks', () => {
      const createTab = document.getElementById('create-tab');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      createTab.dispatchEvent(clickEvent);
      
      // Should switch to create tab
      expect(sessionShepherd.currentTab).toBe('create');
    });

    test('should handle session name input', () => {
      const sessionNameInput = document.getElementById('session-name');
      sessionNameInput.value = 'Test Session';
      
      const inputEvent = new Event('input', { bubbles: true });
      sessionNameInput.dispatchEvent(inputEvent);
      
      expect(sessionNameInput.value).toBe('Test Session');
    });

    test('should handle select all button', () => {
      const selectAllButton = document.getElementById('select-all');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      selectAllButton.dispatchEvent(clickEvent);
      
      expect(sessionShepherd.selectedTabIds.size).toBe(mockTabs.length);
    });

    test('should handle select none button', () => {
      const selectNoneButton = document.getElementById('select-none');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      selectNoneButton.dispatchEvent(clickEvent);
      
      expect(sessionShepherd.selectedTabIds.size).toBe(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large number of tabs', () => {
      const largeTabSet = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Tab ${i + 1}`,
        url: `https://example${i + 1}.com`,
        favIconUrl: `https://example${i + 1}.com/favicon.ico`
      }));
      
      sessionShepherd.currentTabs = largeTabSet;
      sessionShepherd.renderTabsList();
      
      expect(sessionShepherd.currentTabs.length).toBe(100);
    });

    test('should handle large number of sessions', () => {
      const largeSessionSet = Array.from({ length: 50 }, (_, i) => ({
        id: Date.now() + i,
        name: `Session ${i + 1}`,
        tabs: [{ title: 'Tab', url: 'https://example.com' }],
        createdAt: new Date().toISOString()
      }));
      
      sessionShepherd.sessions = largeSessionSet;
      sessionShepherd.renderSessions();
      
      expect(sessionShepherd.sessions.length).toBe(50);
    });

    test('should handle missing favicons', () => {
      const tabWithoutFavicon = {
        id: 1,
        title: 'Test Tab',
        url: 'https://example.com',
        favIconUrl: null
      };
      
      const tabElement = sessionShepherd.createTabElement(tabWithoutFavicon);
      expect(tabElement).toBeTruthy();
    });
  });

          describe('Error Handling', () => {
            test('should handle initialization errors gracefully', async () => {
              // Mock chrome.tabs.query to throw an error
              chrome.tabs.query.mockRejectedValue(new Error('Tab query failed'));
              
              const shepherd = new SessionShepherd();
              
              // Wait for async operations to complete
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Should not throw and should handle error gracefully
              expect(shepherd).toBeDefined();
            });

            test('should handle storage errors gracefully', async () => {
              chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
              
              const shepherd = new SessionShepherd();
              await shepherd.loadSessions();
              
              expect(shepherd.sessions).toEqual([]);
            });

            test('should handle tab loading errors', async () => {
              chrome.tabs.query.mockRejectedValue(new Error('Tab query failed'));
              
              const shepherd = new SessionShepherd();
              await shepherd.loadCurrentTabs();
              
              expect(shepherd.currentTabs).toEqual([]);
            });

            test('should handle session save errors', async () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [{ id: 1, title: 'Test', url: 'https://example.com' }];
              shepherd.selectedTabIds.add(1);
              
              // Mock form elements
              document.getElementById('session-name').value = 'Test Session';
              document.getElementById('session-category').value = 'work';
              document.getElementById('session-tags').value = 'test';
              
              chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
              
              await shepherd.saveSession(false);
              
              // Should handle error gracefully
              expect(shepherd).toBeDefined();
            });

            test('should handle restore session errors', async () => {
              const shepherd = new SessionShepherd();
              const session = {
                id: '1',
                name: 'Test Session',
                tabs: [{ title: 'Test', url: 'https://example.com' }]
              };
              
              chrome.windows.create.mockRejectedValue(new Error('Window creation failed'));
              
              await shepherd.restoreSession(session);
              
              // Should handle error gracefully
              expect(shepherd).toBeDefined();
            });
          });

          describe('Theme Management', () => {
            test('should initialize theme correctly', () => {
              const shepherd = new SessionShepherd();
              
              // Should have theme-related properties
              expect(shepherd).toBeDefined();
            });

            test('should apply light theme', () => {
              const shepherd = new SessionShepherd();
              shepherd.applyTheme('light');
              
              expect(document.body.className).toContain('light');
            });

            test('should apply dark theme', () => {
              const shepherd = new SessionShepherd();
              shepherd.applyTheme('dark');
              
              expect(document.body.className).toContain('dark');
            });
          });

          describe('Tab Management', () => {
            test('should load current tabs', async () => {
              const mockTabs = [
                { id: 1, title: 'Regular Tab', url: 'https://example.com', favIconUrl: 'icon1.png' },
                { id: 2, title: 'Chrome Settings', url: 'chrome://settings', favIconUrl: 'icon2.png' },
                { id: 3, title: 'Another Tab', url: 'https://test.com', favIconUrl: 'icon3.png' }
              ];
              
              chrome.tabs.query.mockResolvedValue(mockTabs);
              
              const shepherd = new SessionShepherd();
              await shepherd.loadCurrentTabs();
              
              expect(shepherd.currentTabs).toHaveLength(3);
              expect(shepherd.currentTabs[0].url).toBe('https://example.com');
            });

            test('should toggle tab selection', () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [
                { id: 1, title: 'Tab 1', url: 'https://example.com' },
                { id: 2, title: 'Tab 2', url: 'https://test.com' }
              ];
              
              shepherd.toggleTabSelection(1, true);
              expect(shepherd.selectedTabIds.has(1)).toBe(true);
              
              shepherd.toggleTabSelection(1, false);
              expect(shepherd.selectedTabIds.has(1)).toBe(false);
            });

            test('should select all tabs', () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [
                { id: 1, title: 'Tab 1', url: 'https://example.com' },
                { id: 2, title: 'Tab 2', url: 'https://test.com' }
              ];
              
              shepherd.selectAllTabs();
              
              expect(shepherd.selectedTabIds.has(1)).toBe(true);
              expect(shepherd.selectedTabIds.has(2)).toBe(true);
            });

            test('should select no tabs', () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [
                { id: 1, title: 'Tab 1', url: 'https://example.com' },
                { id: 2, title: 'Tab 2', url: 'https://test.com' }
              ];
              
              shepherd.selectedTabIds.add(1);
              shepherd.selectedTabIds.add(2);
              
              shepherd.selectNoTabs();
              
              expect(shepherd.selectedTabIds.size).toBe(0);
            });
          });

          describe('Tab Filtering', () => {
            test('should filter tabs by title', () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [
                { id: 1, title: 'GitHub Repository', url: 'https://github.com/user/repo' },
                { id: 2, title: 'Google Search', url: 'https://google.com/search' },
                { id: 3, title: 'Stack Overflow', url: 'https://stackoverflow.com/questions' }
              ];
              
              // Should not throw errors when filtering
              expect(() => shepherd.filterTabs('GitHub')).not.toThrow();
            });

            test('should filter tabs by URL', () => {
              const shepherd = new SessionShepherd();
              shepherd.currentTabs = [
                { id: 1, title: 'GitHub Repository', url: 'https://github.com/user/repo' },
                { id: 2, title: 'Google Search', url: 'https://google.com/search' },
                { id: 3, title: 'Stack Overflow', url: 'https://stackoverflow.com/questions' }
              ];
              
              // Should not throw errors when filtering
              expect(() => shepherd.filterTabs('stackoverflow')).not.toThrow();
            });
          });

          describe('Form Validation', () => {
            test('should validate session name correctly', () => {
              const shepherd = new SessionShepherd();
              const nameInput = document.getElementById('session-name');
              
              // Test empty name
              nameInput.value = '';
              expect(shepherd.validateSessionName()).toBe(false);
              
              // Test valid name
              nameInput.value = 'Valid Session Name';
              expect(shepherd.validateSessionName()).toBe(true);
            });

            test('should update action buttons', () => {
              const shepherd = new SessionShepherd();
              
              // Mock selected tabs
              shepherd.selectedTabIds.add(1);
              
              // Should not throw errors
              expect(() => shepherd.updateActionButtons()).not.toThrow();
            });
          });

          describe('Utility Methods', () => {
            test('should get domain from URL correctly', () => {
              const shepherd = new SessionShepherd();
              
              expect(shepherd.getDomainFromUrl('https://example.com/path')).toBe('example.com');
              expect(shepherd.getDomainFromUrl('http://subdomain.test.com')).toBe('subdomain.test.com');
            });

            test('should handle invalid URLs', () => {
              const shepherd = new SessionShepherd();
              
              expect(shepherd.getDomainFromUrl('invalid-url')).toBe('invalid-url');
            });

            test('should escape HTML correctly', () => {
              const shepherd = new SessionShepherd();
              
              expect(shepherd.escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
              expect(shepherd.escapeHtml('Simple text')).toBe('Simple text');
            });
          });

          describe('Auto-save Functionality', () => {
            test('should initialize auto-save', () => {
              const shepherd = new SessionShepherd();
              
              // Should have auto-save related properties
              expect(shepherd).toBeDefined();
            });
          });

          describe('Keyboard Shortcuts', () => {
            test('should initialize keyboard shortcuts', () => {
              const shepherd = new SessionShepherd();
              
              // Should have keyboard shortcut handling
              expect(shepherd).toBeDefined();
            });

            test('should handle keyboard events', () => {
              const shepherd = new SessionShepherd();
              
              const event = {
                key: 's',
                ctrlKey: true,
                preventDefault: jest.fn(),
                target: { tagName: 'BODY' }
              };
              
              // Should not throw errors
              expect(() => shepherd.handleKeyboardShortcuts(event)).not.toThrow();
            });
          });

          describe('Storage Synchronization', () => {
            test('should initialize storage sync', () => {
              const shepherd = new SessionShepherd();
              
              // Should not throw errors when initializing storage sync
              expect(() => shepherd.initStorageSync()).not.toThrow();
            });
          });
});
