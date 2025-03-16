/**
 * i18n Key Creator Tool
 * 
 * This script helps manage internationalization (i18n) keys by:
 * 1. Scanning HTML files for data-i18n attributes
 * 2. Comparing with existing locale JSON files
 * 3. Identifying missing keys
 * 4. Creating a report of missing keys
 * 5. Generating updated JSON files with missing keys
 */

// Configuration
const config = {
  localeDir: 'locale',
  supportedLanguages: ['en', 'zh'],
  defaultLanguage: 'en',
  attributeSelectors: ['data-i18n', 'data-i18n-placeholder', 'data-i18n-content', 'data-i18n-alt', 'data-i18n-title']
};

// Main function to run the tool
async function run() {
  console.log('=== i18n Key Creator Tool ===');
  
  try {
    // Load existing locale files
    const localeData = {};
    for (const lang of config.supportedLanguages) {
      try {
        const response = await fetch(`${config.localeDir}/${lang}.json`);
        localeData[lang] = await response.json();
        console.log(`Loaded ${lang}.json successfully`);
      } catch (error) {
        console.error(`Error loading ${lang}.json:`, error);
        localeData[lang] = {};
      }
    }
    
    // Scan HTML files for i18n keys
    const keys = scanKeysFromDOM();
    console.log(`Found ${keys.size} unique i18n keys in the DOM`);
    
    // Check for missing keys in each language
    const missingKeys = {};
    for (const lang of config.supportedLanguages) {
      missingKeys[lang] = findMissingKeys(keys, localeData[lang]);
      console.log(`Found ${missingKeys[lang].length} missing keys in ${lang}.json`);
    }
    
    // Generate report
    displayReport(missingKeys, localeData);
    
    // Generate updated JSON files if there are missing keys
    if (Object.values(missingKeys).some(keys => keys.length > 0)) {
      const updatedLocaleData = generateUpdatedLocaleData(missingKeys, localeData);
      downloadUpdatedLocaleFiles(updatedLocaleData);
    }
  } catch (error) {
    console.error('Error running i18n Key Creator Tool:', error);
  }
}

// Scan the DOM for all i18n keys
function scanKeysFromDOM() {
  const keys = new Set();
  
  // Scan for each attribute type
  for (const attr of config.attributeSelectors) {
    const elements = document.querySelectorAll(`[${attr}]`);
    console.log(`Found ${elements.length} elements with ${attr} attributes`);
    
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
function displayReport(missingKeys, localeData) {
  console.log('\n=== Missing Keys Report ===');
  
  for (const lang of config.supportedLanguages) {
    console.log(`\n${lang.toUpperCase()} Missing Keys:`);
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
      });
    }
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
  
  for (const lang of config.supportedLanguages) {
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
    
    // Add to the page
    const container = document.createElement('div');
    container.style.margin = '20px';
    container.style.padding = '15px';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '5px';
    container.style.backgroundColor = '#f8f9fa';
    
    const heading = document.createElement('h3');
    heading.textContent = `Updated ${lang}.json`;
    container.appendChild(heading);
    
    const pre = document.createElement('pre');
    pre.style.maxHeight = '300px';
    pre.style.overflow = 'auto';
    pre.style.padding = '10px';
    pre.style.backgroundColor = '#f1f1f1';
    pre.style.borderRadius = '3px';
    pre.textContent = jsonString;
    container.appendChild(pre);
    
    container.appendChild(a);
    document.body.appendChild(container);
    
    console.log(`Created download link for updated ${lang}.json`);
  }
}

// Run the tool when the page is loaded
document.addEventListener('DOMContentLoaded', run);