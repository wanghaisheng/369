/**
 * i18n Key Scanner Tool - Improved Version
 * 
 * This script helps scan all HTML files in the project for i18n keys and compares them with locale files.
 * It can be used to find missing keys and ensure all translations are complete.
 * 
 * Improvements:
 * - Better file handling for local file system
 * - Improved error handling
 * - More robust file selection
 */

// Configuration
const config = {
  localeDir: 'locales',
  supportedLanguages: ['en', 'zh'],
  defaultLanguage: 'en',
  attributeSelectors: ['data-i18n', 'data-i18n-placeholder', 'data-i18n-content', 'data-i18n-alt', 'data-i18n-title'],
  htmlFiles: [
    'index.html',
    'home.html',
    'wish_setting.html',
    'writing_practice.html',
    'progress.html',
    'community.html',
    'profile.html',
    'founder_story.html',
    'privacy.html',
    'terms.html',
    'waitlist-thanks.html',
    'de/index.html',
    'zh/index.html'
  ]
};

// Main function to run the scanner
async function runScanner(userConfig = {}) {
  try {
    // Merge user config with default config
    const mergedConfig = {
      ...config,
      localeDir: userConfig.localePath || config.localeDir,
      supportedLanguages: userConfig.supportedLanguages || config.supportedLanguages
    };
    
    const scanPath = userConfig.scanPath || './';
    
    console.log(`Scanning for HTML files in: ${scanPath}`);
    console.log(`Using locale files from: ${mergedConfig.localeDir}`);
    console.log(`Supported languages: ${mergedConfig.supportedLanguages.join(', ')}`);
    
    // Load existing locale files
    const localeData = {};
    let foundLocaleFiles = false;
    
    // Check if we have selected locale files from the file input
    if (window.selectedLocaleFiles && Object.keys(window.selectedLocaleFiles).length > 0) {
      console.log('Using previously selected locale files');
      
      for (const lang of mergedConfig.supportedLanguages) {
        if (window.selectedLocaleFiles[lang]) {
          try {
            localeData[lang] = JSON.parse(window.selectedLocaleFiles[lang]);
            console.log(`Loaded ${lang}.json from selected files`);
            foundLocaleFiles = true;
          } catch (error) {
            console.error(`Error parsing selected ${lang}.json:`, error);
            localeData[lang] = {};
          }
        } else {
          console.log(`No selected file for ${lang}`);
          localeData[lang] = {};
        }
      }
    } else {
      // Try to load locale files using FileReader API
      console.log('No previously selected locale files. Prompting for selection.');
      
      // Process each language file individually
      for (const lang of mergedConfig.supportedLanguages) {
        try {
          // Create a file input element for this language
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.json'; // Only accept JSON files
          fileInput.style.display = 'none';
          document.body.appendChild(fileInput);
          
          // Prompt user to select the file for this language
          const filePromise = new Promise((resolve, reject) => {
            fileInput.onchange = (event) => {
              const file = event.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const content = JSON.parse(e.target.result);
                    // Store the file content for future use
                    if (!window.selectedLocaleFiles) {
                      window.selectedLocaleFiles = {};
                    }
                    window.selectedLocaleFiles[lang] = e.target.result;
                    resolve(content);
                  } catch (error) {
                    console.error(`Failed to parse ${file.name}: ${error.message}`);
                    resolve({});
                  }
                };
                reader.onerror = () => {
                  console.error(`Error reading ${file.name}`);
                  resolve({});
                };
                reader.readAsText(file);
              } else {
                console.warn(`No file selected for ${lang}`);
                resolve({});
              }
            };
            
            // Allow user to cancel
            setTimeout(() => {
              if (!fileInput.files || fileInput.files.length === 0) {
                console.warn(`File selection for ${lang} was canceled or timed out`);
                resolve({});
              }
            }, 60000); // 1 minute timeout
          });
          
          // Show a message to the user
          alert(`Please select the ${lang}.json locale file`);
          fileInput.click();
          
          // Wait for the user to select the file
          localeData[lang] = await filePromise;
          console.log(`Loaded ${lang}.json successfully`);
          
          // Clean up
          document.body.removeChild(fileInput);
          
          if (Object.keys(localeData[lang]).length > 0) {
            foundLocaleFiles = true;
          }
        } catch (error) {
          console.error(`Error loading ${lang}.json:`, error);
          localeData[lang] = {};
        }
      }
    }
    
    // If no locale files found, create empty objects
    if (!foundLocaleFiles) {
      console.log('No valid locale files were found. Creating empty locale data objects.');
      for (const lang of mergedConfig.supportedLanguages) {
        localeData[lang] = {};
      }
    }
    
    // Get list of HTML files to scan
    const filePattern = userConfig.filePattern || '*.html';
    const patterns = filePattern.split(',').map(p => p.trim());
    
    // For local file system, we'll need to use FileReader API
    let htmlFilesToScan = [];
    let htmlContents = {};
    
    // Check if we have previously selected HTML files
    if (window.selectedHtmlFiles && window.selectedHtmlFiles.length > 0) {
      console.log(`Using ${window.selectedHtmlFiles.length} previously selected HTML files`);
      
      // Process all selected HTML files
      const files = window.selectedHtmlFiles;
      const htmlFiles = [];
      
      // Create an array of promises for file reading
      const readPromises = files.map(file => {
        return new Promise((resolve) => {
          const filePath = file.name;
          
          // Check if the file matches any of the patterns
          const matchesPattern = patterns.some(pattern => {
            const extension = pattern.replace('*', '');
            return filePath.toLowerCase().endsWith(extension.toLowerCase());
          });
          
          if (matchesPattern) {
            htmlFiles.push(filePath);
            
            const reader = new FileReader();
            reader.onload = (e) => {
              htmlContents[filePath] = e.target.result;
              resolve();
            };
            reader.onerror = () => {
              console.error(`Error reading ${filePath}`);
              resolve();
            };
            reader.readAsText(file);
          } else {
            resolve();
          }
        });
      });
      
      // Wait for all files to be read
      await Promise.all(readPromises);
      htmlFilesToScan = htmlFiles;
      
      console.log(`Processed ${htmlFilesToScan.length} HTML files`);
    } else {
      console.log('No previously selected HTML files. Prompting for selection.');
      
      // Create a file input element to allow multiple file selection
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true; // Allow selecting multiple files
      fileInput.accept = '.html,.htm'; // Only accept HTML files
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      // Prompt user to select the files
      const filesPromise = new Promise((resolve, reject) => {
        fileInput.onchange = (event) => {
          const files = Array.from(event.target.files);
          if (files.length > 0) {
            // Store selected files for future reference
            window.selectedHtmlFiles = files;
            
            const htmlFiles = [];
            const readPromises = [];
            
            for (const file of files) {
              const filePath = file.name;
              
              // Check if the file matches any of the patterns
              const matchesPattern = patterns.some(pattern => {
                const extension = pattern.replace('*', '');
                return filePath.toLowerCase().endsWith(extension.toLowerCase());
              });
              
              if (matchesPattern) {
                htmlFiles.push(filePath);
                
                const readPromise = new Promise((resolveRead) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    htmlContents[filePath] = e.target.result;
                    resolveRead();
                  };
                  reader.onerror = () => {
                    console.error(`Error reading ${filePath}`);
                    resolveRead();
                  };
                  reader.readAsText(file);
                });
                
                readPromises.push(readPromise);
              }
            }
            
            // Wait for all files to be read
            Promise.all(readPromises).then(() => {
              resolve(htmlFiles);
            });
          } else {
            console.warn('No files selected');
            resolve([]);
          }
        };
        
        // Allow user to cancel
        setTimeout(() => {
          if (!fileInput.files || fileInput.files.length === 0) {
            console.warn('File selection was canceled or timed out');
            resolve([]);
          }
        }, 60000); // 1 minute timeout
      });
      
      // Show a message to the user
      alert('Please select HTML files to scan');
      fileInput.click();
      
      // Wait for the user to select the files
      htmlFilesToScan = await filesPromise;
      
      // Clean up
      document.body.removeChild(fileInput);
      
      console.log(`Selected ${htmlFilesToScan.length} HTML files for scanning`);
    }
    
    // If no HTML files were selected, show a message
    if (htmlFilesToScan.length === 0) {
      console.log('No HTML files were selected. The scanner cannot proceed without files to scan.');
      return {
        missingKeys: {},
        localeData: localeData
      };
    }
    
    // Scan all HTML files for i18n keys
    const allKeys = new Set();
    const fileKeysMap = {};
    
    // For local files, use the content we already loaded
    for (const [fileName, html] of Object.entries(htmlContents)) {
      try {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Scan for i18n keys in this file
        const fileKeys = scanKeysFromDocument(doc, mergedConfig.attributeSelectors);
        fileKeysMap[fileName] = Array.from(fileKeys);
        
        // Add to all keys
        fileKeys.forEach(key => allKeys.add(key));
        
        console.log(`Scanned ${fileName}: found ${fileKeys.size} unique i18n keys`);
      } catch (error) {
        console.error(`Error scanning ${fileName}:`, error);
      }
    }
    
    console.log(`Found ${allKeys.size} total unique i18n keys across all files`);
    
    // Check for missing keys in each language
    const missingKeys = {};
    for (const lang of mergedConfig.supportedLanguages) {
      missingKeys[lang] = findMissingKeys(allKeys, localeData[lang]);
      console.log(`Found ${missingKeys[lang].length} missing keys in ${lang}.json`);
    }
    
    // Generate report
    displayReport(missingKeys, localeData, fileKeysMap, mergedConfig);
    
    // Generate updated JSON files if there are missing keys
    if (Object.values(missingKeys).some(keys => keys.length > 0)) {
      const updatedLocaleData = generateUpdatedLocaleData(missingKeys, localeData, mergedConfig);
      downloadUpdatedLocaleFiles(updatedLocaleData, mergedConfig);
    }
    
    return {
      missingKeys: missingKeys,
      localeData: localeData
    };
  } catch (error) {
    console.error('Error running i18n Key Scanner Tool:', error);
    return {
      error: error.message
    };
  }
}

// Scan a document for all i18n keys
function scanKeysFromDocument(doc, attributeSelectors) {
  const keys = new Set();
  
  // Scan for each attribute type
  for (const attr of attributeSelectors || config.attributeSelectors) {
    const elements = doc.querySelectorAll(`[${attr}]`);
    
    elements.forEach(el => {
      const key = el.getAttribute(attr);
      keys.add(key);
    });
  }
  
  return keys;
}

// Find keys that are missing in the locale data
function findMissingKeys(keys, localeData) {
  const missingKeys = [];
  
  keys.forEach(key => {
    const value = getNestedProperty(localeData, key);
    if (!value) {
      missingKeys.push(key);
    }
  });
  
  return missingKeys;
}

// Helper function to get nested property from object
function getNestedProperty(obj, path) {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] ? prev[curr] : null;
  }, obj);
}

// Helper function to set nested property in object
function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return obj;
}

// Display report of missing keys
function displayReport(missingKeys, localeData, fileKeysMap, mergedConfig) {
  console.log('\n=== Missing Keys Report ===');
  
  // Display missing keys by language
  for (const lang of mergedConfig.supportedLanguages) {
    console.log(`\n${lang.toUpperCase()} Missing Keys (${missingKeys[lang].length}):`);
    if (missingKeys[lang].length === 0) {
      console.log('No missing keys!');
    } else {
      missingKeys[lang].forEach(key => {
        // For non-default language, show the default language value as reference
        if (lang !== mergedConfig.defaultLanguage) {
          const defaultValue = getNestedProperty(localeData[mergedConfig.defaultLanguage], key);
          console.log(`${key}: ${defaultValue || '[No default value]'}`);
        } else {
          console.log(key);
        }
        
        // Show which files use this key
        const filesUsingKey = Object.entries(fileKeysMap)
          .filter(([_, keys]) => keys.includes(key))
          .map(([file, _]) => file);
        
        if (filesUsingKey.length > 0) {
          console.log(`  Used in: ${filesUsingKey.join(', ')}`);
        }
      });
    }
  }
  
  // Display keys by file
  console.log('\n=== Keys by File ===');
  for (const [file, keys] of Object.entries(fileKeysMap)) {
    console.log(`\n${file} (${keys.length} keys):`);
    console.log(keys.join('\n'));
  }
}

// Generate updated locale data with missing keys
function generateUpdatedLocaleData(missingKeys, localeData, mergedConfig) {
  const updatedLocaleData = {};
  
  // Deep clone existing locale data
  for (const lang of mergedConfig.supportedLanguages) {
    updatedLocaleData[lang] = JSON.parse(JSON.stringify(localeData[lang]));
  }
  
  // Add missing keys
  for (const lang of mergedConfig.supportedLanguages) {
    for (const key of missingKeys[lang]) {
      let value = '';
      
      // For non-default language, use default language value as placeholder
      if (lang !== mergedConfig.defaultLanguage) {
        const defaultValue = getNestedProperty(localeData[mergedConfig.defaultLanguage], key);
        if (defaultValue) {
          value = `[TRANSLATE] ${defaultValue}`;
        } else {
          value = '[MISSING]';
        }
      } else {
        value = '[MISSING]';
      }
      
      setNestedProperty(updatedLocaleData[lang], key, value);
    }
  }
  
  return updatedLocaleData;
}

// Create and download updated locale files
function downloadUpdatedLocaleFiles(updatedLocaleData, mergedConfig) {
  console.log('\n=== Updated Locale Files ===');
  
  // Clear previous download container
  const downloadContainer = document.getElementById('download-container');
  if (downloadContainer) {
    downloadContainer.innerHTML = '';
    
    // Add heading
    const heading = document.createElement('h2');
    heading.textContent = 'Updated Locale Files';
    downloadContainer.appendChild(heading);
    
    // Add description
    const description = document.createElement('p');
    description.textContent = 'The following files have been updated with missing keys. Click the download links to save them.';
    downloadContainer.appendChild(description);
  }
  
  for (const lang of mergedConfig.supportedLanguages) {
    try {
      const jsonString = JSON.stringify(updatedLocaleData[lang], null, 2);
      
      // Create a download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lang}_updated.json`;
      a.textContent = `Download updated ${lang}.json`;
      a.style.display = 'block';
      a.style.margin = '10px 0';
      a.className = 'download-link';
      
      // Add to the page if download container exists
      if (downloadContainer) {
        const container = document.createElement('div');
        container.className = 'locale-file-container';
        
        const fileHeading = document.createElement('h3');
        fileHeading.textContent = `Updated ${lang}.json`;
        container.appendChild(fileHeading);
        
        // Add stats about missing keys
        const stats = document.createElement('p');
        const missingCount = Object.keys(updatedLocaleData[lang]).filter(key => 
          updatedLocaleData[lang][key] === '[MISSING]' || 
          updatedLocaleData[lang][key].startsWith('[TRANSLATE]')
        ).length;
        stats.textContent = `Contains ${missingCount} missing or untranslated keys`;
        container.appendChild(stats);
        
        const pre = document.createElement('pre');
        pre.className = 'json-preview';
        pre.textContent = jsonString;
        container.appendChild(pre);
        
        container.appendChild(a);
        downloadContainer.appendChild(container);
      } else {
        // If no download container, just trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      console.log(`Created download link for updated ${lang}.json`);
    } catch (error) {
      console.error(`Error creating download for ${lang}.json:`, error);
    }
  }
}

// Clear results function
function clearResults() {
  const logOutput = document.getElementById('log-output');
  const downloadContainer = document.getElementById('download-container');
  
  if (logOutput) logOutput.innerHTML = '';
  if (downloadContainer) downloadContainer.innerHTML = '';
  
  console.log('Results cleared');
}

// Export functions for use in the UI
window.runScanner = runScanner;
window.clearResults = clearResults;