# Manual Testing Guide for Session Shepherd

Since E2E tests for Chrome extensions require complex setup, here's a comprehensive manual testing guide to verify all functionality.

## 🚀 **Quick Setup**

1. **Load the Extension**:
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select `session-shepherd` folder
   - Pin the extension to toolbar

2. **Prepare Test Environment**:
   - Open 5-6 tabs in your current window
   - Mix of different websites (Google, GitHub, Stack Overflow, etc.)

## 🧪 **Test Scenarios**

### **Test 1: Basic Interface**
- [ ] Click Session Shepherd icon
- [ ] Verify popup opens with Create tab active
- [ ] Check Material Design styling looks good
- [ ] Verify all tabs are listed with checkboxes
- [ ] Confirm all tabs are selected by default

### **Test 2: Tab Selection**
- [ ] Uncheck a few tabs manually
- [ ] Click "Select None" → All should uncheck
- [ ] Click "Select All" → All should check
- [ ] Verify visual feedback (hover states, selection states)

### **Test 3: Session Creation (Save Only)**
- [ ] Enter session name: "Test Session 1"
- [ ] Select 3-4 tabs (not all)
- [ ] Click "Save Only"
- [ ] Verify: Switches to Sessions tab
- [ ] Verify: Selected tabs remain open
- [ ] Verify: Session appears in list

### **Test 4: Session Creation (Save & Close)**
- [ ] Switch back to Create tab
- [ ] Enter session name: "Test Session 2"
- [ ] Select 2-3 tabs
- [ ] Click "Save & Close"
- [ ] Verify: Selected tabs close
- [ ] Verify: Remaining tabs stay open
- [ ] Verify: Session appears in Sessions tab

### **Test 5: Orphan Window Handling**
- [ ] Create new session with ALL tabs selected
- [ ] Use "Save & Close"
- [ ] Verify: Window doesn't close
- [ ] Verify: Navigates to new tab page
- [ ] Verify: Session is saved

### **Test 6: Session Management**
- [ ] Go to Sessions tab
- [ ] Click "Restore" on a session
- [ ] Verify: New window opens with session tabs
- [ ] Click "Delete" on a session
- [ ] Verify: Confirmation dialog appears
- [ ] Test "Cancel" → Dialog closes, session remains
- [ ] Test "Delete" → Session is removed

### **Test 7: Empty State**
- [ ] Delete all sessions
- [ ] Verify: Empty state message appears
- [ ] Click "Create Your First Session"
- [ ] Verify: Switches to Create tab

### **Test 8: Form Validation**
- [ ] Try to save without session name
- [ ] Verify: Buttons remain disabled
- [ ] Try to save without selecting tabs
- [ ] Verify: Buttons remain disabled
- [ ] Enter valid name and select tabs
- [ ] Verify: Buttons become enabled

### **Test 9: Tab Persistence**
- [ ] Switch to Sessions tab
- [ ] Close and reopen popup
- [ ] Verify: Sessions tab is still active

### **Test 10: Edge Cases**
- [ ] Test with very long session names (should truncate)
- [ ] Test with special characters in session names
- [ ] Test with many tabs (10+)
- [ ] Test with many sessions (5+)

## 🎯 **Success Criteria**

The extension is working correctly if:
- [ ] All core functionality works smoothly
- [ ] UI looks professional and follows Material Design
- [ ] No JavaScript errors in console
- [ ] Sessions persist between browser restarts
- [ ] Edge cases are handled gracefully

## 🐛 **Debugging Tips**

If something doesn't work:

1. **Check Console**:
   - Right-click in popup → "Inspect"
   - Look for JavaScript errors

2. **Check Extension Permissions**:
   - Go to `chrome://extensions/`
   - Verify Session Shepherd has proper permissions

3. **Check Storage**:
   - In DevTools → Application → Storage → Local Storage
   - Look for session data

4. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click "Reload" on Session Shepherd

## 📊 **Test Results**

After completing all tests, you should have:
- ✅ Created multiple sessions
- ✅ Tested both Save Only and Save & Close
- ✅ Verified session restoration
- ✅ Tested session deletion
- ✅ Confirmed empty state handling
- ✅ Validated form inputs
- ✅ Verified tab persistence

## 🚀 **Ready for Production**

Once all manual tests pass, the extension is ready for:
- User testing
- Production deployment
- Feature enhancements

The unit tests provide automated coverage, and manual testing ensures real-world functionality works perfectly!
