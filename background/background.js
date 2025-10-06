/**
 * Session Shepherd - Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Session Shepherd installed/updated:', details.reason);
    
  // Initialize storage with default values
  chrome.storage.local.get(['sessions', 'lastTab'], (result) => {
    if (!result.sessions) {
      chrome.storage.local.set({ sessions: [] });
    }
    if (!result.lastTab) {
      chrome.storage.local.set({ lastTab: 'create' });
    }
  });

  // Create context menu
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'open-dashboard',
      title: 'Open Session Shepherd Dashboard',
      contexts: ['all']
    });
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Session Shepherd started');
});

// Handle context menu clicks
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open-dashboard') {
      // Open the dashboard in a new tab
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard/dashboard.html')
      });
    }
  });
}

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
    
  switch (request.action) {
  case 'getSessions':
    handleGetSessions(sendResponse);
    return true; // Keep message channel open for async response
            
  case 'saveSession':
    handleSaveSession(request.session, sendResponse);
    return true;
            
  case 'deleteSession':
    handleDeleteSession(request.sessionId, sendResponse);
    return true;
            
  case 'restoreSession':
    handleRestoreSession(request.session, sendResponse);
    return true;
            
  default:
    console.warn('Unknown action:', request.action);
    sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Get all saved sessions
async function handleGetSessions(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    sendResponse({ 
      success: true, 
      sessions: result.sessions || [] 
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    sendResponse({ 
      success: false, 
      error: 'Failed to retrieve sessions' 
    });
  }
}

// Save a new session
async function handleSaveSession(session, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
        
    // Add new session
    sessions.push(session);
        
    await chrome.storage.local.set({ sessions });
        
    sendResponse({ 
      success: true, 
      message: 'Session saved successfully' 
    });
  } catch (error) {
    console.error('Failed to save session:', error);
    sendResponse({ 
      success: false, 
      error: 'Failed to save session' 
    });
  }
}

// Delete a session
async function handleDeleteSession(sessionId, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
        
    // Remove session with matching ID
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
        
    await chrome.storage.local.set({ sessions: updatedSessions });
        
    sendResponse({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    sendResponse({ 
      success: false, 
      error: 'Failed to delete session' 
    });
  }
}

// Restore a session
async function handleRestoreSession(session, sendResponse) {
  try {
    // Create new window with session tabs
    const window = await chrome.windows.create({
      url: session.tabs.map(tab => tab.url),
      focused: true
    });
        
    sendResponse({ 
      success: true, 
      message: 'Session restored successfully',
      windowId: window.id
    });
  } catch (error) {
    console.error('Failed to restore session:', error);
    sendResponse({ 
      success: false, 
      error: 'Failed to restore session' 
    });
  }
}

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('Storage changed:', changes);
        
    // Could broadcast changes to popup if it's open
    // This would be useful for real-time updates
  }
});

// Handle tab updates (for future features like auto-save)
chrome.tabs.onUpdated.addListener((_tabId, _changeInfo, _tab) => {
  // Future: Could implement auto-save functionality here
  // For now, we'll keep it simple
});

// Handle window focus changes (for future features)
chrome.windows.onFocusChanged.addListener((_windowId) => {
  // Future: Could implement window-specific session management
  // For now, we'll keep it simple
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Background script error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Background script unhandled rejection:', event.reason);
});

// Keep service worker alive (for Manifest V3)
// This is a simple approach - in production, you might want more sophisticated keep-alive logic
let keepAliveInterval;

function keepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
    
  keepAliveInterval = setInterval(() => {
    // Ping the service worker to keep it alive
    chrome.runtime.getPlatformInfo(() => {
      // This is just to keep the service worker active
    });
  }, 20000); // Ping every 20 seconds
}

// Start keep-alive when the service worker starts
keepAlive();

// Clean up on shutdown
chrome.runtime.onSuspend.addListener(() => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});

