/**
 * Session Shepherd - Popup JavaScript
 * Handles tab management, session creation, and UI interactions
 */

class SessionShepherd {
  constructor() {
    this.currentTab = 'create';
    this.sessions = [];
    this.currentTabs = [];
    this.selectedTabIds = new Set();
    this.pendingDeleteId = null;
    this.isOpeningDashboard = false;
    
    // Debug: Check if function exists
    console.log('Constructor: renderSessions function exists:', typeof this.renderSessions);
        
    this.init();
  }

  async init() {
    try {
      // Load saved sessions
      await this.loadSessions();
            
      // Load current tabs
      await this.loadCurrentTabs();
            
      // Set up event listeners
      this.setupEventListeners();
            
      // Set up validation
      this.setupValidation();
            
      // Initialize theme
      this.initTheme();
        
      // Initialize keyboard shortcuts
      this.initKeyboardShortcuts();
        
      // Initialize auto-save
      this.initAutoSave();
        
      // Initialize storage synchronization
      this.initStorageSync();
        
      // Restore last used tab
      this.restoreLastTab();
            
      // Update UI
      this.updateUI();
            
    } catch (error) {
      console.error('Failed to initialize Session Shepherd:', error);
      this.showError('Failed to load extension data');
    }
  }

  setupEventListeners() {
    // Tab switching
    document.getElementById('create-tab').addEventListener('click', () => this.switchTab('create'));
    document.getElementById('sessions-tab').addEventListener('click', () => this.switchTab('sessions'));
        
    // Create tab functionality
    document.getElementById('select-all').addEventListener('click', () => this.selectAllTabs());
    document.getElementById('select-none').addEventListener('click', () => this.selectNoTabs());
    document.getElementById('save-only').addEventListener('click', () => this.saveSession(false));
    document.getElementById('save-close').addEventListener('click', () => this.saveSession(true));
        
    // Theme toggle functionality
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
    // Tab search functionality
    document.getElementById('tab-search').addEventListener('input', (e) => this.filterTabs(e.target.value));
    document.getElementById('clear-search').addEventListener('click', () => this.clearTabSearch());
        
    // Session name input
    document.getElementById('session-name').addEventListener('input', (e) => {
      this.validateSessionName(e.target.value);
    });
        
    // Empty state
    document.getElementById('go-to-create').addEventListener('click', () => this.switchTab('create'));
        
    // Manage All Sessions CTA - prevent double-clicking
    const manageButton = document.getElementById('manage-all-sessions');
    if (manageButton && !manageButton.hasAttribute('data-listener-attached')) {
      manageButton.setAttribute('data-listener-attached', 'true');
      manageButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openComingSoon();
      });
    }
        
    // Confirmation dialog
    document.getElementById('cancel-delete').addEventListener('click', () => this.hideConfirmationDialog());
    document.getElementById('confirm-delete').addEventListener('click', () => this.confirmDelete());
        
    // Close dialog on overlay click
    document.getElementById('confirmation-dialog').addEventListener('click', (e) => {
      if (e.target.id === 'confirmation-dialog') {
        this.hideConfirmationDialog();
      }
    });
  }

  async loadSessions() {
    try {
      const result = await chrome.storage.local.get(['sessions']);
      this.sessions = result.sessions || [];
      console.log('loadSessions: Loaded sessions:', this.sessions.length, this.sessions); // Debug log
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = [];
    }
  }

  async loadCurrentTabs() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      this.currentTabs = tabs;
      this.selectedTabIds = new Set(tabs.map(tab => tab.id));
    } catch (error) {
      console.error('Failed to load current tabs:', error);
      this.currentTabs = [];
      this.selectedTabIds = new Set();
    }
  }

  switchTab(tabName) {
    console.log('switchTab called with:', tabName); // Debug log
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
        
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-content`).classList.add('active');
        
    this.currentTab = tabName;
        
    // Update UI based on current tab
    if (tabName === 'sessions') {
      console.log('Switching to sessions tab, calling renderSessions'); // Debug log
      console.log('Sessions count:', this.sessions.length); // Debug log
      if (typeof this.renderSessions === 'function') {
        this.renderSessions();
      } else {
        console.error('renderSessions function not found!');
      }
    }
  }

  restoreLastTab() {
    // Always default to 'create' tab when popup opens
    // This ensures consistent user experience
    this.switchTab('create');
  }

  updateUI() {
    console.log('updateUI called, current tab:', this.currentTab); // Debug log
    this.renderTabsList();
    if (typeof this.renderSessions === 'function') {
      console.log('updateUI: Calling renderSessions, sessions count:', this.sessions.length); // Debug log
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
    this.updateActionButtons();
  }

  renderTabsList() {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';
        
    if (this.currentTabs.length === 0) {
      tabsList.innerHTML = '<div class="empty-state"><p>No tabs found in current window</p></div>';
      return;
    }
        
    this.currentTabs.forEach(tab => {
      const tabElement = this.createTabElement(tab);
      tabsList.appendChild(tabElement);
    });
  }

  createTabElement(tab) {
    const div = document.createElement('div');
    div.className = `tab-item ${this.selectedTabIds.has(tab.id) ? 'selected' : ''}`;
    div.dataset.tabId = tab.id;
        
    const faviconUrl = tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOWFhMGE2Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz48L3N2Zz4=';
        
    div.innerHTML = `
            <input type="checkbox" class="tab-checkbox" ${this.selectedTabIds.has(tab.id) ? 'checked' : ''}>
            <img src="${faviconUrl}" class="tab-favicon" alt="Favicon">
            <div class="tab-title" title="${tab.title}">${tab.title}</div>
            <div class="tab-url" title="${tab.url}">${this.getDomainFromUrl(tab.url)}</div>
        `;
        
    // Add click handler
    div.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        const checkbox = div.querySelector('.tab-checkbox');
        checkbox.checked = !checkbox.checked;
        this.toggleTabSelection(tab.id, checkbox.checked);
      }
    });
        
    // Add checkbox handler
    const checkbox = div.querySelector('.tab-checkbox');
    checkbox.addEventListener('change', (e) => {
      this.toggleTabSelection(tab.id, e.target.checked);
    });
        
    return div;
  }

  toggleTabSelection(tabId, selected) {
    if (selected) {
      this.selectedTabIds.add(tabId);
    } else {
      this.selectedTabIds.delete(tabId);
    }
        
    // Update visual state
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.classList.toggle('selected', selected);
    }
        
    // Trigger validation
    this.validateTabSelection();
    this.updateSaveButtonStates();
    this.updateActionButtons();
  }

  selectAllTabs() {
    this.selectedTabIds.clear();
    this.currentTabs.forEach(tab => this.selectedTabIds.add(tab.id));
    this.renderTabsList();
    this.validateTabSelection();
    this.updateSaveButtonStates();
    this.updateActionButtons();
  }

  selectNoTabs() {
    this.selectedTabIds.clear();
    this.renderTabsList();
    this.validateTabSelection();
    this.updateSaveButtonStates();
    this.updateActionButtons();
  }

  updateActionButtons() {
    const hasSelection = this.selectedTabIds.size > 0;
    const hasName = document.getElementById('session-name').value.trim().length > 0;
    const canSave = hasSelection && hasName;
        
    document.getElementById('save-only').disabled = !canSave;
    document.getElementById('save-close').disabled = !canSave;
  }

  validateSessionName(name) {
    const trimmed = name.trim();
    const isValid = trimmed.length > 0 && trimmed.length <= 50;
        
    // Update button states
    this.updateActionButtons();
        
    return isValid;
  }

  async saveSession(closeTabs = false) {
    const sessionName = document.getElementById('session-name').value.trim();
    const category = document.getElementById('session-category').value;
    const tagsInput = document.getElementById('session-tags').value.trim();
        
    if (!sessionName) {
      this.showError('Please enter a session name');
      return;
    }
        
    if (this.selectedTabIds.size === 0) {
      this.showError('Please select at least one tab');
      return;
    }
        
    try {
      // Create session object
      const selectedTabs = this.currentTabs.filter(tab => this.selectedTabIds.has(tab.id));
      const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      
      const session = {
        id: Date.now(),
        name: sessionName,
        category: category,
        tags: tags,
        tabs: selectedTabs.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString()
      };
            
      // Save to storage
      this.sessions.push(session);
      await chrome.storage.local.set({ sessions: this.sessions });
            
      // Close tabs if requested
      if (closeTabs) {
        await this.closeSelectedTabs();
      }
            
      // Reset form
      document.getElementById('session-name').value = '';
      document.getElementById('session-category').value = 'work';
      document.getElementById('session-tags').value = '';
      this.selectAllTabs();
            
      // Switch to sessions tab
      this.switchTab('sessions');
            
      // Show success message
      this.showSuccess(`Session "${sessionName}" saved successfully`);
            
    } catch (error) {
      console.error('Failed to save session:', error);
      this.showError('Failed to save session');
    }
  }

  async closeSelectedTabs() {
    const tabsToClose = Array.from(this.selectedTabIds);
        
    // Check if we're about to close all tabs in the window
    if (tabsToClose.length === this.currentTabs.length) {
      // Navigate to new tab page instead of closing the window
      await chrome.tabs.create({ url: 'chrome://newtab/' });
      await chrome.tabs.remove(tabsToClose);
    } else {
      // Close selected tabs normally
      await chrome.tabs.remove(tabsToClose);
    }
  }

  renderSessions() {
    console.log('renderSessions called - NEW VERSION'); // Debug log
    console.log('Sessions array:', this.sessions); // Debug log
    const sessionsList = document.getElementById('sessions-list');
    const emptyState = document.getElementById('empty-state');
        
    console.log('sessionsList element:', sessionsList); // Debug log
    console.log('emptyState element:', emptyState); // Debug log
        
    if (!sessionsList || !emptyState) {
      console.error('Required DOM elements not found');
      return;
    }
        
    if (this.sessions.length === 0) {
      console.log('No sessions found, showing empty state'); // Debug log
      sessionsList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }
        
    console.log('Rendering sessions, count:', this.sessions.length); // Debug log
    sessionsList.style.display = 'block';
    emptyState.style.display = 'none';
        
    sessionsList.innerHTML = '';
        
    this.sessions.forEach((session, index) => {
      console.log(`Creating session card ${index + 1}:`, session.name); // Debug log
      const sessionCard = this.createSessionCard(session);
      console.log('Session card created:', sessionCard); // Debug log
      sessionsList.appendChild(sessionCard);
      console.log('Session card appended to DOM'); // Debug log
    });
    
    console.log('Final sessionsList innerHTML length:', sessionsList.innerHTML.length); // Debug log
    console.log('Final sessionsList children count:', sessionsList.children.length); // Debug log
  }

  createSessionCard(session) {
    const div = document.createElement('div');
    div.className = 'session-card';
    div.dataset.sessionId = session.id;
        
    // Create tab preview (up to 5 tabs)
    const tabPreview = this.createTabPreview(session.tabs);
        
    div.innerHTML = `
            <div class="session-header">
                <div>
                    <div class="session-name" title="${this.escapeHtml(session.name)}">${this.escapeHtml(session.name)}</div>
                    <div class="session-meta">
                        <div class="session-count">${session.tabs.length} tab${session.tabs.length !== 1 ? 's' : ''}</div>
                        ${session.category ? `<div class="session-category category-${session.category}">${session.category}</div>` : ''}
                        ${session.tags && session.tags.length > 0 ? `
                            <div class="session-tags">
                                ${session.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
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
            <div class="tab-preview">
                ${tabPreview}
            </div>
            <div class="session-details" style="display: none;">
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
      this.showConfirmationDialog(session.id);
    });
        
    div.querySelector('[data-action="expand"]').addEventListener('click', () => {
      this.toggleSessionDetails(div);
    });
        
    return div;
  }

  createTabPreview(tabs) {
    const maxTabs = 5;
    const previewTabs = tabs.slice(0, maxTabs);
    const remainingCount = tabs.length - maxTabs;
        
    let previewHtml = '';
        
    previewTabs.forEach(tab => {
      const faviconUrl = tab.favIconUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOWFhMGE2Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz48L3N2Zz4=';
      // const domain = this.getDomainFromUrl(tab.url); // Future use
      const truncatedTitle = tab.title.length > 15 ? `${tab.title.substring(0, 15)  }...` : tab.title;
            
      previewHtml += `
                <div class="tab-preview-item" title="${this.escapeHtml(tab.title)}">
                    <img src="${faviconUrl}" class="tab-preview-icon" alt="Favicon">
                    <span class="tab-preview-title">${this.escapeHtml(truncatedTitle)}</span>
                </div>
            `;
    });
        
    // Add overflow indicator if there are more tabs
    if (remainingCount > 0) {
      previewHtml += `
                <div class="tab-preview-overflow" title="${remainingCount} more tabs">
                    +${remainingCount} more
                </div>
            `;
    }
        
    return previewHtml;
  }

  async restoreSession(session, mode = 'new') {
    try {
      if (mode === 'current') {
        // Add tabs to current window
        const currentWindow = await chrome.windows.getCurrent();
        for (const tab of session.tabs) {
          await chrome.tabs.create({
            url: tab.url,
            windowId: currentWindow.id
          });
        }
        this.showSuccess(`Session "${session.name}" restored to current window`);
      } else {
        // Create new window with session tabs (default behavior)
        await chrome.windows.create({
          url: session.tabs.map(tab => tab.url),
          focused: true
        });
        this.showSuccess(`Session "${session.name}" restored to new window`);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.showError('Failed to restore session');
    }
  }

  showConfirmationDialog(sessionId) {
    this.pendingDeleteId = sessionId;
    document.getElementById('confirmation-dialog').classList.add('show');
  }

  hideConfirmationDialog() {
    this.pendingDeleteId = null;
    document.getElementById('confirmation-dialog').classList.remove('show');
  }

  // Keyboard shortcuts help dialog methods
  showKeyboardHelp() {
    const dialog = document.getElementById('keyboard-help-dialog');
    if (dialog) {
      dialog.style.display = 'flex';
    }
  }

  hideKeyboardHelp() {
    const dialog = document.getElementById('keyboard-help-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
  }

  async confirmDelete() {
    if (!this.pendingDeleteId) return;
        
    try {
      // Remove session from array
      this.sessions = this.sessions.filter(session => session.id !== this.pendingDeleteId);
            
      // Update storage
      await chrome.storage.local.set({ sessions: this.sessions });
            
      // Update UI
      if (typeof this.renderSessions === 'function') {
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
            
      // Hide dialog
      this.hideConfirmationDialog();
            
      this.showSuccess('Session deleted successfully');
            
    } catch (error) {
      console.error('Failed to delete session:', error);
      this.showError('Failed to delete session');
    }
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

  // Validation methods
  setupValidation() {
    const sessionNameInput = document.getElementById('session-name');
    if (sessionNameInput) {
      sessionNameInput.addEventListener('input', () => {
        this.validateSessionName();
        this.updateSaveButtonStates();
      });
      sessionNameInput.addEventListener('blur', () => {
        this.validateSessionName();
        this.updateSaveButtonStates();
      });
    }
        
    // Validate tab selection when tabs change
    this.validateTabSelection();
    this.updateSaveButtonStates();
  }

  validateSessionName() {
    const sessionNameInput = document.getElementById('session-name');
    if (!sessionNameInput) return false;
        
    const sessionName = sessionNameInput.value.trim();
        
    // Clear previous validation state
    this.clearValidationState(sessionNameInput);
        
    let isValid = true;
    let errorMessage = '';
        
    // Required field
    if (!sessionName) {
      isValid = false;
      errorMessage = 'Session name is required';
    }
    // Minimum length
    else if (sessionName.length < 3) {
      isValid = false;
      errorMessage = 'Session name must be at least 3 characters';
    }
    // Maximum length
    else if (sessionName.length > 50) {
      isValid = false;
      errorMessage = 'Session name must be 50 characters or less';
    }
    // Pattern validation (alphanumeric, spaces, hyphens, underscores)
    else if (!/^[a-zA-Z0-9\s\-_]+$/.test(sessionName)) {
      isValid = false;
      errorMessage = 'Session name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
        
    // Update UI based on validation
    this.updateValidationState(sessionNameInput, isValid, errorMessage);
        
    return isValid;
  }

  validateTabSelection() {
    const hasSelection = this.selectedTabIds.size > 0;
    const maxTabs = 50; // Performance limit
    const isValid = hasSelection && this.selectedTabIds.size <= maxTabs;
        
    return isValid;
  }

  updateValidationState(input, isValid, errorMessage) {
    if (!input) return;
        
    const inputGroup = input.closest('.input-group');
    if (!inputGroup) return;
        
    const errorElement = inputGroup.querySelector('.error-message');
        
    // Remove existing error message
    if (errorElement) {
      errorElement.remove();
    }
        
    // Update input styling
    input.classList.remove('valid', 'invalid');
        
    if (isValid) {
      input.classList.add('valid');
    } else {
      input.classList.add('invalid');
            
      // Add error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = errorMessage;
      inputGroup.appendChild(errorDiv);
    }
  }

  clearValidationState(input) {
    if (!input) return;
        
    const inputGroup = input.closest('.input-group');
    if (inputGroup) {
      const errorElement = inputGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }
        
    input.classList.remove('valid', 'invalid');
  }

  updateSaveButtonStates() {
    // Get validation state without triggering validation again
    const sessionNameInput = document.getElementById('session-name');
    const sessionName = sessionNameInput ? sessionNameInput.value.trim() : '';
    const sessionNameValid = sessionName.length >= 3 && sessionName.length <= 50 && /^[a-zA-Z0-9\s\-_]+$/.test(sessionName);
    const tabSelectionValid = this.selectedTabIds.size > 0 && this.selectedTabIds.size <= 50;
    const canSave = sessionNameValid && tabSelectionValid;
        
    const saveOnlyBtn = document.getElementById('save-only');
    const saveCloseBtn = document.getElementById('save-close');
        
    if (saveOnlyBtn) {
      saveOnlyBtn.disabled = !canSave;
      saveOnlyBtn.classList.toggle('disabled', !canSave);
    }
        
    if (saveCloseBtn) {
      saveCloseBtn.disabled = !canSave;
      saveCloseBtn.classList.toggle('disabled', !canSave);
    }
  }

  showError(message) {
    // Simple error display - could be enhanced with toast notifications
    console.error(message);
    alert(message);
  }

  showSuccess(message) {
    // Simple success display - could be enhanced with toast notifications
    console.log(message);
    // Could add a toast notification here
  }

  openComingSoon() {
    // Prevent multiple tabs from being opened
    if (this.isOpeningDashboard) {
      console.log('Dashboard already opening, ignoring duplicate click');
      return;
    }
    
    this.isOpeningDashboard = true;
    console.log('Opening dashboard...');
    
    // Disable the button temporarily to prevent multiple clicks
    const button = document.getElementById('manage-all-sessions');
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.6';
    }
    
    // Open the full-page dashboard in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') })
      .then(() => {
        console.log('Dashboard opened successfully');
        // Reset flag and re-enable button after a short delay
        setTimeout(() => {
          this.isOpeningDashboard = false;
          if (button) {
            button.disabled = false;
            button.style.opacity = '1';
          }
        }, 2000);
      })
      .catch((error) => {
        console.error('Failed to open dashboard:', error);
        this.isOpeningDashboard = false;
        if (button) {
          button.disabled = false;
          button.style.opacity = '1';
        }
      });
  }

  // Domain filtering methods
  applyDomainFilter() {
    const filterInput = document.getElementById('domain-filter');
    const pattern = filterInput.value.trim();
        
    if (!pattern) {
      this.clearDomainFilter();
      return;
    }
        
    try {
      const matchingTabs = this.currentTabs.filter(tab => this.matchesDomainPattern(tab.url, pattern));
      this.updateTabSelectionFromFilter(matchingTabs);
      this.updateFilterCount(matchingTabs.length);
    } catch (error) {
      console.error('Invalid domain pattern:', error);
      this.showError('Invalid domain pattern. Use formats like "*.github.com" or "stackoverflow.com"');
    }
  }

  clearDomainFilter() {
    document.getElementById('domain-filter').value = '';
    this.selectAllTabs();
    this.updateFilterCount(this.currentTabs.length);
  }

  matchesDomainPattern(url, pattern) {
    try {
      // Convert wildcard pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\./g, '\\.');
      const regex = new RegExp(`^https?://(www\\.)?${regexPattern}`);
      return regex.test(url);
    } catch {
      return false;
    }
  }

  updateTabSelectionFromFilter(matchingTabs) {
    // Clear current selection
    this.selectedTabIds.clear();
        
    // Select only matching tabs
    matchingTabs.forEach(tab => {
      this.selectedTabIds.add(tab.id);
    });
        
    // Update UI
    this.renderTabsList();
    this.validateTabSelection();
    this.updateSaveButtonStates();
    this.updateActionButtons();
  }

  updateFilterCount(count) {
    const filterCount = document.getElementById('filter-count');
    filterCount.textContent = `(${count} matches)`;
  }

  // Theme management methods
  async initTheme() {
    try {
      const result = await chrome.storage.local.get(['theme']);
      const theme = result.theme || 'system';
      this.applyTheme(theme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      this.applyTheme('system');
    }
  }

  async toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let newTheme;
        
    switch (currentTheme) {
    case 'light':
      newTheme = 'dark';
      break;
    case 'dark':
      newTheme = 'system';
      break;
    default:
      newTheme = 'light';
    }
        
    this.applyTheme(newTheme);
        
    try {
      await chrome.storage.local.set({ theme: newTheme });
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
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  // Keyboard shortcuts initialization
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  handleKeyboardShortcuts(event) {
    // Don't interfere with input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
      return;
    }

    const { key, ctrlKey, shiftKey, altKey } = event;

    // Ctrl+S: Save session (Save Only)
    if (ctrlKey && key === 's' && !shiftKey && !altKey) {
      event.preventDefault();
      this.saveSession(false);
      return;
    }

    // Ctrl+Shift+S: Save and Close
    if (ctrlKey && shiftKey && key === 'S') {
      event.preventDefault();
      this.saveSession(true);
      return;
    }

    // Ctrl+1: Switch to Create tab
    if (ctrlKey && key === '1' && !shiftKey && !altKey) {
      event.preventDefault();
      this.switchTab('create');
      return;
    }

    // Ctrl+2: Switch to Sessions tab
    if (ctrlKey && key === '2' && !shiftKey && !altKey) {
      event.preventDefault();
      this.switchTab('sessions');
      return;
    }

    // Ctrl+A: Select all tabs (when in Create tab)
    if (ctrlKey && key === 'a' && !shiftKey && !altKey && this.currentTab === 'create') {
      event.preventDefault();
      this.selectAllTabs();
      return;
    }

    // Ctrl+D: Select no tabs (when in Create tab)
    if (ctrlKey && key === 'd' && !shiftKey && !altKey && this.currentTab === 'create') {
      event.preventDefault();
      this.selectNoTabs();
      return;
    }

    // Ctrl+T: Toggle theme
    if (ctrlKey && key === 't' && !shiftKey && !altKey) {
      event.preventDefault();
      this.toggleTheme();
      return;
    }

    // Ctrl+F: Focus search (when in Create tab)
    if (ctrlKey && key === 'f' && !shiftKey && !altKey && this.currentTab === 'create') {
      event.preventDefault();
      const searchInput = document.getElementById('tab-search');
      if (searchInput) {
        searchInput.focus();
      }
      return;
    }

    // Ctrl+E: Export sessions (when in Sessions tab)
    if (ctrlKey && key === 'e' && !shiftKey && !altKey && this.currentTab === 'sessions') {
      event.preventDefault();
      this.exportSessions();
      return;
    }

    // Ctrl+I: Import sessions (when in Sessions tab)
    if (ctrlKey && key === 'i' && !shiftKey && !altKey && this.currentTab === 'sessions') {
      event.preventDefault();
      this.triggerImport();
      return;
    }

    // Escape: Clear search or close dialogs
    if (key === 'Escape') {
      if (this.currentTab === 'create') {
        const searchInput = document.getElementById('tab-search');
        if (searchInput && searchInput.value) {
          this.clearTabSearch();
          return;
        }
      }
            
      // Close keyboard help dialog if open
      const keyboardDialog = document.getElementById('keyboard-help-dialog');
      if (keyboardDialog && keyboardDialog.style.display !== 'none') {
        this.hideKeyboardHelp();
        return;
      }
            
      // Close confirmation dialog if open
      const dialog = document.getElementById('confirmation-dialog');
      if (dialog && dialog.style.display !== 'none') {
        this.hideConfirmationDialog();
        return;
      }
    }

    // Enter: Save session (when in Create tab and session name is focused)
    if (key === 'Enter' && this.currentTab === 'create') {
      const sessionNameInput = document.getElementById('session-name');
      if (document.activeElement === sessionNameInput && sessionNameInput.value.trim()) {
        event.preventDefault();
        this.saveSession(false);
                
      }
    }
  }

  // Tab search and filtering methods
  filterTabs(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const searchResultsCount = document.getElementById('search-results-count');
        
    if (!term) {
      // Show all tabs
      this.renderTabsList();
      searchResultsCount.textContent = 'Showing all tabs';
      return;
    }
        
    // Filter tabs based on search term
    const filteredTabs = this.currentTabs.filter(tab => 
      tab.title.toLowerCase().includes(term) || 
            tab.url.toLowerCase().includes(term)
    );
        
    // Update UI with filtered results
    this.renderFilteredTabsList(filteredTabs);
    searchResultsCount.textContent = `Showing ${filteredTabs.length} of ${this.currentTabs.length} tabs`;
  }

  renderFilteredTabsList(filteredTabs) {
    const tabsList = document.getElementById('tabs-list');
    tabsList.innerHTML = '';
        
    if (filteredTabs.length === 0) {
      tabsList.innerHTML = '<div class="no-results">No tabs match your search</div>';
      return;
    }
        
    // Update selectedTabIds to only include filtered tabs that were previously selected
    const filteredTabIds = new Set(filteredTabs.map(tab => tab.id));
    const newSelectedTabIds = new Set();
    
    // Only keep tabs that are both filtered AND previously selected
    this.selectedTabIds.forEach(tabId => {
      if (filteredTabIds.has(tabId)) {
        newSelectedTabIds.add(tabId);
      }
    });
    
    this.selectedTabIds = newSelectedTabIds;
        
    filteredTabs.forEach(tab => {
      const tabElement = this.createTabElement(tab);
      tabsList.appendChild(tabElement);
    });
    
    // Update validation and button states
    this.validateTabSelection();
    this.updateSaveButtonStates();
  }

  clearTabSearch() {
    const searchInput = document.getElementById('tab-search');
    searchInput.value = '';
    // Restore original tab selection when clearing search
    this.renderTabsList();
    const searchResultsCount = document.getElementById('search-results-count');
    searchResultsCount.textContent = 'Showing all tabs';
  }

  // Session details expansion methods
  toggleSessionDetails(sessionCard) {
    const details = sessionCard.querySelector('.session-details');
    const expandButton = sessionCard.querySelector('[data-action="expand"]');
    const expandIcon = expandButton.querySelector('.material-icons');
        
    if (details.style.display === 'none') {
      details.style.display = 'block';
      expandIcon.textContent = 'expand_less';
      expandButton.title = 'Hide session details';
    } else {
      details.style.display = 'none';
      expandIcon.textContent = 'expand_more';
      expandButton.title = 'Show session details';
    }
  }

  // Session filtering methods
  applySessionFilters() {
    const categoryFilterElement = document.getElementById('category-filter');
    const tagFilterElement = document.getElementById('tag-filter');
    const categoryFilter = categoryFilterElement ? categoryFilterElement.value : '';
    const tagFilter = tagFilterElement ? tagFilterElement.value.trim().toLowerCase() : '';
        
    const filteredSessions = this.sessions.filter(session => {
      // Category filter
      if (categoryFilter && session.category !== categoryFilter) {
        return false;
      }
            
      // Tag filter
      if (tagFilter && !session.tags.some(tag => tag.toLowerCase().includes(tagFilter))) {
        return false;
      }
            
      return true;
    });
        
    if (typeof this.renderSessions === 'function') {
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
  }

  clearSessionFilters() {
    const categoryFilterElement = document.getElementById('category-filter');
    const tagFilterElement = document.getElementById('tag-filter');
    if (categoryFilterElement) categoryFilterElement.value = '';
    if (tagFilterElement) tagFilterElement.value = '';
    if (typeof this.renderSessions === 'function') {
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
  }

  // Import/Export methods
  exportSessions() {
    try {
      if (this.sessions.length === 0) {
        this.showError('No sessions to export');
        return;
      }

      // Create export data with metadata
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        sessionCount: this.sessions.length,
        sessions: this.sessions
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
            
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-shepherd-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showSuccess(`Exported ${this.sessions.length} sessions successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Failed to export sessions');
    }
  }

  triggerImport() {
    const fileInput = document.getElementById('import-file');
    fileInput.click();
  }

  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await this.readFileAsText(file);
      const importData = JSON.parse(text);

      // Validate import data
      if (!this.validateImportData(importData)) {
        this.showError('Invalid import file format');
        return;
      }

      // Show import confirmation
      const sessionCount = importData.sessions.length;
      const confirmMessage = `Import ${sessionCount} sessions? This will add them to your existing sessions.`;
            
      if (confirm(confirmMessage)) {
        await this.performImport(importData.sessions);
      }

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      this.showError('Failed to import sessions. Please check the file format.');
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  validateImportData(data) {
    return data && 
               typeof data === 'object' && 
               Array.isArray(data.sessions) &&
               data.sessions.every(session => 
                 session.id && 
                   session.name && 
                   Array.isArray(session.tabs)
               );
  }

  async performImport(importedSessions) {
    try {
      // Generate new IDs to avoid conflicts
      const newSessions = importedSessions.map(session => ({
        ...session,
        id: Date.now() + Math.random(),
        importedAt: new Date().toISOString()
      }));

      // Add imported sessions to existing sessions
      this.sessions = [...this.sessions, ...newSessions];
            
      // Save to storage
      await chrome.storage.local.set({ sessions: this.sessions });
            
      // Update UI
      if (typeof this.renderSessions === 'function') {
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
            
      this.showSuccess(`Successfully imported ${newSessions.length} sessions`);
    } catch (error) {
      console.error('Import save failed:', error);
      this.showError('Failed to save imported sessions');
    }
  }

  // Storage synchronization
  initStorageSync() {
    // Listen for storage changes to sync with dashboard
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.sessions) {
        console.log('Storage change detected, syncing sessions...');
        // Debounce to prevent excessive re-renders
        clearTimeout(this.storageChangeTimeout);
        this.storageChangeTimeout = setTimeout(() => {
          this.loadSessions().then(() => {
            this.renderSessions();
            console.log('Sessions synced from storage change');
          });
        }, 100);
      }
    });
  }

  // Auto-save functionality
  initAutoSave() {
    this.autoSaveTimer = null;
    this.autoSaveSettings = {
      enabled: false,
      interval: 60, // seconds
      maxSessions: 10
    };
        
    // Load auto-save settings
    this.loadAutoSaveSettings();
  }

  async loadAutoSaveSettings() {
    try {
      const result = await chrome.storage.local.get(['autoSaveSettings']);
      if (result.autoSaveSettings) {
        this.autoSaveSettings = { ...this.autoSaveSettings, ...result.autoSaveSettings };
      }
            
      // Update UI
      this.updateAutoSaveUI();
    } catch (error) {
      console.error('Failed to load auto-save settings:', error);
    }
  }

  updateAutoSaveUI() {
    const enabledCheckbox = document.getElementById('auto-save-enabled');
    const optionsDiv = document.getElementById('auto-save-options');
    const intervalSelect = document.getElementById('auto-save-interval');
    const maxSessionsSelect = document.getElementById('auto-save-max-sessions');
        
    if (enabledCheckbox) {
      enabledCheckbox.checked = this.autoSaveSettings.enabled;
    }
        
    if (optionsDiv) {
      optionsDiv.style.display = this.autoSaveSettings.enabled ? 'flex' : 'none';
    }
        
    if (intervalSelect) {
      intervalSelect.value = this.autoSaveSettings.interval;
    }
        
    if (maxSessionsSelect) {
      maxSessionsSelect.value = this.autoSaveSettings.maxSessions;
    }
  }

  async toggleAutoSave(enabled) {
    this.autoSaveSettings.enabled = enabled;
        
    // Update UI
    const optionsDiv = document.getElementById('auto-save-options');
    if (optionsDiv) {
      optionsDiv.style.display = enabled ? 'flex' : 'none';
    }
        
    // Save settings
    await this.saveAutoSaveSettings();
        
    // Start or stop auto-save timer
    if (enabled) {
      this.startAutoSaveTimer();
    } else {
      this.stopAutoSaveTimer();
    }
  }

  async updateAutoSaveSettings() {
    const intervalSelect = document.getElementById('auto-save-interval');
    const maxSessionsSelect = document.getElementById('auto-save-max-sessions');
        
    if (intervalSelect) {
      this.autoSaveSettings.interval = parseInt(intervalSelect.value);
    }
        
    if (maxSessionsSelect) {
      this.autoSaveSettings.maxSessions = parseInt(maxSessionsSelect.value);
    }
        
    // Save settings
    await this.saveAutoSaveSettings();
        
    // Restart timer if auto-save is enabled
    if (this.autoSaveSettings.enabled) {
      this.startAutoSaveTimer();
    }
  }

  async saveAutoSaveSettings() {
    try {
      await chrome.storage.local.set({ autoSaveSettings: this.autoSaveSettings });
    } catch (error) {
      console.error('Failed to save auto-save settings:', error);
    }
  }

  startAutoSaveTimer() {
    this.stopAutoSaveTimer(); // Clear existing timer
        
    if (!this.autoSaveSettings.enabled) return;
        
    const intervalMs = this.autoSaveSettings.interval * 1000;
    this.autoSaveTimer = setInterval(() => {
      this.performAutoSave();
    }, intervalMs);
  }

  stopAutoSaveTimer() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  async performAutoSave() {
    try {
      // Only auto-save if we're in the Create tab and have tabs selected
      if (this.currentTab !== 'create' || this.selectedTabIds.size === 0) {
        return;
      }
            
      // Get current tabs
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const selectedTabs = tabs.filter(tab => this.selectedTabIds.has(tab.id));
            
      if (selectedTabs.length === 0) return;
            
      // Create auto-save session
      const autoSaveSession = {
        id: `autosave_${Date.now()}`,
        name: `Auto-save ${new Date().toLocaleTimeString()}`,
        category: 'autosave',
        tags: ['auto-saved'],
        tabs: selectedTabs.map(tab => ({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        })),
        createdAt: new Date().toISOString(),
        isAutoSave: true
      };
            
      // Add to sessions
      this.sessions.push(autoSaveSession);
            
      // Clean up old auto-save sessions
      await this.cleanupAutoSaveSessions();
            
      // Save to storage
      await chrome.storage.local.set({ sessions: this.sessions });
            
      // Update UI if we're on sessions tab
      if (this.currentTab === 'sessions') {
        if (typeof this.renderSessions === 'function') {
      this.renderSessions();
    } else {
      console.error('renderSessions function not found!');
    }
      }
            
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  async cleanupAutoSaveSessions() {
    const autoSaveSessions = this.sessions.filter(session => session.isAutoSave);
        
    if (autoSaveSessions.length > this.autoSaveSettings.maxSessions) {
      // Sort by creation date and remove oldest
      autoSaveSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
      const sessionsToRemove = autoSaveSessions.slice(0, autoSaveSessions.length - this.autoSaveSettings.maxSessions);
      const sessionIdsToRemove = sessionsToRemove.map(session => session.id);
            
      this.sessions = this.sessions.filter(session => !sessionIdsToRemove.includes(session.id));
    }
  }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SessionShepherd();
});

// Debug: Verify function exists
console.log('SessionShepherd class loaded');
console.log('renderSessions function exists:', typeof SessionShepherd.prototype.renderSessions);

// Fallback function in case of issues
if (typeof SessionShepherd.prototype.renderSessions !== 'function') {
  console.error('CRITICAL: renderSessions function is missing!');
  SessionShepherd.prototype.renderSessions = function() {
    console.log('FALLBACK renderSessions called');
    const sessionsList = document.getElementById('sessions-list');
    const emptyState = document.getElementById('empty-state');
    if (sessionsList && emptyState) {
      sessionsList.style.display = this.sessions.length === 0 ? 'none' : 'block';
      emptyState.style.display = this.sessions.length === 0 ? 'flex' : 'none';
    }
  };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionShepherd;
}

// Initialize the extension when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing SessionShepherd'); // Debug log
  window.sessionShepherd = new SessionShepherd();
});

