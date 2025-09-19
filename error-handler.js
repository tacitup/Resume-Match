// Error handling module for Resume Matcher extension
// Provides centralized error handling and user-friendly error messages

class ErrorHandler {
    constructor() {
        this.errorTypes = {
            PDF_PROCESSING: 'pdf_processing',
            JOB_EXTRACTION: 'job_extraction',
            STORAGE: 'storage',
            NETWORK: 'network',
            PERMISSION: 'permission',
            VALIDATION: 'validation',
            UNKNOWN: 'unknown'
        };
    }

    // Handle and categorize errors
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        const errorInfo = this.categorizeError(error);
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        
        return {
            type: errorInfo.type,
            message: userMessage,
            originalError: error,
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    // Categorize error based on type and message
    categorizeError(error) {
        const message = error.message || error.toString();
        const lowerMessage = message.toLowerCase();

        // PDF processing errors
        if (lowerMessage.includes('pdf') || 
            lowerMessage.includes('invalid pdf') ||
            lowerMessage.includes('corrupted') ||
            error.name === 'InvalidPDFException' ||
            error.name === 'MissingPDFException') {
            return { type: this.errorTypes.PDF_PROCESSING, severity: 'high' };
        }

        // Job extraction errors
        if (lowerMessage.includes('job description') ||
            lowerMessage.includes('extract') ||
            lowerMessage.includes('content script')) {
            return { type: this.errorTypes.JOB_EXTRACTION, severity: 'medium' };
        }

        // Storage errors
        if (lowerMessage.includes('storage') ||
            lowerMessage.includes('quota') ||
            lowerMessage.includes('store') ||
            lowerMessage.includes('save')) {
            return { type: this.errorTypes.STORAGE, severity: 'medium' };
        }

        // Network errors
        if (lowerMessage.includes('network') ||
            lowerMessage.includes('fetch') ||
            lowerMessage.includes('connection') ||
            error.name === 'NetworkError') {
            return { type: this.errorTypes.NETWORK, severity: 'low' };
        }

        // Permission errors
        if (lowerMessage.includes('permission') ||
            lowerMessage.includes('access') ||
            lowerMessage.includes('denied') ||
            lowerMessage.includes('tab')) {
            return { type: this.errorTypes.PERMISSION, severity: 'high' };
        }

        // Validation errors
        if (lowerMessage.includes('invalid') ||
            lowerMessage.includes('required') ||
            lowerMessage.includes('format') ||
            lowerMessage.includes('size')) {
            return { type: this.errorTypes.VALIDATION, severity: 'medium' };
        }

        return { type: this.errorTypes.UNKNOWN, severity: 'medium' };
    }

    // Get user-friendly error messages
    getUserFriendlyMessage(errorInfo) {
        const messages = {
            [this.errorTypes.PDF_PROCESSING]: {
                title: 'PDF Processing Error',
                message: 'Unable to read your resume PDF. Please ensure it\'s a valid, text-based PDF file (not a scanned image) and try again.',
                suggestions: [
                    'Make sure the PDF is not password-protected',
                    'Try saving your resume as a new PDF',
                    'Ensure the PDF contains selectable text, not just images'
                ]
            },
            [this.errorTypes.JOB_EXTRACTION]: {
                title: 'Job Description Not Found',
                message: 'Could not find a job description on this page. Please make sure you\'re on a job posting page.',
                suggestions: [
                    'Navigate to a job posting page (LinkedIn, Indeed, etc.)',
                    'Make sure the page has fully loaded',
                    'Try refreshing the page and try again'
                ]
            },
            [this.errorTypes.STORAGE]: {
                title: 'Storage Error',
                message: 'Unable to save your resume data. Your browser storage might be full.',
                suggestions: [
                    'Clear some browser data to free up space',
                    'Try uploading a smaller resume file',
                    'Restart your browser and try again'
                ]
            },
            [this.errorTypes.NETWORK]: {
                title: 'Connection Error',
                message: 'Network connection issue. Please check your internet connection and try again.',
                suggestions: [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Disable other extensions temporarily'
                ]
            },
            [this.errorTypes.PERMISSION]: {
                title: 'Permission Error',
                message: 'The extension doesn\'t have permission to access this page. Please refresh the page and try again.',
                suggestions: [
                    'Refresh the current page',
                    'Make sure the extension is enabled',
                    'Try on a different job posting site'
                ]
            },
            [this.errorTypes.VALIDATION]: {
                title: 'Invalid Input',
                message: 'The file or data provided is not valid. Please check your input and try again.',
                suggestions: [
                    'Make sure you\'re uploading a PDF file',
                    'Check that the file size is under 10MB',
                    'Ensure the file is not corrupted'
                ]
            },
            [this.errorTypes.UNKNOWN]: {
                title: 'Unexpected Error',
                message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
                suggestions: [
                    'Try refreshing the page',
                    'Restart your browser',
                    'Disable other extensions temporarily'
                ]
            }
        };

        return messages[errorInfo.type] || messages[this.errorTypes.UNKNOWN];
    }

    // Validate file input
    validateFile(file) {
        const errors = [];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!file) {
            errors.push("No file selected");
        } else {
            if (file.type !== "application/pdf") {
                errors.push("File must be a PDF (.pdf)");
            }

            if (file.size === 0) {
                errors.push("File appears to be empty");
            }

            if (file.size > maxSize) {
                errors.push(`File size (${this.formatFileSize(file.size)}) exceeds the 10MB limit`);
            }

            // Basic file name validation: only check for .pdf extension and prevent path traversal
            if (!file.name.toLowerCase().endsWith(".pdf")) {
                errors.push("File must have a .pdf extension");
            }
            if (file.name.includes("/") || file.name.includes("\\")) {
                errors.push("File name cannot contain path separators");
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate job description text
    validateJobDescription(text) {
        const errors = [];
        const minLength = 100;
        const maxLength = 50000;

        if (!text || typeof text !== 'string') {
            errors.push('No job description text provided');
        } else {
            const trimmedText = text.trim();
            
            if (trimmedText.length < minLength) {
                errors.push(`Job description is too short (minimum ${minLength} characters)`);
            }

            if (trimmedText.length > maxLength) {
                errors.push(`Job description is too long (maximum ${maxLength} characters)`);
            }

            // Check if it looks like a job description
            const jobKeywords = ['job', 'position', 'role', 'responsibilities', 'requirements', 'qualifications', 'experience', 'skills'];
            const hasJobKeywords = jobKeywords.some(keyword => 
                trimmedText.toLowerCase().includes(keyword)
            );

            if (!hasJobKeywords) {
                errors.push('Text doesn\'t appear to be a job description');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Log error for debugging
    logError(error, context) {
        const errorData = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location?.href
        };

        console.error('Resume Matcher Error:', errorData);
        
        // In a production environment, you might want to send this to an error tracking service
        // this.sendToErrorTracking(errorData);
    }

    // Check browser compatibility
    checkBrowserCompatibility() {
        const issues = [];

        // Check for required APIs
        if (!window.chrome || !chrome.runtime) {
            issues.push('Chrome extension APIs not available');
        }

        if (!window.FileReader) {
            issues.push('FileReader API not supported');
        }

        if (!window.ArrayBuffer) {
            issues.push('ArrayBuffer not supported');
        }

        // Check for PDF.js requirements
        if (!window.Worker) {
            issues.push('Web Workers not supported (required for PDF processing)');
        }

        return {
            isCompatible: issues.length === 0,
            issues: issues
        };
    }

    // Recovery suggestions based on error type
    getRecoverySuggestions(errorType) {
        const suggestions = {
            [this.errorTypes.PDF_PROCESSING]: [
                'Try converting your resume to a different PDF format',
                'Use a PDF that contains selectable text (not scanned images)',
                'Reduce the file size if it\'s very large'
            ],
            [this.errorTypes.JOB_EXTRACTION]: [
                'Make sure you\'re on a job posting page',
                'Try scrolling down to load more content',
                'Switch to a different job board (LinkedIn, Indeed, etc.)'
            ],
            [this.errorTypes.STORAGE]: [
                'Clear browser cache and cookies',
                'Free up disk space on your computer',
                'Try using the extension in an incognito window'
            ],
            [this.errorTypes.PERMISSION]: [
                'Refresh the current page',
                'Check that the extension is enabled in Chrome settings',
                'Try disabling other extensions temporarily'
            ]
        };

        return suggestions[errorType] || [
            'Try refreshing the page',
            'Restart your browser',
            'Contact support if the problem persists'
        ];
    }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    window.errorHandler = errorHandler;
}


