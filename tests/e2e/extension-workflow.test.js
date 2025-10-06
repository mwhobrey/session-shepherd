/**
 * E2E tests for Session Shepherd extension workflows
 * Tests complete user journeys through the extension
 */

const path = require('path');

describe('Session Shepherd E2E Tests', () => {
  beforeAll(async () => {
    // Create screenshots directory
    const fs = require('fs');
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  describe('Extension Loading', () => {
    test('should load extension popup successfully', async () => {
      await extensionHelpers.openExtension();
      
      // Verify popup loaded
      expect(await extensionHelpers.elementExists('.popup-container')).toBe(true);
      expect(await extensionHelpers.elementExists('#create-tab')).toBe(true);
      expect(await extensionHelpers.elementExists('#sessions-tab')).toBe(true);
      
      // Verify Create tab is active by default
      const createTab = await page.$('#create-tab');
      const isActive = await page.evaluate(el => el.classList.contains('active'), createTab);
      expect(isActive).toBe(true);
    });

    test('should display current tabs in Create tab', async () => {
      await extensionHelpers.openExtension();
      
      // Wait for tabs to load
      await page.waitForSelector('#tabs-list', { timeout: 10000 });
      
      // Check if tabs are displayed
      const tabItems = await page.$$('.tab-item');
      expect(tabItems.length).toBeGreaterThan(0);
      
      // Verify tab structure
      const firstTab = await page.$('.tab-item');
      const hasCheckbox = await page.evaluate(el => el.querySelector('.tab-checkbox'), firstTab);
      const hasTitle = await page.evaluate(el => el.querySelector('.tab-title'), firstTab);
      
      expect(hasCheckbox).toBeTruthy();
      expect(hasTitle).toBeTruthy();
    });
  });

  describe('Session Creation Workflow', () => {
    test('should create session with Save Only', async () => {
      await extensionHelpers.openExtension();
      
      // Enter session name
      await extensionHelpers.typeInElement('#session-name', 'Test Session 1');
      
      // Select a few tabs (uncheck some)
      const checkboxes = await page.$$('.tab-checkbox');
      if (checkboxes.length > 2) {
        // Uncheck the last checkbox
        await checkboxes[checkboxes.length - 1].click();
      }
      
      // Click Save Only
      await extensionHelpers.clickElement('#save-only');
      
      // Should switch to Sessions tab
      await page.waitForSelector('#sessions-content.active', { timeout: 5000 });
      
      // Verify session was created
      const sessionCards = await page.$$('.session-card');
      expect(sessionCards.length).toBeGreaterThan(0);
      
      // Verify session name
      const sessionName = await extensionHelpers.getElementText('.session-name');
      expect(sessionName).toBe('Test Session 1');
    });

    test('should create session with Save & Close', async () => {
      await extensionHelpers.openExtension();
      
      // Enter session name
      await extensionHelpers.typeInElement('#session-name', 'Test Session 2');
      
      // Select all tabs
      await extensionHelpers.clickElement('#select-all');
      
      // Click Save & Close
      await extensionHelpers.clickElement('#save-close');
      
      // Should switch to Sessions tab
      await page.waitForSelector('#sessions-content.active', { timeout: 5000 });
      
      // Verify session was created
      const sessionCards = await page.$$('.session-card');
      expect(sessionCards.length).toBeGreaterThan(0);
    });

    test('should validate session name input', async () => {
      await extensionHelpers.openExtension();
      
      // Try to save without name
      await extensionHelpers.clickElement('#save-only');
      
      // Should not switch tabs (validation failed)
      const createContent = await page.$('#create-content');
      const isActive = await page.evaluate(el => el.classList.contains('active'), createContent);
      expect(isActive).toBe(true);
      
      // Enter valid name
      await extensionHelpers.typeInElement('#session-name', 'Valid Session');
      
      // Buttons should be enabled
      const saveButton = await page.$('#save-only');
      const isDisabled = await page.evaluate(el => el.disabled, saveButton);
      expect(isDisabled).toBe(false);
    });
  });

  describe('Session Management Workflow', () => {
    beforeEach(async () => {
      // Create a test session first
      await extensionHelpers.openExtension();
      await extensionHelpers.typeInElement('#session-name', 'Test Session for Management');
      await extensionHelpers.clickElement('#save-only');
      await page.waitForSelector('#sessions-content.active', { timeout: 5000 });
    });

    test('should display sessions in Sessions tab', async () => {
      // Should be on Sessions tab
      const sessionsContent = await page.$('#sessions-content');
      const isActive = await page.evaluate(el => el.classList.contains('active'), sessionsContent);
      expect(isActive).toBe(true);
      
      // Should have session cards
      const sessionCards = await page.$$('.session-card');
      expect(sessionCards.length).toBeGreaterThan(0);
      
      // Should have session actions
      const restoreButton = await page.$('.session-button.restore');
      const deleteButton = await page.$('.session-button.delete');
      
      expect(restoreButton).toBeTruthy();
      expect(deleteButton).toBeTruthy();
    });

    test('should restore session', async () => {
      // Click restore button
      await extensionHelpers.clickElement('.session-button.restore');
      
      // Wait a moment for new window to open
      await page.waitForTimeout(2000);
      
      // This test would need to verify new window opened
      // In a real scenario, you'd check for new browser targets
    });

    test('should show delete confirmation dialog', async () => {
      // Click delete button
      await extensionHelpers.clickElement('.session-button.delete');
      
      // Should show confirmation dialog
      const dialog = await page.$('#confirmation-dialog');
      const isVisible = await page.evaluate(el => el.classList.contains('show'), dialog);
      expect(isVisible).toBe(true);
      
      // Should have cancel and confirm buttons
      const cancelButton = await page.$('#cancel-delete');
      const confirmButton = await page.$('#confirm-delete');
      
      expect(cancelButton).toBeTruthy();
      expect(confirmButton).toBeTruthy();
    });

    test('should cancel delete operation', async () => {
      // Click delete button
      await extensionHelpers.clickElement('.session-button.delete');
      
      // Click cancel
      await extensionHelpers.clickElement('#cancel-delete');
      
      // Dialog should be hidden
      const dialog = await page.$('#confirmation-dialog');
      const isVisible = await page.evaluate(el => el.classList.contains('show'), dialog);
      expect(isVisible).toBe(false);
      
      // Session should still exist
      const sessionCards = await page.$$('.session-card');
      expect(sessionCards.length).toBeGreaterThan(0);
    });

    test('should confirm delete operation', async () => {
      // Click delete button
      await extensionHelpers.clickElement('.session-button.delete');
      
      // Click confirm delete
      await extensionHelpers.clickElement('#confirm-delete');
      
      // Dialog should be hidden
      const dialog = await page.$('#confirmation-dialog');
      const isVisible = await page.evaluate(el => el.classList.contains('show'), dialog);
      expect(isVisible).toBe(false);
      
      // Should show empty state
      const emptyState = await page.$('#empty-state');
      const isEmptyVisible = await page.evaluate(el => el.style.display !== 'none', emptyState);
      expect(isEmptyVisible).toBe(true);
    });
  });

  describe('Tab Selection Controls', () => {
    test('should handle Select All functionality', async () => {
      await extensionHelpers.openExtension();
      
      // Click Select All
      await extensionHelpers.clickElement('#select-all');
      
      // All checkboxes should be checked
      const checkboxes = await page.$$('.tab-checkbox');
      for (const checkbox of checkboxes) {
        const isChecked = await page.evaluate(el => el.checked, checkbox);
        expect(isChecked).toBe(true);
      }
    });

    test('should handle Select None functionality', async () => {
      await extensionHelpers.openExtension();
      
      // Click Select None
      await extensionHelpers.clickElement('#select-none');
      
      // All checkboxes should be unchecked
      const checkboxes = await page.$$('.tab-checkbox');
      for (const checkbox of checkboxes) {
        const isChecked = await page.evaluate(el => el.checked, checkbox);
        expect(isChecked).toBe(false);
      }
    });

    test('should update button states based on selection', async () => {
      await extensionHelpers.openExtension();
      
      // Initially buttons should be disabled (no name)
      const saveButton = await page.$('#save-only');
      const isInitiallyDisabled = await page.evaluate(el => el.disabled, saveButton);
      expect(isInitiallyDisabled).toBe(true);
      
      // Enter session name
      await extensionHelpers.typeInElement('#session-name', 'Test Session');
      
      // Buttons should be enabled
      const isEnabled = await page.evaluate(el => !el.disabled, saveButton);
      expect(isEnabled).toBe(true);
    });
  });

  describe('Tab Switching', () => {
    test('should switch between Create and Sessions tabs', async () => {
      await extensionHelpers.openExtension();
      
      // Should start on Create tab
      const createContent = await page.$('#create-content');
      const isCreateActive = await page.evaluate(el => el.classList.contains('active'), createContent);
      expect(isCreateActive).toBe(true);
      
      // Switch to Sessions tab
      await extensionHelpers.clickElement('#sessions-tab');
      
      // Sessions tab should be active
      const sessionsContent = await page.$('#sessions-content');
      const isSessionsActive = await page.evaluate(el => el.classList.contains('active'), sessionsContent);
      expect(isSessionsActive).toBe(true);
      
      // Switch back to Create tab
      await extensionHelpers.clickElement('#create-tab');
      
      // Create tab should be active again
      const isCreateActiveAgain = await page.evaluate(el => el.classList.contains('active'), createContent);
      expect(isCreateActiveAgain).toBe(true);
    });
  });

  describe('Empty State Handling', () => {
    test('should show empty state when no sessions exist', async () => {
      await extensionHelpers.openExtension();
      
      // Switch to Sessions tab
      await extensionHelpers.clickElement('#sessions-tab');
      
      // Should show empty state
      const emptyState = await page.$('#empty-state');
      const isEmptyVisible = await page.evaluate(el => el.style.display !== 'none', emptyState);
      expect(isEmptyVisible).toBe(true);
      
      // Should have call-to-action button
      const ctaButton = await page.$('#go-to-create');
      expect(ctaButton).toBeTruthy();
    });

    test('should navigate to Create tab from empty state', async () => {
      await extensionHelpers.openExtension();
      
      // Switch to Sessions tab
      await extensionHelpers.clickElement('#sessions-tab');
      
      // Click call-to-action button
      await extensionHelpers.clickElement('#go-to-create');
      
      // Should switch to Create tab
      const createContent = await page.$('#create-content');
      const isCreateActive = await page.evaluate(el => el.classList.contains('active'), createContent);
      expect(isCreateActive).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid session names gracefully', async () => {
      await extensionHelpers.openExtension();
      
      // Try with empty name
      await extensionHelpers.typeInElement('#session-name', '   ');
      await extensionHelpers.clickElement('#save-only');
      
      // Should not switch tabs
      const createContent = await page.$('#create-content');
      const isActive = await page.evaluate(el => el.classList.contains('active'), createContent);
      expect(isActive).toBe(true);
    });

    test('should handle long session names', async () => {
      await extensionHelpers.openExtension();
      
      // Try with very long name
      const longName = 'A'.repeat(100);
      await extensionHelpers.typeInElement('#session-name', longName);
      
      // Input should be truncated
      const inputValue = await page.evaluate(() => document.getElementById('session-name').value);
      expect(inputValue.length).toBeLessThanOrEqual(50);
    });
  });
});
