/**
 * i18n Key Scanner Tool
 * 
 * This script helps scan all HTML files in the project for i18n keys and compares them with locale files.
 * It can be used to find missing keys and ensure all translations are complete.
 */

// Configuration
const config = {
  localeDir: 'locale',
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
    
    // Try to get the root folder path from the current HTML file
    const currentPath = window.location.pathname;
    // Fix the root folder path construction - remove the file:/// prefix if present
    const normalizedPath = decodeURIComponent(currentPath).replace(/^file:\/\/\//, '');
    // Get the directory containing the HTML file - handle both Windows and Unix style paths
    const lastBackslashIndex = normalizedPath.lastIndexOf('\\');
    const lastForwardSlashIndex = normalizedPath.lastIndexOf('/');
    const lastSeparatorIndex = Math.max(lastBackslashIndex, lastForwardSlashIndex);
    const rootFolder = normalizedPath.substring(0, lastSeparatorIndex);
    
    // Log the path information for debugging
    console.log(`Path info - currentPath: ${currentPath}`);
    console.log(`Path info - normalizedPath: ${normalizedPath}`);
    console.log(`Path info - rootFolder: ${rootFolder}`);
    
    // Properly construct the locale folder path - remove any ./ references
    let localeFolder = mergedConfig.localeDir;
    
    // Detect which path separator is being used in rootFolder (Windows or Unix)
    const isWindowsPath = rootFolder.includes('\\');
    const pathSeparator = isWindowsPath ? '\\' : '/';
    
    if (localeFolder.startsWith('./')) {
      localeFolder = `${rootFolder}${pathSeparator}${localeFolder.substring(2)}`;
    } else if (!localeFolder.includes('/') && !localeFolder.includes('\\')) {
      // If it's just a folder name without path separators, append to root folder
      localeFolder = `${rootFolder}${pathSeparator}${localeFolder}`;
    }
    // If user provided an absolute path, use it directly
    
    // Ensure consistent path separators throughout the path
    if (isWindowsPath) {
      // Convert all forward slashes to backslashes for Windows
      localeFolder = localeFolder.replace(/\//g, '\\');
    } else {
      // Convert all backslashes to forward slashes for Unix
      localeFolder = localeFolder.replace(/\\/g, '/');
    }
    
    console.log(`Attempting to load locale files from: ${localeFolder}`);
    
    // Flag to track if we found any locale files automatically
    let foundLocaleFiles = false;
    
    for (const lang of mergedConfig.supportedLanguages) {
      try {
        // Try with direct path first (for local file access)
        // Use the correct path separator based on the detected OS
        const isWindowsPath = localeFolder.includes('\\');
        const pathSeparator = isWindowsPath ? '\\' : '/';
        const localeFilePath = `${localeFolder}${pathSeparator}${lang}.json`;
        console.log(`Attempting to load ${localeFilePath}`);
        
        // Check if we're running from a file:// URL (local file)
        if (window.location.protocol === 'file:') {
          try {
            // Try to use XMLHttpRequest for local file access first
            const xhr = new XMLHttpRequest();
            xhr.open('GET', localeFilePath, false); // Synchronous request
            xhr.send();
            
            if (xhr.status === 200) {
              localeData[lang] = JSON.parse(xhr.responseText);
              console.log(`Loaded ${lang}.json successfully using XHR`);
              foundLocaleFiles = true;
              continue; // Skip to next language if successful
            }
          } catch (xhrError) {
            console.log(`XHR failed to load ${lang}.json: ${xhrError.message}`);
          }
        } else {
          // For web server, use fetch as before
          const response = await fetch(`${mergedConfig.localeDir}/${lang}.json`);
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          localeData[lang] = await response.json();
          console.log(`Loaded ${lang}.json successfully`);
          foundLocaleFiles = true;
        }
      } catch (error) {
        console.error(`Error loading ${lang}.json:`, error);
        // Initialize with empty object if file can't be loaded
        localeData[lang] = {};
      }
    }
    
    // If no locale files found, prompt the user to select individual locale files
    if (window.location.protocol === 'file:' && !foundLocaleFiles) {
      console.log('No locale files found in default location. Please select locale files individually.');
      
      // Process each language file individually
      for (const lang of mergedConfig.supportedLanguages) {
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
      }
      
      // Set flag to indicate we found files
      if (Object.values(localeData).some(data => Object.keys(data).length > 0)) {
        foundLocaleFiles = true;
      } else {
        // If no files were selected or all were empty, create empty objects
        console.log('No valid locale files were selected. Creating empty locale data objects.');
        for (const lang of mergedConfig.supportedLanguages) {
          localeData[lang] = {};
        }
        foundLocaleFiles = true; // Set to true to continue with the process
      }
      }
    }
    
    // Get list of HTML files to scan based on the file pattern
    const filePattern = userConfig.filePattern || '*.html';
    const patterns = filePattern.split(',').map(p => p.trim());
    
    // For local file system, we'll need a different approach to scan HTML files
    let htmlFilesToScan = [];
    let htmlContents = {};
    
    if (window.location.protocol === 'file:') {
      console.log('Running from local file system. Attempting to scan HTML files in root folder.');
      
      // Try to get the root folder path from the current HTML file
      const currentPath = window.location.pathname;
      // Use the user-provided scan path or default to the current directory
      const scanFolder = scanPath === './' ? rootFolder : scanPath;
      console.log(`Using scan folder: ${scanFolder}`);
      
      // Detect OS path separator for better compatibility
      // Improved path separator detection
      const isWindowsPath = scanFolder.includes('\\');
      const pathSeparator = isWindowsPath ? '\\' : '/';
      console.log(`Detected path separator: ${pathSeparator}`);
      
      // First try to scan the root folder for HTML files using config.htmlFiles
      let foundHtmlFiles = false;
      
      try {
        // Try to load HTML files from the root folder based on config.htmlFiles
        for (const htmlFile of config.htmlFiles) {
          try {
            // Use the detected path separator or fallback to forward slash for URLs
            // Improved path handling to ensure consistent separator usage
            const separator = pathSeparator; // Use the already detected path separator
            
            // Ensure we don't have double separators
            const normalizedScanFolder = scanFolder.endsWith(separator) ? scanFolder.slice(0, -1) : scanFolder;
            
            // Handle subdirectories in htmlFile (like 'de/index.html')
            let normalizedHtmlFile = htmlFile;
            if (htmlFile.includes('/') && isWindowsPath) {
              // Convert forward slashes to backslashes for Windows paths
              normalizedHtmlFile = htmlFile.replace(/\//g, '\\');
            } else if (htmlFile.includes('\\') && !isWindowsPath) {
              // Convert backslashes to forward slashes for Unix paths
              normalizedHtmlFile = htmlFile.replace(/\\/g, '/');
            }
            
            const filePath = normalizedScanFolder + separator + normalizedHtmlFile;
            console.log(`Attempting to load HTML file: ${filePath}`);
            
            const xhr = new XMLHttpRequest();
            xhr.open('GET', filePath, false); // Synchronous request
            xhr.send();
            
            if (xhr.status === 200) {
              htmlFilesToScan.push(htmlFile);
              htmlContents[htmlFile] = xhr.responseText;
              foundHtmlFiles = true;
              console.log(`Found HTML file: ${htmlFile}`);
            }
          } catch (error) {
            console.log(`Could not load ${htmlFile}: ${error.message}`);
          }
        }
        
        console.log(`Found ${htmlFilesToScan.length} HTML files in root folder`);
      } catch (error) {
        console.error(`Error scanning root folder: ${error.message}`);
      }
      
      // If no HTML files found, prompt the user to select individual HTML files
      if (!foundHtmlFiles) {
        console.log('No HTML files found in root folder. Please select HTML files to scan.');
        
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
              window.selectedFiles = {};
              const htmlFiles = [];
              
              // Process all selected HTML files
              let filesProcessed = 0;
              
              for (const file of files) {
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
                    window.selectedFiles[filePath] = e.target.result;
                    htmlContents[filePath] = e.target.result;
                    filesProcessed++;
                    
                    // When all files are processed, resolve the promise
                    if (filesProcessed === files.length) {
                      htmlFilesToScan = htmlFiles;
                      resolve(htmlFiles);
                    }
                  };
                  reader.onerror = () => {
                    console.error(`Error reading ${filePath}`);
                    filesProcessed++;
                    
                    // Even if there's an error, continue with other files
                    if (filesProcessed === files.length) {
                      htmlFilesToScan = htmlFiles;
                      resolve(htmlFiles);
                    }
                  };
                  reader.readAsText(file);
                } else {
                  filesProcessed++;
                  // If all files are processed, resolve the promise
                  if (filesProcessed === files.length) {
                    htmlFilesToScan = htmlFiles;
                    resolve(htmlFiles);
                  }
                }
              }
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
        alert('No HTML files found in root folder. Please select HTML files to scan.');
        fileInput.click();
        
        // Wait for the user to select the files
        await filesPromise;
        
        // Clean up
        document.body.removeChild(fileInput);
        
        console.log(`Selected ${htmlFilesToScan.length} HTML files for scanning`);
        
        // If no HTML files were selected, create an empty array
        if (htmlFilesToScan.length === 0) {
          console.log('No HTML files were selected. The scanner will continue but may not find any i18n keys.');
        }
      }
    } else {
      // For web server, use the previous approach with predefined files
      // Add files from the scan path based on patterns
      for (const pattern of patterns) {
        const extension = pattern.replace('*', '');
        
        // Add common files with this extension
        const commonFiles = [
          'index' + extension,
          'home' + extension,
          'wish_setting' + extension,
          'writing_practice' + extension,
          'progress' + extension,
          'community' + extension,
          'profile' + extension,
          'founder_story' + extension,
          'privacy' + extension,
          'terms' + extension,
          'waitlist-thanks' + extension
        ];
        
        // Add subdirectory files
        const subDirs = ['de', 'zh', 'en'];
        
        for (const file of commonFiles) {
          // Normalize the scan path to ensure it has a trailing slash but not double slashes
          let normalizedPath = scanPath;
          // Detect which path separator is being used (Windows or Unix)
          const isWindowsPath = normalizedPath.includes('\\');
          const pathSeparator = isWindowsPath ? '\\' : '/';
          
          // Ensure path ends with the appropriate separator
          if (!normalizedPath.endsWith('/') && !normalizedPath.endsWith('\\')) {
            normalizedPath += pathSeparator;
          }
          
          // Ensure consistent path separators throughout the path
          if (isWindowsPath) {
            // Convert all forward slashes to backslashes for Windows
            normalizedPath = normalizedPath.replace(/\//g, '\\');
          } else {
            // Convert all backslashes to forward slashes for Unix
            normalizedPath = normalizedPath.replace(/\\/g, '/');
          }
          
          console.log(`Normalized path: ${normalizedPath} (using ${isWindowsPath ? 'Windows' : 'Unix'} style paths)`);
          
          // Add the file to scan list
          htmlFilesToScan.push(normalizedPath + file);
          
          // Also add subdirectory versions
          for (const dir of subDirs) {
            htmlFilesToScan.push(normalizedPath + dir + '/' + file);
          }
        }
      }
    }
    
    // Scan all HTML files for i18n keys
    const allKeys = new Set();
    const fileKeysMap = {};
    
    if (window.location.protocol === 'file:') {
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
    } else {
      // For web server, use fetch as before
      for (const htmlFile of htmlFilesToScan) {
        try {
          const response = await fetch(htmlFile);
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const html = await response.text();
          
          // Create a temporary DOM parser
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Scan for i18n keys in this file
          const fileKeys = scanKeysFromDocument(doc, mergedConfig.attributeSelectors);
          fileKeysMap[htmlFile] = Array.from(fileKeys);
          
          // Add to all keys
          fileKeys.forEach(key => allKeys.add(key));
          
          console.log(`Scanned ${htmlFile}: found ${fileKeys.size} unique i18n keys`);
        } catch (error) {
          console.error(`Error scanning ${htmlFile}:`, error);
        }
      }
    }
    
    // Rest of the function remains the same
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
  for (const lang of config.supportedLanguages) {
    console.log(`\n${lang.toUpperCase()} Missing Keys (${missingKeys[lang].length}):`);
    if (missingKeys[lang].length === 0) {
      console.log('No missing keys!');
    } else {
      missingKeys[lang].forEach(key => {
        // For non-default language, show the default language value as reference
        if (lang !== config.defaultLanguage) {
          const defaultValue = getNestedProperty(localeData[config.defaultLanguage], key);
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
function generateUpdatedLocaleData(missingKeys, localeData) {
  const updatedLocaleData = {};
  
  // Deep clone existing locale data
  for (const lang of config.supportedLanguages) {
    updatedLocaleData[lang] = JSON.parse(JSON.stringify(localeData[lang]));
  }
  
  // Add missing keys
  for (const lang of config.supportedLanguages) {
    for (const key of missingKeys[lang]) {
      let value = '';
      
      // For non-default language, use default language value as placeholder
      if (lang !== config.defaultLanguage) {
        const defaultValue = getNestedProperty(localeData[config.defaultLanguage], key);
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
function downloadUpdatedLocaleFiles(updatedLocaleData) {
  console.log('\n=== Updated Locale Files ===');
  
  // Clear previous download container
  const downloadContainer = document.getElementById('download-container');
  downloadContainer.innerHTML = '';
  
  // Add heading
  const heading = document.createElement('h2');
  heading.textContent = 'Updated Locale Files';
  downloadContainer.appendChild(heading);
  
  // Add description
  const description = document.createElement('p');
  description.textContent = 'The following files have been updated with missing keys. Click the download links to save them.';
  downloadContainer.appendChild(description);
  
  for (const lang of config.supportedLanguages) {
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
      
      // Add to the page
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
      
      console.log(`Created download link for updated ${lang}.json with ${missingCount} missing keys`);
    } catch (error) {
      console.error(`Error creating download for ${lang}.json:`, error);
    }
  }
}

// Clear results function
function clearResults() {
  document.getElementById('log-output').innerHTML = '';
  document.getElementById('download-container').innerHTML = '';
  console.log('Results cleared');
}

// Export functions for use in the UI
window.runScanner = runScanner;
window.clearResults = clearResults;