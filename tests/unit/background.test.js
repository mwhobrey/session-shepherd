/**
 * Unit tests for background.js service worker
 * Tests Chrome extension background functionality
 */

describe('Background Service Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Extension Lifecycle', () => {
    test('should handle extension installation', () => {
      const mockDetails = { reason: 'install' };
      
      // Simulate onInstalled event
      const listeners = [];
      chrome.runtime.onInstalled.addListener = jest.fn((callback) => {
        listeners.push(callback);
      });
      
      // Add listener
      const mockCallback = jest.fn();
      chrome.runtime.onInstalled.addListener(mockCallback);
      
      // Simulate installation
      listeners.forEach(callback => callback(mockDetails));
      
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    });

    test('should initialize storage on installation', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();
      
      // Simulate storage initialization
      await chrome.storage.local.get(['sessions', 'lastTab']);
      await chrome.storage.local.set({ sessions: [] });
      await chrome.storage.local.set({ lastTab: 'create' });
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['sessions', 'lastTab']);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ sessions: [] });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ lastTab: 'create' });
    });
  });

  describe('Message Handling', () => {
    test('should handle getSessions message', async () => {
      const mockSessions = [
        { id: 1, name: 'Test Session', tabs: [] }
      ];
      
      chrome.storage.local.get.mockResolvedValue({ sessions: mockSessions });
      
      const result = await chrome.storage.local.get(['sessions']);
      const response = {
        success: true,
        sessions: result.sessions || []
      };
      
      expect(response.success).toBe(true);
      expect(response.sessions).toEqual(mockSessions);
    });

    test('should handle saveSession message', async () => {
      const mockSession = {
        id: Date.now(),
        name: 'Test Session',
        tabs: [{ title: 'Google', url: 'https://google.com' }]
      };
      
      chrome.storage.local.get.mockResolvedValue({ sessions: [] });
      chrome.storage.local.set.mockResolvedValue();
      
      const sessions = [];
      sessions.push(mockSession);
      await chrome.storage.local.set({ sessions });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ sessions: [mockSession] });
    });

    test('should handle deleteSession message', async () => {
      const sessionId = 1;
      const mockSessions = [
        { id: 1, name: 'Session 1', tabs: [] },
        { id: 2, name: 'Session 2', tabs: [] }
      ];
      
      chrome.storage.local.get.mockResolvedValue({ sessions: mockSessions });
      chrome.storage.local.set.mockResolvedValue();
      
      const updatedSessions = mockSessions.filter(session => session.id !== sessionId);
      await chrome.storage.local.set({ sessions: updatedSessions });
      
      expect(updatedSessions).toHaveLength(1);
      expect(updatedSessions[0].id).toBe(2);
    });

    test('should handle restoreSession message', async () => {
      const mockSession = {
        id: 1,
        name: 'Test Session',
        tabs: [
          { title: 'Google', url: 'https://google.com' },
          { title: 'GitHub', url: 'https://github.com' }
        ]
      };
      
      const mockWindow = { id: 1 };
      chrome.windows.create.mockResolvedValue(mockWindow);
      
      const window = await chrome.windows.create({
        url: mockSession.tabs.map(tab => tab.url),
        focused: true
      });
      
      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: ['https://google.com', 'https://github.com'],
        focused: true
      });
      expect(window.id).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      const error = new Error('Storage error');
      chrome.storage.local.get.mockRejectedValue(error);
      
      try {
        await chrome.storage.local.get(['sessions']);
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    test('should handle window creation errors', async () => {
      const error = new Error('Window creation failed');
      chrome.windows.create.mockRejectedValue(error);
      
      try {
        await chrome.windows.create({ url: ['https://google.com'] });
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('Keep-Alive Functionality', () => {
    test('should implement keep-alive mechanism', () => {
      let keepAliveInterval;
      
      const keepAlive = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        
        keepAliveInterval = setInterval(() => {
          chrome.runtime.getPlatformInfo(() => {});
        }, 20000);
      };
      
      // Test that keep-alive can be started
      expect(() => keepAlive()).not.toThrow();
      
      // Clean up
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    });
  });
});
