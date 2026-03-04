/**
 * Session Shepherd - Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Session Shepherd installed/updated:', details.reason);

  // Initialize storage with default values
  chrome.storage.local.get(['sessions', 'lastTab', 'suspendThresholdMinutes', 'autoGroupRules'], (result) => {
    if (!result.sessions) {
      chrome.storage.local.set({ sessions: [] });
    }
    if (!result.lastTab) {
      chrome.storage.local.set({ lastTab: 'create' });
    }
    if (result.suspendThresholdMinutes === undefined) {
      chrome.storage.local.set({ suspendThresholdMinutes: 60 });
    }
    if (result.autoGroupRules === undefined) {
      chrome.storage.local.set({
        autoGroupRules: [
          { domain: 'github.com', groupName: 'Development', color: 'blue' },
          { domain: 'stackoverflow.com', groupName: 'Development', color: 'blue' },
          { domain: 'jira.com', groupName: 'Work', color: 'red' },
          { domain: 'docs.google.com', groupName: 'Documents', color: 'yellow' }
        ]
      });
    }
  });

  // Setup background alarms for automated tab management
  chrome.alarms.create('autoSaveTimer', { periodInMinutes: 5 });
  chrome.alarms.create('autoSuspendTimer', { periodInMinutes: 1 });

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

// Handle tab updates for auto-grouping
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await applyAutoGrouping(tab);
  }
});

// Perform native Chrome tab grouping based on domain rules
async function applyAutoGrouping(tab) {
  try {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

    const { autoGroupRules = [] } = await chrome.storage.local.get('autoGroupRules');
    if (autoGroupRules.length === 0) return;

    const urlObj = new URL(tab.url);
    const domain = urlObj.hostname;

    const matchingRule = autoGroupRules.find(rule => domain.includes(rule.domain));

    if (matchingRule) {
      const groups = await chrome.tabGroups.query({ windowId: tab.windowId, title: matchingRule.groupName });

      let groupId;
      if (groups.length > 0) {
        groupId = groups[0].id;
      }

      groupId = await chrome.tabs.group({ tabIds: tab.id, groupId });

      await chrome.tabGroups.update(groupId, {
        title: matchingRule.groupName,
        color: matchingRule.color || 'grey'
      });
      console.log(`Auto-grouped tab ${tab.title} into ${matchingRule.groupName}`);
    }
  } catch (error) {
    // Ignore invalid URLs or grouping errors
  }
}

// Handle alarms for automated tab management
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoSaveTimer') {
    performAutoSave();
  } else if (alarm.name === 'autoSuspendTimer') {
    performAutoSuspend();
  }
});

// Perform periodic auto-save of current tab state
async function performAutoSave() {
  try {
    const windows = await chrome.windows.getAll({ populate: true });

    const autoSaveSession = {
      id: 'auto-save',
      name: 'Auto-Saved Session',
      category: 'system',
      tags: ['auto-save'],
      windows: windows.map(win => ({
        id: win.id,
        tabs: win.tabs.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          active: tab.active,
          pinned: tab.pinned
        }))
      })),
      createdAt: new Date().toISOString()
    };

    await chrome.storage.local.set({ autoSavedSession: autoSaveSession });
    console.log('Auto-save completed at', autoSaveSession.createdAt);
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
}

// Perform automated tab suspension to save memory
async function performAutoSuspend() {
  try {
    const { suspendThresholdMinutes = 60 } = await chrome.storage.local.get('suspendThresholdMinutes');
    if (suspendThresholdMinutes <= 0) return; // Feature disabled

    const tabs = await chrome.tabs.query({ active: false, discarded: false });
    const now = Date.now();
    const thresholdMs = suspendThresholdMinutes * 60 * 1000;

    for (const tab of tabs) {
      // Don't discard special URls or audible tabs
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.audible || tab.pinned) continue;

      // lastAccessed is supported in MV3
      if (tab.lastAccessed && (now - tab.lastAccessed > thresholdMs)) {
        console.log(`Auto-suspending tab: ${tab.title}`);
        await chrome.tabs.discard(tab.id);
      }
    }
  } catch (error) {
    console.error('Auto-suspend failed:', error);
  }
}

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

