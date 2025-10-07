/**
 * Create Session - Full Page Interface
 * Handles session creation in a full-page context
 */

class CreateSessionPage {
  constructor() {
    this.currentTabs = [];
    this.selectedTabIds = new Set();
    this.currentTheme = 'system';
    this.pendingAction = null;
    
    this.init();
  }

  async init() {
    try {
      // Load theme
      await this.loadTheme();
      
      // Load current tabs
      await this.loadCurrentTabs();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up validation
      this.setupValidation();
      
      // Render tabs
      this.renderTabsList();
      
      // Update UI
      this.updateUI();
      
    } catch (error) {
      console.error('Failed to initialize create session page:', error);
      this.showError('Failed to load create session page');
    }
  }

  async loadTheme() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API not available for theme');
        this.currentTheme = 'system';
        this.applyTheme('system');
        return;
      }
      
      const result = await chrome.storage.local.get(['theme']);
      this.currentTheme = result.theme || 'system';
      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.currentTheme = 'system';
      this.applyTheme('system');
    }
  }

  async saveTheme() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage API not available for saving theme');
        return;
      }
      
      await chrome.storage.local.set({ theme: this.currentTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
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
    }
  }

  detectSystemTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const body = document.body;
    
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

  setupEventListeners() {
    // Back to dashboard
    document.getElementById('back-to-dashboard').addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL('dashboard/dashboard.html');
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

    // Tab selection
    document.getElementById('select-all-tabs').addEventListener('click', () => this.selectAllTabs());
    document.getElementById('select-no-tabs').addEventListener('click', () => this.selectNoTabs());

    // Tab search
    document.getElementById('tab-search').addEventListener('input', (e) => this.filterTabs(e.target.value));
    document.getElementById('clear-search').addEventListener('click', () => this.clearTabSearch());

    // Action buttons
    document.getElementById('save-only').addEventListener('click', () => this.saveSession(false));
    document.getElementById('save-and-close').addEventListener('click', () => this.saveSession(true));

    // Dialog
    document.getElementById('close-dialog').addEventListener('click', () => this.hideConfirmationDialog());
    document.getElementById('cancel-action').addEventListener('click', () => this.hideConfirmationDialog());
    document.getElementById('confirm-action').addEventListener('click', () => this.confirmAction());
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    this.currentTheme = themes[(currentIndex + 1) % themes.length];
    this.applyTheme(this.currentTheme);
    this.saveTheme();
  }

  async loadCurrentTabs() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      this.currentTabs = tabs.filter(tab => !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'));
      console.log(`Loaded ${this.currentTabs.length} tabs`);
    } catch (error) {
      console.error('Failed to load tabs:', error);
      this.showError('Failed to load current tabs');
    }
  }

  renderTabsList() {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';

    this.currentTabs.forEach(tab => {
      const tabElement = this.createTabElement(tab);
      tabsList.appendChild(tabElement);
    });

    this.updateActionButtons();
  }

  createTabElement(tab) {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-item';
    if (this.selectedTabIds.has(tab.id)) {
      tabElement.classList.add('selected');
    }

    tabElement.innerHTML = `
      <input type="checkbox" class="tab-checkbox" ${this.selectedTabIds.has(tab.id) ? 'checked' : ''}>
      <img src="${tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="%23666"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'}" 
           class="tab-favicon" alt="Favicon">
      <div class="tab-title">${this.escapeHtml(tab.title)}</div>
      <div class="tab-url">${this.getDomainFromUrl(tab.url)}</div>
    `;

    // Add click handler
    tabElement.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        this.toggleTabSelection(tab.id);
      }
    });

    // Add checkbox handler
    const checkbox = tabElement.querySelector('.tab-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      this.toggleTabSelection(tab.id);
    });

    return tabElement;
  }

  toggleTabSelection(tabId) {
    if (this.selectedTabIds.has(tabId)) {
      this.selectedTabIds.delete(tabId);
    } else {
      this.selectedTabIds.add(tabId);
    }
    this.renderTabsList();
  }

  selectAllTabs() {
    this.currentTabs.forEach(tab => {
      this.selectedTabIds.add(tab.id);
    });
    this.renderTabsList();
  }

  selectNoTabs() {
    this.selectedTabIds.clear();
    this.renderTabsList();
  }

  updateActionButtons() {
    const saveOnlyBtn = document.getElementById('save-only');
    const saveAndCloseBtn = document.getElementById('save-and-close');
    const sessionName = document.getElementById('session-name').value.trim();
    const hasSelectedTabs = this.selectedTabIds.size > 0;
    const isValidName = sessionName.length >= 3 && sessionName.length <= 50;

    const canSave = hasSelectedTabs && isValidName;
    saveOnlyBtn.disabled = !canSave;
    saveAndCloseBtn.disabled = !canSave;
  }

  setupValidation() {
    const sessionNameInput = document.getElementById('session-name');
    sessionNameInput.addEventListener('input', () => {
      this.validateSessionName();
      this.updateActionButtons();
    });
  }

  validateSessionName() {
    const sessionName = document.getElementById('session-name').value.trim();
    const errorElement = document.getElementById('session-name-error');
    
    if (sessionName.length === 0) {
      errorElement.textContent = 'Session name is required';
      return false;
    } else if (sessionName.length < 3) {
      errorElement.textContent = 'Session name must be at least 3 characters';
      return false;
    } else if (sessionName.length > 50) {
      errorElement.textContent = 'Session name must be less than 50 characters';
      return false;
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(sessionName)) {
      errorElement.textContent = 'Session name can only contain letters, numbers, spaces, hyphens, and underscores';
      return false;
    } else {
      errorElement.textContent = '';
      return true;
    }
  }

  async saveSession(closeTabs = false) {
    const sessionName = document.getElementById('session-name').value.trim();
    const category = document.getElementById('session-category').value;
    const tags = document.getElementById('session-tags').value.trim();

    if (!this.validateSessionName()) {
      return;
    }

    if (this.selectedTabIds.size === 0) {
      this.showError('Please select at least one tab');
      return;
    }

    try {
      this.showLoading(true);

      const selectedTabs = this.currentTabs.filter(tab => this.selectedTabIds.has(tab.id));
      
      const session = {
        id: Date.now().toString(),
        name: sessionName,
        category: category || 'other',
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        tabs: selectedTabs.map(tab => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save session to storage
      const result = await chrome.storage.local.get(['sessions']);
      const sessions = result.sessions || [];
      sessions.push(session);
      await chrome.storage.local.set({ sessions });

      if (closeTabs) {
        // Close selected tabs
        const tabsToClose = Array.from(this.selectedTabIds);
        await chrome.tabs.remove(tabsToClose);
      }

      this.showSuccess(`Session "${sessionName}" saved successfully`);
      
      // Navigate back to dashboard
      setTimeout(() => {
        window.location.href = chrome.runtime.getURL('dashboard/dashboard.html');
      }, 1500);

    } catch (error) {
      console.error('Failed to save session:', error);
      this.showError('Failed to save session');
    } finally {
      this.showLoading(false);
    }
  }

  filterTabs(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const searchResultsCount = document.getElementById('search-results-count');
    
    if (!term) {
      this.renderTabsList();
      searchResultsCount.textContent = 'Showing all tabs';
      return;
    }
    
    const filteredTabs = this.currentTabs.filter(tab => 
      tab.title.toLowerCase().includes(term) || 
      tab.url.toLowerCase().includes(term)
    );
    
    this.renderFilteredTabsList(filteredTabs);
    searchResultsCount.textContent = `Showing ${filteredTabs.length} of ${this.currentTabs.length} tabs`;
  }

  renderFilteredTabsList(filteredTabs) {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';

    filteredTabs.forEach(tab => {
      const tabElement = this.createTabElement(tab);
      tabsList.appendChild(tabElement);
    });
  }

  clearTabSearch() {
    const searchInput = document.getElementById('tab-search');
    searchInput.value = '';
    this.renderTabsList();
    const searchResultsCount = document.getElementById('search-results-count');
    searchResultsCount.textContent = 'Showing all tabs';
  }

  showConfirmationDialog(title, message, action) {
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    this.pendingAction = action;
    document.getElementById('confirmation-dialog').classList.add('show');
  }

  hideConfirmationDialog() {
    document.getElementById('confirmation-dialog').classList.remove('show');
    this.pendingAction = null;
  }

  confirmAction() {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.hideConfirmationDialog();
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (show) {
      loadingOverlay.classList.add('show');
    } else {
      loadingOverlay.classList.remove('show');
    }
  }

  showError(message) {
    alert(message); // TODO: Replace with toast notification
  }

  showSuccess(message) {
    alert(message); // TODO: Replace with toast notification
  }

  updateUI() {
    this.updateActionButtons();
  }

  getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CreateSessionPage();
});
