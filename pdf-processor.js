// PDF processing module using PDF.js
// This module handles PDF text extraction for the Resume Matcher extension

class PDFProcessor {
    constructor() {
        this.pdfjsLib = null;
        this.initialized = false;
    }

    // Initialize PDF.js library
    async init() {
        if (this.initialized) return;

        try {
            // Load PDF.js library
            // PDF.js is now loaded directly in popup.html, so it should be available globally
            if (typeof window !== 'undefined' && window.pdfjsLib) {
                this.pdfjsLib = window.pdfjsLib;
            } else {
                throw new Error('PDF.js library not found. Ensure it is loaded correctly.');
            }

            // Set worker source
            this.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.min.js");
            
            this.initialized = true;
            console.log('PDF.js initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PDF.js:', error);
            throw new Error('Failed to initialize PDF processor');
        }
    }

    // Extract text from PDF file
    async extractText(file) {
        if (!this.initialized) {
            await this.init();
        }

        try {
            // Convert file to ArrayBuffer
            const arrayBuffer = await this.fileToArrayBuffer(file);
            
            // Load PDF document
            const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            console.log(`PDF loaded: ${pdf.numPages} pages`);
            
            let fullText = '';
            
            // Extract text from each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    
                    // Combine text items
                    const pageText = textContent.items
                        .map(item => item.str)
                        .join(' ');
                    
                    fullText += pageText + '\n';
                    
                    console.log(`Extracted text from page ${pageNum}: ${pageText.length} characters`);
                } catch (pageError) {
                    console.warn(`Error extracting text from page ${pageNum}:`, pageError);
                    // Continue with other pages
                }
            }
            
            // Clean up the extracted text
            const cleanedText = this.cleanText(fullText);
            
            if (cleanedText.length < 100) {
                throw new Error('Extracted text is too short. The PDF might be image-based or corrupted.');
            }
            
            console.log(`Total extracted text: ${cleanedText.length} characters`);
            return cleanedText;
            
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            
            // Provide more specific error messages
            if (error.name === 'InvalidPDFException') {
                throw new Error('Invalid PDF file. Please make sure the file is a valid PDF.');
            } else if (error.name === 'MissingPDFException') {
                throw new Error('PDF file appears to be corrupted or empty.');
            } else if (error.name === 'UnexpectedResponseException') {
                throw new Error('Unable to read PDF file. It might be password-protected or corrupted.');
            } else {
                throw new Error(`Failed to extract text from PDF: ${error.message}`);
            }
        }
    }

    // Convert File object to ArrayBuffer
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // Clean and normalize extracted text
    cleanText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove control characters
            .replace(/[\x00-\x1F\x7F]/g, ' ')
            // Remove multiple consecutive spaces
            .replace(/ {2,}/g, ' ')
            // Trim whitespace
            .trim();
    }

    // Validate PDF file
    validateFile(file) {
        const errors = [];
        
        if (!file) {
            errors.push('No file provided');
        } else {
            if (file.type !== 'application/pdf') {
                errors.push('File must be a PDF');
            }
            
            if (file.size === 0) {
                errors.push('File is empty');
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                errors.push('File size must be less than 10MB');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Get file info
    getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
        };
    }
}

// Create global instance
const pdfProcessor = new PDFProcessor();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFProcessor;
} else if (typeof window !== 'undefined') {
    window.PDFProcessor = PDFProcessor;
    window.pdfProcessor = pdfProcessor;
}

