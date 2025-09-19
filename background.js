// Background service worker for Resume Matcher extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Resume Matcher extension installed');
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  try {
    switch (request.action) {
      case 'processJobDescription':
        handleJobDescriptionProcessing(request.data, sendResponse);
        return true; // Keep message channel open for async response
        
      case 'getStoredResume':
        getStoredResume(sendResponse);
        return true;
        
      case 'storeResume':
        storeResume(request.data, sendResponse);
        return true;
        
      case 'clearStoredResume':
        clearStoredResume(sendResponse);
        return true;
        
      case 'calculateMatch':
        calculateMatch(request.resumeText, request.jobText, sendResponse);
        return true;
        
      default:
        console.log('Unknown action:', request.action);
        sendResponse({ success: false, error: 'Unknown action' });
        return false;
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
    return false;
  }
});

// Process job description text and calculate match
async function handleJobDescriptionProcessing(jobText, sendResponse) {
  try {
    console.log('Processing job description:', jobText?.substring(0, 100) + '...');
    
    // Get stored resume
    const result = await chrome.storage.local.get(['resumeText']);
    
    if (!result.resumeText || result.resumeText.trim() === '') {
      sendResponse({ 
        success: false,
        error: 'No resume found. Please upload your resume first.' 
      });
      return;
    }
    
    console.log('Found stored resume, calculating match...');
    
    // Calculate match
    const matchResult = await performMatching(result.resumeText, jobText);
    
    console.log('Match calculation complete:', matchResult);
    
    sendResponse({
      success: true,
      matchScore: matchResult.score,
      matchedKeywords: matchResult.matchedKeywords,
      resumeKeywords: matchResult.resumeKeywords,
      jobKeywords: matchResult.jobKeywords
    });
    
  } catch (error) {
    console.error('Error processing job description:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to process job description' 
    });
  }
}

// Get stored resume from local storage
async function getStoredResume(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['resumeText', 'resumeFileName', 'uploadDate']);
    sendResponse({
      success: true,
      resumeText: result.resumeText || "",
      fileName: result.resumeFileName || null,
      uploadDate: result.uploadDate || null
    });
  } catch (error) {
    console.error('Error getting stored resume:', error);
    sendResponse({ error: error.message });
  }
}

// Store resume text in local storage
async function storeResume(data, sendResponse) {
  try {
    await chrome.storage.local.set({
      resumeText: data.text,
      resumeFileName: data.fileName,
      uploadDate: new Date().toISOString()
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error storing resume:', error);
    sendResponse({ error: error.message });
  }
}

// Clear stored resume from local storage
async function clearStoredResume(sendResponse) {
  try {
    await chrome.storage.local.remove(['resumeText', 'resumeFileName', 'uploadDate']);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error clearing stored resume:', error);
    sendResponse({ error: error.message });
  }
}

// Calculate match between resume and job description
async function calculateMatch(resumeText, jobText, sendResponse) {
  try {
    const matchResult = await performMatching(resumeText, jobText);
    sendResponse({
      success: true,
      matchScore: matchResult.score,
      matchedKeywords: matchResult.matchedKeywords,
      resumeKeywords: matchResult.resumeKeywords,
      jobKeywords: matchResult.jobKeywords
    });
  } catch (error) {
    console.error('Error calculating match:', error);
    sendResponse({ error: error.message });
  }
}

// Core matching algorithm
async function performMatching(resumeText, jobText) {
  // Preprocess text
  const processedResume = preprocessText(resumeText);
  const processedJob = preprocessText(jobText);

  console.log('DEBUG: Processed Resume (first 200 chars):', processedResume.substring(0, 200));
  console.log('DEBUG: Processed Job (first 200 chars):', processedJob.substring(0, 200));
  
  // Extract keywords and n-grams
  const resumeKeywords = extractKeywords(processedResume);
  const jobKeywords = extractKeywords(processedJob);

  const resumeNgrams = extractNgrams(processedResume, 2); // Extract bigrams
  const jobNgrams = extractNgrams(processedJob, 2); // Extract bigrams

  // Combine keywords and n-grams for a more comprehensive set
  const allResumeTerms = [...new Set([...resumeKeywords, ...resumeNgrams])];
  const allJobTerms = [...new Set([...jobKeywords, ...jobNgrams])];

  console.log('DEBUG: All Resume Terms (first 20):', allResumeTerms.slice(0, 20));
  console.log('DEBUG: All Job Terms (first 20):', allJobTerms.slice(0, 20));
  
  // Find matching terms (keywords and n-grams)
  const matchedTerms = findMatchingKeywords(allResumeTerms, allJobTerms);

  console.log('DEBUG: Direct Matched Terms:', matchedTerms);
  
  // Calculate keyword/term match score
  const termMatchScore = matchedTerms.length / Math.max(allJobTerms.length, 1);
  
  // Calculate text similarity using Jaccard similarity on words
  const resumeWords = new Set(processedResume.split(/\s+/));
  const jobWords = new Set(processedJob.split(/\s+/));
  
  const intersection = new Set([...resumeWords].filter(word => jobWords.has(word)));
  const union = new Set([...resumeWords, ...jobWords]);
  
  const jaccardScore = intersection.size / union.size;

  console.log('DEBUG: Jaccard Intersection Size:', intersection.size);
  console.log('DEBUG: Jaccard Union Size:', union.size);
  console.log('DEBUG: Jaccard Score:', jaccardScore);
  
  // Define a comprehensive synonym map (expanded for better matching)
  const synonymMap = {
    // Product Management roles
    'product': ['product', 'products'],
    'manager': ['manager', 'owner', 'lead', 'director', 'head'],
    'product manager': ['product owner', 'product lead', 'pm', 'product director', 'product head'],
    'product owner': ['product manager', 'product lead', 'po', 'product director', 'product head'],
    'product lead': ['product manager', 'product owner', 'pm', 'po'],
    'pm': ['product manager', 'product owner', 'product lead'],
    'po': ['product owner', 'product manager', 'product lead'],
    
    // Project Management
    'project manager': ['project lead', 'program manager', 'project coordinator', 'project director'],
    'program manager': ['project manager', 'project lead', 'program lead'],
    'scrum master': ['agile coach', 'scrum lead', 'agile lead'],
    
    // Methodologies
    'agile': ['scrum', 'kanban', 'lean', 'sprint'],
    'scrum': ['agile', 'kanban', 'sprint', 'ceremonies'],
    'kanban': ['agile', 'scrum', 'lean'],
    'lean': ['agile', 'scrum', 'kanban'],
    'sprint': ['agile', 'scrum', 'iteration'],
    
    // Technical terms
    'software': ['dev', 'engineer', 'development', 'programming', 'coding', 'tech'],
    'development': ['dev', 'engineering', 'programming', 'coding', 'software'],
    'engineering': ['development', 'dev', 'programming', 'coding', 'software'],
    'programming': ['coding', 'development', 'software', 'engineering'],
    'coding': ['programming', 'development', 'software', 'engineering'],
    
    // Business terms
    'e-commerce': ['ecommerce', 'ecomm', 'online retail', 'retail', 'commerce'],
    'ecommerce': ['e-commerce', 'ecomm', 'online retail', 'retail', 'commerce'],
    'business': ['commercial', 'enterprise', 'corporate'],
    'strategy': ['strategic', 'planning', 'roadmap'],
    'roadmap': ['strategy', 'planning', 'strategic'],
    
    // Technology
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning'],
    'artificial intelligence': ['ai', 'machine learning', 'ml'],
    'machine learning': ['ai', 'ml', 'artificial intelligence'],
    'ml': ['machine learning', 'ai', 'artificial intelligence'],
    
    // Design
    'ux': ['user experience', 'usability', 'user research'],
    'ui': ['user interface', 'interface', 'design'],
    'user experience': ['ux', 'usability'],
    'user interface': ['ui', 'interface'],
    
    // Cloud platforms
    'aws': ['amazon web services', 'cloud', 'amazon cloud'],
    'gcp': ['google cloud platform', 'google cloud', 'cloud'],
    'azure': ['microsoft azure', 'cloud'],
    'cloud': ['aws', 'gcp', 'azure', 'cloud computing'],
    
    // Analytics
    'analytics': ['analysis', 'data analysis', 'tracking', 'metrics'],
    'analysis': ['analytics', 'data analysis', 'analyze'],
    'data': ['analytics', 'analysis', 'metrics', 'insights'],
    'metrics': ['analytics', 'data', 'kpi', 'measurement'],
    'kpi': ['metrics', 'analytics', 'measurement'],
    
    // Management
    'budget': ['budgets', 'financial', 'cost', 'finance'],
    'team': ['teams', 'group', 'squad', 'crew'],
    'leadership': ['lead', 'manage', 'management', 'leading'],
    'management': ['manage', 'leadership', 'leading'],
    'lead': ['leadership', 'manage', 'management'],
    
    // Tools
    'jira': ['atlassian', 'ticketing', 'project tracking'],
    'confluence': ['atlassian', 'documentation', 'wiki'],
    'slack': ['communication', 'messaging', 'chat'],
    'github': ['git', 'version control', 'repository'],
    'git': ['github', 'version control', 'repository'],
    
    // Certifications
    'csm': ['certified scrum master', 'scrum master'],
    'pmp': ['project management professional', 'project manager'],
    'mba': ['master of business administration', 'business degree']
  };

  // Enhance matching with synonyms and partial matches
  let synonymMatches = 0;
  const matchedKeywordsWithSynonyms = new Set(matchedTerms);

  console.log('Resume terms:', allResumeTerms.slice(0, 20));
  console.log('Job terms:', allJobTerms.slice(0, 20));
  console.log('Direct matches:', matchedTerms);

  // Check for synonym matches
  for (const resumeTerm of allResumeTerms) {
    for (const jobTerm of allJobTerms) {
      if (resumeTerm === jobTerm) {
        matchedKeywordsWithSynonyms.add(resumeTerm);
        continue;
      }
      
      // Check for direct synonyms
      const resumeSynonyms = synonymMap[resumeTerm] || [];
      const jobSynonyms = synonymMap[jobTerm] || [];

      if (resumeSynonyms.includes(jobTerm) || jobSynonyms.includes(resumeTerm)) {
        matchedKeywordsWithSynonyms.add(resumeTerm);
        synonymMatches++;
        console.log(`Synonym match: ${resumeTerm} <-> ${jobTerm}`);
      }
      
      // Check for partial matches (contains)
      if (resumeTerm.includes(jobTerm) || jobTerm.includes(resumeTerm)) {
        if (resumeTerm.length > 3 && jobTerm.length > 3) { // Avoid short word false positives
          matchedKeywordsWithSynonyms.add(resumeTerm);
          console.log(`Partial match: ${resumeTerm} <-> ${jobTerm}`);
        }
      }
    }
  }

  console.log('Total matches with synonyms:', matchedKeywordsWithSynonyms.size);
  console.log("Synonym matches:", synonymMatches);

   
  const synonymMatchScore = matchedKeywordsWithSynonyms.size / Math.max(allJobTerms.length, 1);
  
  // Calculate final score with improved weighting
  // Give more weight to synonym matches and keyword matches
  // Use a more generous scoring approach that rewards matches better
  const baseScore = synonymMatchScore * 0.7 + termMatchScore * 0.2 + jaccardScore * 0.1;
  
  // Apply a boost for having any matches at all
  const matchBoost = matchedKeywordsWithSynonyms.size > 0 ? 0.1 : 0;
  
  // Apply a scaling factor to make scores more realistic
  const scalingFactor = 1.5;
  
  const finalScore = Math.min(100, Math.round(
    (baseScore + matchBoost) * scalingFactor * 100
  ));
  
  console.log('Scoring breakdown:');
  console.log('- Synonym match score:', synonymMatchScore);
  console.log('- Term match score:', termMatchScore);
  console.log('- Jaccard score:', jaccardScore);
  console.log('- Final score:', finalScore);

  return {
    score: finalScore,
    matchedKeywords: Array.from(matchedKeywordsWithSynonyms).slice(0, 20), // Limit to top 20
    resumeKeywords: allResumeTerms.slice(0, 30),
    jobKeywords: allJobTerms.slice(0, 30)
  };
}

// Extract n-grams (phrases) from text
function extractNgrams(text, n) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Original preprocessText, extractKeywords, findMatchingKeywords functions are now defined above



// Preprocess text: lowercase, remove punctuation, remove stop words
function preprocessText(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word))
    .join(' ');
}

// Extract keywords using frequency analysis with improved multi-word term handling
function extractKeywords(text) {
  const words = text.split(/\s+/);
  const frequency = {};
  
  // Important multi-word terms to look for
  const importantPhrases = [
    'product manager', 'product owner', 'project manager', 'scrum master',
    'software engineer', 'data analyst', 'business analyst', 'user experience',
    'user interface', 'machine learning', 'artificial intelligence',
    'project management', 'product management', 'agile development',
    'software development', 'web development', 'full stack',
    'front end', 'back end', 'data science', 'cloud computing'
  ];
  
  // Check for important phrases first
  const lowerText = text.toLowerCase();
  importantPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      frequency[phrase] = (frequency[phrase] || 0) + 3; // Give phrases higher weight
    }
  });
  
  // Count individual word frequencies
  words.forEach(word => {
    if (word.length > 2) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top keywords (return more for better matching)
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 60) // Increased to top 60 keywords
    .map(([word]) => word);
}

// Extract n-grams (phrases) from text
function extractNgrams(text, n) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

// Find keywords that appear in both resume and job description
function findMatchingKeywords(resumeKeywords, jobKeywords) {
  const jobKeywordSet = new Set(jobKeywords);
  return resumeKeywords.filter(keyword => jobKeywordSet.has(keyword));
}



// Clear stored resume from local storage
async function clearStoredResume(sendResponse) {
  try {
    await chrome.storage.local.remove(["resumeText", "resumeFileName", "uploadDate"]);
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error clearing stored resume:", error);
    sendResponse({ error: error.message });
  }
}

// Process job description text and calculate match
async function handleJobDescriptionProcessing(jobText, sendResponse) {
  try {
    console.log('Processing job description:', jobText?.substring(0, 100) + '...');
    
    // Get stored resume
    const result = await chrome.storage.local.get(['resumeText']);
    
    if (!result.resumeText || result.resumeText.trim() === '') {
      sendResponse({ 
        success: false,
        error: 'No resume found. Please upload your resume first.' 
      });
      return;
    }
    
    console.log('Found stored resume, calculating match...');
    
    // Calculate match
    const matchResult = await performMatching(result.resumeText, jobText);
    
    console.log('Match calculation complete:', matchResult);
    
    sendResponse({
      success: true,
      matchScore: matchResult.score,
      matchedKeywords: matchResult.matchedKeywords,
      resumeKeywords: matchResult.resumeKeywords,
      jobKeywords: matchResult.jobKeywords
    });
    
  } catch (error) {
    console.error('Error processing job description:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Failed to process job description' 
    });
  }
}

// Get stored resume from local storage
async function getStoredResume(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['resumeText', 'resumeFileName']);
    sendResponse({
      success: true,
      resumeText: result.resumeText || null,
      fileName: result.resumeFileName || null
    });
  } catch (error) {
    console.error('Error getting stored resume:', error);
    sendResponse({ error: error.message });
  }
}

// Store resume text in local storage
async function storeResume(data, sendResponse) {
  try {
    await chrome.storage.local.set({
      resumeText: data.text,
      resumeFileName: data.fileName,
      uploadDate: new Date().toISOString()
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error storing resume:', error);
    sendResponse({ error: error.message });
  }
}

// Calculate match between resume and job description
async function calculateMatch(resumeText, jobText, sendResponse) {
  try {
    const matchResult = await performMatching(resumeText, jobText);
    sendResponse({
      success: true,
      matchScore: matchResult.score,
      matchedKeywords: matchResult.matchedKeywords,
      resumeKeywords: matchResult.resumeKeywords,
      jobKeywords: matchResult.jobKeywords
    });
  } catch (error) {
    console.error('Error calculating match:', error);
    sendResponse({ error: error.message });
  }
}

// Core matching algorithm
async function performMatching(resumeText, jobText) {
  // Preprocess text
  const processedResume = preprocessText(resumeText);
  const processedJob = preprocessText(jobText);

  console.log('DEBUG: Processed Resume (first 200 chars):', processedResume.substring(0, 200));
  console.log('DEBUG: Processed Job (first 200 chars):', processedJob.substring(0, 200));
  
  // Extract keywords and n-grams
  const resumeKeywords = extractKeywords(processedResume);
  const jobKeywords = extractKeywords(processedJob);

  const resumeNgrams = extractNgrams(processedResume, 2); // Extract bigrams
  const jobNgrams = extractNgrams(processedJob, 2); // Extract bigrams

  // Combine keywords and n-grams for a more comprehensive set
  const allResumeTerms = [...new Set([...resumeKeywords, ...resumeNgrams])];
  const allJobTerms = [...new Set([...jobKeywords, ...jobNgrams])];

  console.log('DEBUG: All Resume Terms (first 20):', allResumeTerms.slice(0, 20));
  console.log('DEBUG: All Job Terms (first 20):', allJobTerms.slice(0, 20));
  
  // Find matching terms (keywords and n-grams)
  const matchedTerms = findMatchingKeywords(allResumeTerms, allJobTerms);

  console.log('DEBUG: Direct Matched Terms:', matchedTerms);
  
  // Calculate keyword/term match score
  const termMatchScore = matchedTerms.length / Math.max(allJobTerms.length, 1);
  
  // Calculate text similarity using Jaccard similarity on words
  const resumeWords = new Set(processedResume.split(/\s+/));
  const jobWords = new Set(processedJob.split(/\s+/));
  
  const intersection = new Set([...resumeWords].filter(word => jobWords.has(word)));
  const union = new Set([...resumeWords, ...jobWords]);
  
  const jaccardScore = intersection.size / union.size;

  console.log('DEBUG: Jaccard Intersection Size:', intersection.size);
  console.log('DEBUG: Jaccard Union Size:', union.size);
  console.log('DEBUG: Jaccard Score:', jaccardScore);
  
  // Define a comprehensive synonym map (expanded for better matching)
  const synonymMap = {
    // Product Management roles
    'product': ['product', 'products'],
    'manager': ['manager', 'owner', 'lead', 'director', 'head'],
    'product manager': ['product owner', 'product lead', 'pm', 'product director', 'product head'],
    'product owner': ['product manager', 'product lead', 'po', 'product director', 'product head'],
    'product lead': ['product manager', 'product owner', 'pm', 'po'],
    'pm': ['product manager', 'product owner', 'product lead'],
    'po': ['product owner', 'product manager', 'product lead'],
    
    // Project Management
    'project manager': ['project lead', 'program manager', 'project coordinator', 'project director'],
    'program manager': ['project manager', 'project lead', 'program lead'],
    'scrum master': ['agile coach', 'scrum lead', 'agile lead'],
    
    // Methodologies
    'agile': ['scrum', 'kanban', 'lean', 'sprint'],
    'scrum': ['agile', 'kanban', 'sprint', 'ceremonies'],
    'kanban': ['agile', 'scrum', 'lean'],
    'lean': ['agile', 'scrum', 'kanban'],
    'sprint': ['agile', 'scrum', 'iteration'],
    
    // Technical terms
    'software': ['dev', 'engineer', 'development', 'programming', 'coding', 'tech'],
    'development': ['dev', 'engineering', 'programming', 'coding', 'software'],
    'engineering': ['development', 'dev', 'programming', 'coding', 'software'],
    'programming': ['coding', 'development', 'software', 'engineering'],
    'coding': ['programming', 'development', 'software', 'engineering'],
    
    // Business terms
    'e-commerce': ['ecommerce', 'ecomm', 'online retail', 'retail', 'commerce'],
    'ecommerce': ['e-commerce', 'ecomm', 'online retail', 'retail', 'commerce'],
    'business': ['commercial', 'enterprise', 'corporate'],
    'strategy': ['strategic', 'planning', 'roadmap'],
    'roadmap': ['strategy', 'planning', 'strategic'],
    
    // Technology
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'deep learning'],
    'artificial intelligence': ['ai', 'machine learning', 'ml'],
    'machine learning': ['ai', 'ml', 'artificial intelligence'],
    'ml': ['machine learning', 'ai', 'artificial intelligence'],
    
    // Design
    'ux': ['user experience', 'usability', 'user research'],
    'ui': ['user interface', 'interface', 'design'],
    'user experience': ['ux', 'usability'],
    'user interface': ['ui', 'interface'],
    
    // Cloud platforms
    'aws': ['amazon web services', 'cloud', 'amazon cloud'],
    'gcp': ['google cloud platform', 'google cloud', 'cloud'],
    'azure': ['microsoft azure', 'cloud'],
    'cloud': ['aws', 'gcp', 'azure', 'cloud computing'],
    
    // Analytics
    'analytics': ['analysis', 'data analysis', 'tracking', 'metrics'],
    'analysis': ['analytics', 'data analysis', 'analyze'],
    'data': ['analytics', 'analysis', 'metrics', 'insights'],
    'metrics': ['analytics', 'data', 'kpi', 'measurement'],
    'kpi': ['metrics', 'analytics', 'measurement'],
    
    // Management
    'budget': ['budgets', 'financial', 'cost', 'finance'],
    'team': ['teams', 'group', 'squad', 'crew'],
    'leadership': ['lead', 'manage', 'management', 'leading'],
    'management': ['manage', 'leadership', 'leading'],
    'lead': ['leadership', 'manage', 'management'],
    
    // Tools
    'jira': ['atlassian', 'ticketing', 'project tracking'],
    'confluence': ['atlassian', 'documentation', 'wiki'],
    'slack': ['communication', 'messaging', 'chat'],
    'github': ['git', 'version control', 'repository'],
    'git': ['github', 'version control', 'repository'],
    
    // Certifications
    'csm': ['certified scrum master', 'scrum master'],
    'pmp': ['project management professional', 'project manager'],
    'mba': ['master of business administration', 'business degree']
  };

  // Enhance matching with synonyms and partial matches
  let synonymMatches = 0;
  const matchedKeywordsWithSynonyms = new Set(matchedTerms);

  console.log('Resume terms:', allResumeTerms.slice(0, 20));
  console.log('Job terms:', allJobTerms.slice(0, 20));
  console.log('Direct matches:', matchedTerms);

  // Check for synonym matches
  for (const resumeTerm of allResumeTerms) {
    for (const jobTerm of allJobTerms) {
      if (resumeTerm === jobTerm) {
        matchedKeywordsWithSynonyms.add(resumeTerm);
        continue;
      }
      
      // Check for direct synonyms
      const resumeSynonyms = synonymMap[resumeTerm] || [];
      const jobSynonyms = synonymMap[jobTerm] || [];

      if (resumeSynonyms.includes(jobTerm) || jobSynonyms.includes(resumeTerm)) {
        matchedKeywordsWithSynonyms.add(resumeTerm);
        synonymMatches++;
        console.log(`Synonym match: ${resumeTerm} <-> ${jobTerm}`);
      }
      
      // Check for partial matches (contains)
      if (resumeTerm.includes(jobTerm) || jobTerm.includes(resumeTerm)) {
        if (resumeTerm.length > 3 && jobTerm.length > 3) { // Avoid short word false positives
          matchedKeywordsWithSynonyms.add(resumeTerm);
          console.log(`Partial match: ${resumeTerm} <-> ${jobTerm}`);
        }
      }
    }
  }

  console.log('Total matches with synonyms:', matchedKeywordsWithSynonyms.size);
  console.log("Synonym matches:", synonymMatches);

   
  const synonymMatchScore = matchedKeywordsWithSynonyms.size / Math.max(allJobTerms.length, 1);
  
  // Calculate final score with improved weighting
  // Give more weight to synonym matches and keyword matches
  // Use a more generous scoring approach that rewards matches better
  const baseScore = synonymMatchScore * 0.7 + termMatchScore * 0.2 + jaccardScore * 0.1;
  
  // Apply a boost for having any matches at all
  const matchBoost = matchedKeywordsWithSynonyms.size > 0 ? 0.1 : 0;
  
  // Apply a scaling factor to make scores more realistic
  const scalingFactor = 1.5;
  
  const finalScore = Math.min(100, Math.round(
    (baseScore + matchBoost) * scalingFactor * 100
  ));
  
  console.log('Scoring breakdown:');
  console.log('- Synonym match score:', synonymMatchScore);
  console.log('- Term match score:', termMatchScore);
  console.log('- Jaccard score:', jaccardScore);
  console.log('- Final score:', finalScore);

  return {
    score: finalScore,
    matchedKeywords: Array.from(matchedKeywordsWithSynonyms).slice(0, 20), // Limit to top 20
    resumeKeywords: allResumeTerms.slice(0, 30),
    jobKeywords: allJobTerms.slice(0, 30)
  };
}

// Extract n-grams (phrases) from text
function extractNgrams(text, n) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Original preprocessText, extractKeywords, findMatchingKeywords functions are now defined above



// Preprocess text: lowercase, remove punctuation, remove stop words
function preprocessText(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word))
    .join(' ');
}

// Extract keywords using frequency analysis with improved multi-word term handling
function extractKeywords(text) {
  const words = text.split(/\s+/);
  const frequency = {};
  
  // Important multi-word terms to look for
  const importantPhrases = [
    'product manager', 'product owner', 'project manager', 'scrum master',
    'software engineer', 'data analyst', 'business analyst', 'user experience',
    'user interface', 'machine learning', 'artificial intelligence',
    'project management', 'product management', 'agile development',
    'software development', 'web development', 'full stack',
    'front end', 'back end', 'data science', 'cloud computing'
  ];
  
  // Check for important phrases first
  const lowerText = text.toLowerCase();
  importantPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      frequency[phrase] = (frequency[phrase] || 0) + 3; // Give phrases higher weight
    }
  });
  
  // Count individual word frequencies
  words.forEach(word => {
    if (word.length > 2) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top keywords (return more for better matching)
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 60) // Increased to top 60 keywords
    .map(([word]) => word);
}

// Extract n-grams (phrases) from text
function extractNgrams(text, n) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(" "));
  }
  return ngrams;
}

// Find keywords that appear in both resume and job description
function findMatchingKeywords(resumeKeywords, jobKeywords) {
  const jobKeywordSet = new Set(jobKeywords);
  return resumeKeywords.filter(keyword => jobKeywordSet.has(keyword));
}



// Clear stored resume from local storage
async function clearStoredResume(sendResponse) {
  try {
    await chrome.storage.local.remove(["resumeText", "resumeFileName", "uploadDate"]);
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error clearing stored resume:", error);
    sendResponse({ error: error.message });
  }
}


