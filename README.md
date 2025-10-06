# Session Shepherd

A beautiful, intuitive Chrome extension for managing browser tab sessions. Save groups of tabs as named "sessions," close them to free up memory and mental space, and restore them perfectly later.

## Features

- **Tabbed Interface**: Clean "Create" and "Sessions" tabs for easy navigation
- **Session Creation**: Select tabs, name your session, and save with one click
- **Smart Tab Management**: "Save & Close" or "Save Only" options
- **Session Restoration**: Restore entire sessions in new windows
- **Material Design**: Beautiful, modern UI following Google's design principles
- **Orphan Window Handling**: Prevents closing the last tab in a window
- **Confirmation Dialogs**: Safe deletion with confirmation prompts

## Installation

### Development Setup

1. **Clone or download** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in the top right)
4. **Click "Load unpacked"** and select the `session-shepherd` folder
5. **Pin the extension** to your toolbar for easy access

### Icon Assets

**Important**: The current icon files are placeholders. For production use, replace the following files with actual PNG images:

- `assets/icons/icon16.png` (16x16 pixels)
- `assets/icons/icon48.png` (48x48 pixels) 
- `assets/icons/icon128.png` (128x128 pixels)

You can use the provided `assets/icons/icon.svg` as a reference for the design.

## Usage

### Creating a Session

1. **Click the Session Shepherd icon** in your toolbar
2. **Select tabs** you want to save (all are selected by default)
3. **Enter a session name** (required)
4. **Choose your action**:
   - **"Save & Close"**: Saves the session and closes selected tabs
   - **"Save Only"**: Saves the session but keeps tabs open

### Managing Sessions

1. **Switch to the "Sessions" tab** to see all saved sessions
2. **Restore a session**: Click "Restore" to open all tabs in a new window
3. **Delete a session**: Click "Delete" and confirm the action

### Tips

- **Session names** are limited to 50 characters
- **All tabs** in the current window are selected by default
- **Use "Select All"** or **"Select None"** for quick selection
- **Empty state** shows helpful guidance when no sessions exist
- **The extension remembers** your last used tab

## Technical Details

- **Manifest V3** Chrome extension
- **Vanilla JavaScript** (no external frameworks)
- **Material Design** styling
- **Chrome Storage API** for data persistence
- **Chrome Tabs API** for tab management
- **Chrome Windows API** for window creation

## Project Structure

```
session-shepherd/
├── manifest.json              # Extension manifest
├── popup/
│   ├── popup.html            # Main popup interface
│   ├── popup.css             # Material Design styling
│   └── popup.js              # Core functionality
├── background/
│   └── background.js          # Service worker
├── assets/
│   ├── icons/                # Extension icons
│   └── images/               # UI assets
└── README.md                 # This file
```

## Data Storage

Sessions are stored locally using Chrome's storage API with the following structure:

```json
[
  {
    "id": 1696458960000,
    "name": "Q4 Project",
    "tabs": [
      {
        "title": "Google Docs Report",
        "url": "https://docs.google.com/...",
        "favIconUrl": "https://docs.google.com/favicon.ico"
      }
    ],
    "createdAt": "2023-10-04T17:42:00.000Z"
  }
]
```

## Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Not supported (different extension system)
- **Safari**: Not supported (different extension system)

## Development

### Prerequisites

- Chrome browser (latest version)
- Basic understanding of Chrome extensions
- No additional build tools required

### Making Changes

1. **Edit the source files** in the project directory
2. **Reload the extension** in `chrome://extensions/`
3. **Test your changes** by clicking the extension icon

### Debugging

- **Open Developer Tools** in the popup (right-click → Inspect)
- **Check the Console** for JavaScript errors
- **Use Chrome DevTools** for CSS debugging
- **Monitor storage** in Application tab → Storage → Local Storage

## Future Enhancements (v1.1+)

- **Tab filtering** in the Create tab
- **Session content preview** (expand to see URLs)
- **Session categories** and tags
- **Import/export** functionality
- **Keyboard shortcuts**
- **Auto-save** functionality
- **Session sharing**

## License

This project is open source. Feel free to use, modify, and distribute according to your needs.

## Support

For issues, feature requests, or questions:

1. **Check the console** for error messages
2. **Verify permissions** in the manifest
3. **Test in a clean Chrome profile**
4. **Report issues** with detailed steps to reproduce

---

**Session Shepherd** - Because your browser tabs deserve better management.

