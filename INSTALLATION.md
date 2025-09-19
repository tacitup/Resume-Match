# Installation Instructions for Resume Matcher Chrome Extension

This guide will walk you through installing the Resume Matcher Chrome extension on your browser.

## Chrome Installation (Recommended)

### Method 1: Developer Mode Installation

Since this extension is not yet published on the Chrome Web Store, you'll need to install it in developer mode:

1. **Download the Extension**
   - Download the `resume-matcher-extension` folder to your computer
   - Make sure all files are present (manifest.json, src/, assets/, lib/ folders)

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - Or go to Chrome menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - In the top-right corner of the Extensions page, toggle on "Developer mode"
   - You should see additional buttons appear

4. **Load the Extension**
   - Click the "Load unpacked" button
   - Navigate to and select the `resume-matcher-extension` folder
   - Click "Select Folder" (Windows) or "Open" (Mac)

5. **Verify Installation**
   - The Resume Matcher extension should appear in your extensions list
   - You should see the extension icon in your Chrome toolbar
   - If the icon isn't visible, click the puzzle piece icon (🧩) and pin Resume Matcher

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store in the future. Once published, you can install it directly from there.

## Firefox Installation

The extension is compatible with Firefox using the WebExtensions API:

1. **Prepare the Extension**
   - Download the extension files
   - Ensure all files are present

2. **Open Firefox Add-ons Page**
   - Open Firefox
   - Type `about:debugging` in the address bar
   - Click "This Firefox" in the left sidebar

3. **Load Temporary Add-on**
   - Click "Load Temporary Add-on..."
   - Navigate to the extension folder
   - Select the `manifest.json` file
   - Click "Open"

4. **Verify Installation**
   - The extension should appear in your add-ons list
   - Look for the Resume Matcher icon in your Firefox toolbar

**Note**: In Firefox, the extension will be temporary and will be removed when you restart the browser. For permanent installation, the extension needs to be signed by Mozilla.

## Microsoft Edge Installation

Edge (Chromium-based) supports Chrome extensions:

1. **Enable Developer Mode**
   - Open Microsoft Edge
   - Go to `edge://extensions/`
   - Toggle on "Developer mode" in the left sidebar

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `resume-matcher-extension` folder
   - Click "Select Folder"

3. **Verify Installation**
   - The extension should appear in your extensions list
   - Check for the icon in your Edge toolbar

## Troubleshooting Installation

### Common Installation Issues

**"Manifest file is missing or unreadable"**
- Make sure you selected the correct folder containing `manifest.json`
- Verify that the manifest.json file is not corrupted
- Check that you have read permissions for the folder

**"Extension failed to load"**
- Ensure all required files are present in the extension folder
- Check that the lib/ folder contains the PDF.js files
- Verify that all image files are present in the assets/ folder

**Extension icon not visible**
- Click the extensions icon (puzzle piece 🧩) in your browser toolbar
- Pin the Resume Matcher extension to make it always visible
- Check that the extension is enabled in your extensions list

**"This extension may have been corrupted"**
- Re-download the extension files
- Make sure no files were modified or corrupted during download
- Try loading the extension from a different location

### Permissions

The extension requires the following permissions:
- **activeTab**: To access the current tab's content for job description extraction
- **storage**: To save your resume data locally

These permissions are automatically granted when you install the extension.

## Updating the Extension

When a new version is available:

1. **Download the Updated Files**
   - Download the new version of the extension
   - Replace the old extension folder with the new one

2. **Reload the Extension**
   - Go to your browser's extensions page
   - Find Resume Matcher in the list
   - Click the reload icon (🔄) or "Reload" button

3. **Verify the Update**
   - Check that the version number has updated
   - Test the extension to ensure it's working properly

## Uninstalling the Extension

To remove the extension:

1. **Chrome/Edge**:
   - Go to `chrome://extensions/` or `edge://extensions/`
   - Find Resume Matcher in the list
   - Click "Remove" and confirm

2. **Firefox**:
   - Go to `about:addons`
   - Find Resume Matcher in the list
   - Click the three dots menu and select "Remove"

## Security Considerations

- The extension only requests minimal permissions
- All processing happens locally in your browser
- Your resume data is never transmitted to external servers
- The extension uses Chrome's secure storage APIs

## Getting Help

If you encounter issues during installation:

1. Check this troubleshooting section first
2. Ensure you're using a supported browser version
3. Try installing on a different browser to isolate the issue
4. Create an issue on the project's GitHub page with:
   - Your browser version
   - Operating system
   - Exact error message
   - Steps you followed

## System Requirements

- **Chrome**: Version 88 or later (for Manifest V3 support)
- **Firefox**: Version 109 or later (for WebExtensions compatibility)
- **Edge**: Chromium-based Edge (version 88 or later)
- **Operating System**: Windows, macOS, or Linux
- **Storage**: At least 5MB of free space for the extension files

## Next Steps

After successful installation:

1. Click the Resume Matcher icon in your toolbar
2. Upload your PDF resume
3. Navigate to a job posting page
4. Click "Analyze Current Page" to see your match score

Enjoy using Resume Matcher to optimize your job applications!

