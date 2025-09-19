// Content script for Resume Matcher extension
// Runs on all web pages to extract job descriptions

console.log('Resume Matcher content script loaded');

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  switch (request.action) {
    case 'extractJobDescription':
      extractJobDescription(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'highlightKeywords':
      highlightKeywords(request.keywords);
      sendResponse({ success: true });
      break;
      
    case 'clearHighlights':
      clearHighlights();
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ error: 'Unknown action' });
  }
});

// Extract job description text from the current page
function extractJobDescription(sendResponse) {
  try {
    let jobText = '';
    
    // Try different selectors commonly used for job descriptions
    const selectors = [
      // LinkedIn
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.job-description',
      '.jobs-description__content',
      '.jobs-description-content',
      
      // Indeed
      '.jobsearch-jobDescriptionText',
      '#jobDescriptionText',
      '.jobsearch-JobComponent-description',
      '.jobsearch-SerpJobCard-description',
      '.jobsearch-jobDescriptionText div',
      
      // Glassdoor
      '.jobDescriptionContent',
      '.desc',
      '.jobDescriptionWrapper',
      '.jobDesc',
      
      // AngelList/Wellfound
      '.job-description',
      '.startup-job-listing-description',
      '.job-listing-description',
      
      // ZipRecruiter
      '.job_description',
      '.jobDescriptionSection',
      
      // Monster
      '.job-description',
      '.jobview-description',
      
      // CareerBuilder
      '.job-description',
      '.data-details',
      
      // Dice
      '.job-description',
      '.jobdescSec',
      
      // Stack Overflow Jobs
      '.job-description',
      '.job-details',
      
      // Remote.co
      '.job_description',
      '.job-description',
      
      // FlexJobs
      '.job-description',
      '.JobDescription',
      
      // Snap-on (specific case from previous debugging)
      '.job-description',
      '.job-details',
      '.content-area',
      '.main-content',
      
      // Generic selectors
      '[class*="job-description"]',
      '[class*="jobdescription"]',
      '[class*="job_description"]',
      '[class*="description"]',
      '[class*="job-detail"]',
      '[class*="jobdetail"]',
      '[id*="job-description"]',
      '[id*="jobdescription"]',
      '[id*="description"]',
      '[data-testid*="description"]',
      '[data-cy*="description"]',
      
      // Fallback to common content areas
      'main',
      '.main',
      '.content',
      '#content',
      'article',
      '.article',
      '.post-content',
      '.entry-content'
    ];
    
    // Try each selector until we find content
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        const text = element.innerText || element.textContent || '';
        
        // Check if this looks like a job description (has reasonable length and job-related keywords)
        if (text.length > 200 && containsJobKeywords(text)) {
          jobText = text;
          console.log("Found job description using selector:", selector);
          break;
        }
      }
      
      if (jobText) break;
    }

    // Try to extract from iframes if no jobText found yet
    if (!jobText) {
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            const iframeBodyText = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
            if (iframeBodyText.length > 500 && iframeBodyText.length < 20000 && containsJobKeywords(iframeBodyText)) {
              jobText = iframeBodyText;
              console.log("Found job description in iframe:", iframe.id || iframe.name || iframe.src);
              break;
            }
          }
        } catch (e) {
          console.warn("Could not access iframe content (likely cross-origin):", iframe.src, e);
        }
      }
    }
    
    // If no specific job description found, try to get the main content
    if (!jobText) {
      console.warn("No specific job description found, attempting broader search.");
      const bodyText = document.body.innerText || document.body.textContent || "";
      
      // Use body text if it's not too short or too long, and contains job-related keywords
      if (bodyText.length > 500 && bodyText.length < 20000 && containsJobKeywords(bodyText)) {
        jobText = bodyText;
        console.log("Using body text as fallback for job description.");
      } else {
        console.error("Fallback to body text failed: length", bodyText.length, "contains keywords:", containsJobKeywords(bodyText));
        
        // Final fallback: use whatever text we can find, even if it's not ideal
        if (bodyText.length > 100) {
          console.log("Using body text as last resort");
          jobText = bodyText;
        } else {
          sendResponse({ 
            success: false,
            error: "Could not find job description on this page. Please make sure you are on a job posting page."
          });
          return;
        }
      }
    }
    
    // Clean up the text
    jobText = cleanText(jobText);
    
    console.log('Final job text length:', jobText.length);
    console.log('Final job text sample:', jobText.substring(0, 200));
    
    sendResponse({
      success: true,
      jobText: jobText,
      url: window.location.href,
      title: document.title
    });
    
  } catch (error) {
    console.error('Error extracting job description:', error);
    sendResponse({ 
      success: false,
      error: error.message || 'Failed to extract job description from this page'
    });
  }
}

// Check if text contains job-related keywords
function containsJobKeywords(text) {
  const jobKeywords = [
    // Core job posting terms
    'responsibilities', 'requirements', 'qualifications', 'experience',
    'skills', 'education', 'salary', 'benefits', 'position', 'role',
    'job', 'career', 'work', 'employment', 'candidate', 'apply',
    'years', 'degree', 'bachelor', 'master', 'certification',
    'manager', 'product', 'development', 'team', 'company',
    'overview', 'description', 'duties', 'location', 'department',
    
    // Additional job-related terms
    'hiring', 'recruit', 'opening', 'opportunity', 'vacancy',
    'full-time', 'part-time', 'contract', 'remote', 'onsite',
    'preferred', 'required', 'must have', 'should have',
    'we are looking', 'seeking', 'join our team', 'about the role',
    'what you will do', 'what we offer', 'compensation',
    'professional', 'expertise', 'background', 'knowledge',
    'collaborate', 'manage', 'lead', 'develop', 'implement',
    'analyze', 'design', 'create', 'maintain', 'support',
    
    // Technical and business terms
    'software', 'technology', 'engineering', 'marketing',
    'sales', 'finance', 'operations', 'human resources',
    'project', 'program', 'strategy', 'business', 'client',
    'customer', 'stakeholder', 'process', 'system', 'platform',
    
    // Common job titles and levels
    'senior', 'junior', 'lead', 'principal', 'director',
    'coordinator', 'specialist', 'analyst', 'consultant',
    'associate', 'executive', 'supervisor', 'administrator'
  ];
  
  const lowerText = text.toLowerCase();
  const matchedKeywords = jobKeywords.filter(keyword => lowerText.includes(keyword));
  
  console.log('DEBUG: containsJobKeywords - Text length:', text.length);
  console.log('DEBUG: containsJobKeywords - Matched keywords:', matchedKeywords);
  console.log('DEBUG: containsJobKeywords - Text sample (first 200 chars):', text.substring(0, 200));
  
  // Require at least 2 job-related keywords for better accuracy
  const hasJobKeywords = matchedKeywords.length >= 2;
  console.log('DEBUG: containsJobKeywords - Result:', hasJobKeywords);
  
  return hasJobKeywords;
}

// Clean and normalize text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
}

// Highlight keywords on the page
function highlightKeywords(keywords) {
  if (!keywords || keywords.length === 0) return;
  
  // Remove existing highlights first
  clearHighlights();
  
  // Create a regex pattern for all keywords
  const pattern = keywords.map(keyword => escapeRegExp(keyword)).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  
  // Find all text nodes and highlight keywords
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (regex.test(node.textContent)) {
      textNodes.push(node);
    }
  }
  
  // Highlight keywords in text nodes
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const wrapper = document.createElement('span');
    wrapper.innerHTML = textNode.textContent.replace(regex, '<mark class="resume-matcher-highlight" style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
    
    parent.insertBefore(wrapper, textNode);
    parent.removeChild(textNode);
  });
  
  console.log(`Highlighted ${keywords.length} keywords on the page`);
}

// Clear all highlights
function clearHighlights() {
  const highlights = document.querySelectorAll('.resume-matcher-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Merge adjacent text nodes
  });
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Auto-extract job description when page loads (optional)
// This can be enabled if users want automatic detection
/*
window.addEventListener('load', () => {
  setTimeout(() => {
    extractJobDescription((result) => {
      if (result.success) {
        console.log('Auto-extracted job description:', result.jobText.substring(0, 200) + '...');
      }
    });
  }, 2000); // Wait 2 seconds for page to fully load
});
*/

