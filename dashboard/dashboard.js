class SessionDashboard {
  constructor() {
    this.sessions = [];
    this.filteredSessions = [];
    this.currentFilters = {
      category: '',
      tags: '',
      domain: ''
    };
    this.currentTheme = 'light';
    this.systemThemeListener = null;
    this.systemThemeHandler = null;
    
    this.init();
  }

  async init() {
    try {
      this.showLoading(true);
      
      // Small delay to ensure Chrome APIs are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.loadSessions();
      await this.loadTheme();
      this.setupEventListeners();
      this.initStorageSync();
      this.renderSessions();
      this.showLoading(false);
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      this.showError('Failed to load dashboard');
      this.showLoading(false);
    }
  }

  async loadSessions() {
    try {
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.error('Chrome storage API not available');
        this.showError('Dashboard must be opened from the extension popup');
        return;
      }
      
      const result = await chrome.storage.local.get(['sessions']);
      this.sessions = result.sessions || [];
      this.filteredSessions = [...this.sessions];
      console.log(`Loaded ${this.sessions.length} sessions`);
      
      // Log session structure for debugging
      if (this.sessions.length > 0) {
        console.log('Sample session structure:', this.sessions[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.showError('Failed to load sessions from storage');
      throw error;
    }
  }

  async loadTheme() {
    try {
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API not available for theme, using system theme');
        this.currentTheme = 'system';
        this.applyTheme('system');
        return;
      }
      
      const result = await chrome.storage.local.get(['theme']);
      this.currentTheme = result.theme || 'system'; // Default to system theme
      console.log('Loaded theme from storage:', this.currentTheme);
      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.currentTheme = 'system';
      this.applyTheme('system');
    }
  }

  async saveTheme() {
    try {
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API not available for saving theme');
        return;
      }
      
      await chrome.storage.local.set({ theme: this.currentTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  // Storage synchronization
  initStorageSync() {
    // Listen for storage changes to sync with popup
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.sessions) {
        console.log('Storage change detected in dashboard, syncing sessions...');
        // Debounce to prevent excessive re-renders
        clearTimeout(this.storageChangeTimeout);
        this.storageChangeTimeout = setTimeout(() => {
          this.loadSessions().then(() => {
            this.renderSessions();
            this.updateFilterResultsCount();
            console.log('Dashboard sessions synced from storage change');
          });
        }, 100);
      }
    });
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    
    // Back to popup
    
    // Filter controls
    document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
    document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
    
    // Filter inputs (real-time filtering)
    document.getElementById('category-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('tag-filter').addEventListener('input', () => this.debounce(() => this.applyFilters(), 300));
    document.getElementById('domain-filter').addEventListener('input', () => this.debounce(() => this.applyFilters(), 300));
    
    // Create session buttons
    document.getElementById('create-new-session').addEventListener('click', () => this.createNewSession());
    document.getElementById('create-first-session').addEventListener('click', () => this.createNewSession());
    
    // Dialog controls
    document.getElementById('close-dialog').addEventListener('click', () => this.hideConfirmationDialog());
    document.getElementById('cancel-action').addEventListener('click', () => this.hideConfirmationDialog());
    document.getElementById('confirm-action').addEventListener('click', () => this.confirmAction());
    
    // Close dialog on overlay click
    document.getElementById('confirmation-dialog').addEventListener('click', (e) => {
      if (e.target.id === 'confirmation-dialog') {
        this.hideConfirmationDialog();
      }
    });
  }

  toggleTheme() {
    // Cycle through: light -> dark -> system -> light
    switch (this.currentTheme) {
      case 'light':
        this.currentTheme = 'dark';
        break;
      case 'dark':
        this.currentTheme = 'system';
        break;
      case 'system':
        this.currentTheme = 'light';
        break;
      default:
        this.currentTheme = 'light';
    }
    
    this.applyTheme(this.currentTheme);
    this.saveTheme();
  }

  applyTheme(theme) {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle .material-icons');
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    
    // Apply new theme
    body.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update icon
    if (themeIcon) {
      switch (theme) {
        case 'light':
          themeIcon.textContent = 'light_mode';
          break;
        case 'dark':
          themeIcon.textContent = 'dark_mode';
          break;
        case 'system':
          themeIcon.textContent = 'brightness_auto';
          break;
      }
    }
    
    // Apply system theme detection
    if (theme === 'system') {
      this.detectSystemTheme();
      
      // Listen for system theme changes
      if (this.systemThemeListener) {
        this.systemThemeListener.removeEventListener('change', this.systemThemeHandler);
      }
      
      this.systemThemeHandler = () => this.detectSystemTheme();
      this.systemThemeListener = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemThemeListener.addEventListener('change', this.systemThemeHandler);
    } else {
      // Remove system theme listener if not in system mode
      if (this.systemThemeListener) {
        this.systemThemeListener.removeEventListener('change', this.systemThemeHandler);
        this.systemThemeListener = null;
        this.systemThemeHandler = null;
      }
    }
  }

  detectSystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const body = document.body;
    
    console.log('System theme detection:', prefersDark ? 'dark' : 'light');
    
    if (prefersDark) {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    }
    
    // Also update the document element for CSS variables
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }


  createNewSession() {
    // Open the full-page create session interface
    chrome.tabs.create({ url: chrome.runtime.getURL('create-session/create-session.html') });
  }

  applyFilters() {
    const categoryFilter = document.getElementById('category-filter').value;
    const tagFilter = document.getElementById('tag-filter').value.trim();
    const domainFilter = document.getElementById('domain-filter').value.trim();
    
    this.currentFilters = { category: categoryFilter, tags: tagFilter, domain: domainFilter };
    
    this.filteredSessions = this.sessions.filter(session => {
      // Category filter - handle sessions without category field
      if (categoryFilter) {
        const sessionCategory = session.category || 'other';
        if (sessionCategory !== categoryFilter) {
          return false;
        }
      }
      
      // Tag filter - handle sessions without tags field
      if (tagFilter) {
        const sessionTags = session.tags || [];
        const filterTags = tagFilter.split(',').map(tag => tag.trim().toLowerCase());
        const hasMatchingTag = filterTags.some(filterTag => 
          sessionTags.some(sessionTag => 
            sessionTag.toLowerCase().includes(filterTag)
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      // Domain filter
      if (domainFilter) {
        const hasMatchingDomain = session.tabs.some(tab => 
          this.matchesDomainPattern(tab.url, domainFilter)
        );
        if (!hasMatchingDomain) {
          return false;
        }
      }
      
      return true;
    });
    
    this.updateFilterResultsCount();
    this.renderSessions();
  }

  matchesDomainPattern(url, pattern) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // If pattern contains wildcards, use regex matching
      if (pattern.includes('*')) {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
          .replace(/\*/g, '.*')
          .replace(/\./g, '\\.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(domain);
      } else {
        // For non-wildcard patterns, check if domain contains the pattern
        return domain.toLowerCase().includes(pattern.toLowerCase());
      }
    } catch {
      return false;
    }
  }

  clearFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('tag-filter').value = '';
    document.getElementById('domain-filter').value = '';
    
    this.currentFilters = { category: '', tags: '', domain: '' };
    this.filteredSessions = [...this.sessions];
    
    this.updateFilterResultsCount();
    this.renderSessions();
  }

  updateFilterResultsCount() {
    const countElement = document.getElementById('filter-results-count');
    const totalSessions = this.sessions.length;
    const filteredSessions = this.filteredSessions.length;
    
    if (filteredSessions === totalSessions) {
      countElement.textContent = `Showing all ${totalSessions} session${totalSessions !== 1 ? 's' : ''}`;
    } else {
      countElement.textContent = `Showing ${filteredSessions} of ${totalSessions} sessions`;
    }
  }

  renderSessions() {
    const sessionsGrid = document.getElementById('sessions-grid');
    const emptyState = document.getElementById('empty-state');
    const emptyStateMessage = document.getElementById('empty-state-message');
    
    // Clear existing content
    sessionsGrid.innerHTML = '';
    
    if (this.filteredSessions.length === 0) {
      // Show empty state
      if (this.sessions.length === 0) {
        emptyStateMessage.textContent = 'Your saved sessions will appear here';
        document.getElementById('create-first-session').style.display = 'flex';
      } else {
        emptyStateMessage.textContent = 'No sessions match your current filters';
        document.getElementById('create-first-session').style.display = 'none';
      }
      emptyState.style.display = 'flex';
      return;
    }
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Render session cards
    this.filteredSessions.forEach(session => {
      const sessionCard = this.createSessionCard(session);
      sessionsGrid.appendChild(sessionCard);
    });
  }

  createSessionCard(session) {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.dataset.sessionId = session.id;
    
    // Create tab preview (up to 5 tabs)
    const tabPreview = this.createTabPreview(session.tabs);
    
    // Create category and tags display
    const categoryDisplay = session.category ? 
      `<span class="session-category category-${session.category}">${this.escapeHtml(session.category)}</span>` : '';
    const tagsDisplay = session.tags && session.tags.length > 0 ? 
      `<div class="session-tags">${session.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>` : '';
    
    div.innerHTML = `
      <div class="session-header">
        <div>
          <div class="session-name" title="${this.escapeHtml(session.name)}">${this.escapeHtml(session.name)}</div>
          <div class="session-meta">
            <div class="session-count">${session.tabs.length} tab${session.tabs.length !== 1 ? 's' : ''}</div>
            ${categoryDisplay}
          </div>
          ${tagsDisplay}
        </div>
        <div class="session-header-actions">
          <button class="delete-button" data-action="delete" title="Delete session">
            <span class="material-icons">delete</span>
          </button>
          <button class="expand-button" data-action="expand" title="Show session details">
            <span class="material-icons">expand_more</span>
          </button>
        </div>
      </div>
      <div class="session-details" style="display: none;">
        <div class="tab-preview">
          ${tabPreview}
        </div>
        <div class="session-urls">
          <h4>Session URLs:</h4>
          <div class="url-list">
            ${session.tabs.map(tab => `
              <div class="url-item">
                <span class="url-title">${this.escapeHtml(tab.title)}</span>
                <span class="url-link">${this.escapeHtml(tab.url)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="session-actions">
        <div class="restore-options">
          <select class="restore-mode-select" data-session-id="${session.id}">
            <option value="current">Current Window</option>
            <option value="new">New Window</option>
          </select>
        </div>
        <button class="session-button restore" data-action="restore">
          <span class="material-icons">open_in_new</span>
          Restore
        </button>
      </div>
    `;
    
    // Add event listeners
    div.querySelector('[data-action="restore"]').addEventListener('click', () => {
      const restoreMode = div.querySelector('.restore-mode-select').value;
      this.restoreSession(session, restoreMode);
    });
    
    div.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this.showDeleteConfirmation(session);
    });
    
    div.querySelector('[data-action="expand"]').addEventListener('click', () => {
      this.toggleSessionDetails(div);
    });
    
    return div;
  }

  createTabPreview(tabs) {
    const maxTabs = 5;
    const tabsToShow = tabs.slice(0, maxTabs);
    const remainingCount = tabs.length - maxTabs;
    
    return tabsToShow.map(tab => `
      <div class="tab-item">
        ${tab.favIconUrl ? `
          <img src="${tab.favIconUrl}" 
               alt="" class="tab-favicon" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
        ` : ''}
        <span class="tab-favicon tab-fallback-icon" 
              style="${tab.favIconUrl ? 'display: none;' : 'display: inline;'}"
              title="${this.escapeHtml(tab.title)}">📁</span>
        <span title="${this.escapeHtml(tab.title)}">${this.escapeHtml(tab.title)}</span>
      </div>
    `).join('') + (remainingCount > 0 ? `
      <div class="tab-item">
        <span style="color: var(--text-muted); font-style: italic;">+${remainingCount} more tab${remainingCount !== 1 ? 's' : ''}</span>
      </div>
    ` : '');
  }

  toggleSessionDetails(cardElement) {
    const detailsElement = cardElement.querySelector('.session-details');
    const expandButton = cardElement.querySelector('[data-action="expand"] .material-icons');
    
    if (detailsElement.style.display === 'none') {
      detailsElement.style.display = 'block';
      expandButton.textContent = 'expand_less';
    } else {
      detailsElement.style.display = 'none';
      expandButton.textContent = 'expand_more';
    }
  }

  async restoreSession(session, mode) {
    try {
      this.showLoading(true);
      
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.windows) {
        this.showError('Dashboard must be opened from the extension popup to restore sessions');
        return;
      }
      
      const tabs = session.tabs.map(tab => ({ url: tab.url }));
      
      if (mode === 'new') {
        // Create new window with all tabs
        await chrome.windows.create({ url: tabs.map(tab => tab.url) });
      } else {
        // Add tabs to current window
        for (const tab of tabs) {
          await chrome.tabs.create({ url: tab.url });
        }
      }
      
      this.showSuccess(`Session "${session.name}" restored successfully`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.showError('Failed to restore session');
    } finally {
      this.showLoading(false);
    }
  }

  showDeleteConfirmation(session) {
    this.pendingAction = {
      type: 'delete',
      session: session
    };
    
    document.getElementById('dialog-title').textContent = 'Delete Session';
    document.getElementById('dialog-message').textContent = 
      `Are you sure you want to delete the session "${session.name}"? This action cannot be undone.`;
    document.getElementById('confirm-action').textContent = 'Delete';
    document.getElementById('confirm-action').className = 'button filled danger';
    
    this.showConfirmationDialog();
  }

  showConfirmationDialog() {
    document.getElementById('confirmation-dialog').classList.add('active');
  }

  hideConfirmationDialog() {
    document.getElementById('confirmation-dialog').classList.remove('active');
    this.pendingAction = null;
  }

  async confirmAction() {
    if (!this.pendingAction) return;
    
    try {
      this.showLoading(true);
      
      if (this.pendingAction.type === 'delete') {
        await this.deleteSession(this.pendingAction.session);
      }
      
      this.hideConfirmationDialog();
    } catch (error) {
      console.error('Failed to perform action:', error);
      this.showError('Failed to perform action');
    } finally {
      this.showLoading(false);
    }
  }

  async deleteSession(session) {
    try {
      // Check if Chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        this.showError('Dashboard must be opened from the extension popup to delete sessions');
        return;
      }
      
      // Remove session from array
      this.sessions = this.sessions.filter(s => s.id !== session.id);
      
      // Save to storage
      await chrome.storage.local.set({ sessions: this.sessions });
      
      // Update filtered sessions
      this.filteredSessions = this.filteredSessions.filter(s => s.id !== session.id);
      
      // Re-render
      this.renderSessions();
      this.updateFilterResultsCount();
      
      this.showSuccess(`Session "${session.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (show) {
      loadingOverlay.classList.add('active');
    } else {
      loadingOverlay.classList.remove('active');
    }
  }

  showError(message) {
    console.error(message);
    // Simple error display - could be enhanced with toast notifications
    alert(message);
  }

  showSuccess(message) {
    console.log(message);
    // Simple success display - could be enhanced with toast notifications
    // Could add a toast notification here
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SessionDashboard();
});
