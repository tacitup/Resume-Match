# Resume Matcher Chrome Extension

A powerful Chrome extension that analyzes your resume against job descriptions to help you optimize your applications and improve your job search success rate.

## Features

- **PDF Resume Upload**: Upload your resume in PDF format for analysis
- **Smart Job Description Extraction**: Automatically extracts job descriptions from popular job boards (LinkedIn, Indeed, Glassdoor, etc.)
- **Intelligent Matching Algorithm**: Uses keyword analysis and text similarity to calculate match scores
- **Visual Match Score**: Displays your compatibility percentage with an attractive circular progress indicator
- **Keyword Highlighting**: Highlights matching keywords directly on job posting pages
- **Cross-Browser Compatibility**: Built with WebExtensions API for compatibility with Chrome, Firefox, and Edge
- **Privacy-First**: All processing happens locally in your browser - your resume data never leaves your device

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `resume-matcher-extension` folder
5. The extension icon should appear in your Chrome toolbar

### Method 2: Install from Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once it's published.

## How to Use

### 1. Upload Your Resume

1. Click the Resume Matcher extension icon in your Chrome toolbar
2. Click "Drop your PDF resume here or browse files"
3. Select your PDF resume file (max 10MB)
4. Wait for the processing to complete

### 2. Analyze Job Postings

1. Navigate to any job posting page (LinkedIn, Indeed, Glassdoor, etc.)
2. Click the Resume Matcher extension icon
3. Click "Analyze Current Page"
4. View your match score and matched keywords

### 3. Highlight Keywords

1. After analyzing a job posting, click "Highlight on Page"
2. Matching keywords will be highlighted in yellow on the job description
3. Use "Clear Highlights" to remove the highlighting

## Supported Job Boards

The extension works on most job posting websites, with optimized support for:

- LinkedIn Jobs
- Indeed
- Glassdoor
- AngelList/Wellfound
- Company career pages
- Most other job boards

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension architecture for better security and performance
- **Service Worker**: Event-driven background script for efficient resource usage
- **Content Scripts**: Inject functionality into job posting pages
- **PDF.js Integration**: Client-side PDF text extraction for privacy
- **Local Storage**: Resume data stored securely in your browser

### Matching Algorithm

The extension uses a sophisticated matching algorithm that combines:

1. **Keyword Matching**: Identifies common keywords between your resume and job descriptions
2. **Text Similarity**: Uses Jaccard similarity to measure overall text compatibility
3. **Weighted Scoring**: Combines both metrics with configurable weights (70% keywords, 30% similarity)

### Privacy & Security

- **Local Processing**: All resume analysis happens in your browser
- **No Data Transmission**: Your resume content never leaves your device
- **Secure Storage**: Uses Chrome's secure storage APIs
- **Minimal Permissions**: Only requests necessary permissions (activeTab, storage)

## File Structure

```
resume-matcher-extension/
├── manifest.json              # Extension configuration
├── src/
│   ├── popup.html            # Extension popup interface
│   ├── popup.css             # Popup styling
│   ├── popup.js              # Popup functionality
│   ├── background.js         # Service worker
│   ├── content.js            # Content script for job pages
│   ├── pdf-processor.js      # PDF text extraction
│   └── error-handler.js      # Error handling utilities
├── assets/
│   ├── icon16.png           # Extension icons
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   ├── pdf.min.js           # PDF.js library
│   └── pdf.worker.min.js    # PDF.js web worker
└── README.md
```

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Firefox**: Compatible with WebExtensions API
- **Edge**: Compatible with Chromium-based Edge
- **Safari**: Requires adaptation for Safari Web Extensions

## Development

### Prerequisites

- Chrome browser with Developer mode enabled
- Basic knowledge of HTML, CSS, and JavaScript

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd resume-matcher-extension
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the project folder

3. Make changes to the code and reload the extension to test

### Testing

- Test on various job posting websites
- Try different PDF resume formats
- Verify error handling with invalid files
- Test cross-browser compatibility

## Troubleshooting

### Common Issues

**Extension not working on a job page:**
- Make sure you're on a job posting page with visible job description
- Try refreshing the page and analyzing again
- Check that the extension has permission to access the current site

**PDF upload fails:**
- Ensure the file is a valid PDF (not a scanned image)
- Check that the file size is under 10MB
- Try saving your resume as a new PDF file

**Low match scores:**
- Review the matched keywords to understand the analysis
- Consider updating your resume to include more relevant keywords
- Remember that the algorithm focuses on keyword matching

**Extension popup not opening:**
- Check that the extension is enabled in Chrome settings
- Try disabling other extensions temporarily
- Restart Chrome and try again

### Error Messages

The extension provides detailed error messages to help diagnose issues:

- **PDF Processing Error**: Issues with reading your resume file
- **Job Description Not Found**: Unable to extract job description from the current page
- **Storage Error**: Problems saving your resume data
- **Permission Error**: Extension lacks necessary permissions

## Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines

- Follow existing code style and structure
- Test thoroughly on multiple job boards
- Ensure cross-browser compatibility
- Update documentation for new features

## Privacy Policy

This extension is designed with privacy as a top priority:

- Your resume data is processed entirely within your browser
- No personal information is transmitted to external servers
- Resume text is stored locally using Chrome's secure storage APIs
- No analytics or tracking is performed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review existing issues on GitHub
3. Create a new issue with detailed information about the problem

## Changelog

### Version 1.0.0
- Initial release
- PDF resume upload and text extraction
- Job description analysis and matching
- Keyword highlighting functionality
- Support for major job boards
- Cross-browser compatibility

---

Made with ❤️ for job seekers everywhere!

