/**
 * i18n Key Updater Tool
 * 
 * This script helps automatically update locale JSON files with missing keys by:
 * 1. Taking the scan results from i18n-key-scanner.js
 * 2. Generating properly structured JSON with missing keys
 * 3. Merging the missing keys with existing locale files
 * 4. Saving the updated locale files directly
 */

// Configuration
const config = {
  localeDir: 'locale',
  supportedLanguages: ['en', 'zh'],
  defaultLanguage: 'en',
  backupFiles: true // Create backups before overwriting
};

// Main function to run the updater
async function runUpdater(missingKeys, localeData, localePath = './locales') {
  console.log(`Using locale files from: ${localePath}`);
  
  try {
    if (!missingKeys || !localeData) {
      throw new Error('Missing required data. Please run the scanner first.');
    }
    
    // Check if there are any missing keys
    const hasMissingKeys = Object.values(missingKeys).some(keys => keys.length > 0);
    if (!hasMissingKeys) {
      console.log('No missing keys found. All locale files are up to date!');
      return;
    }
    
    console.log(`Found missing keys in locale files. Preparing to update...`);
    
    // Generate updated locale data
    const updatedLocaleData = generateUpdatedLocaleData(missingKeys, localeData);
    
    // Create backups if enabled
    if (config.backupFiles) {
      await createBackups(localeData);
    }
    
    // Save updated locale files
    await saveUpdatedLocaleFiles(updatedLocaleData);
    
    console.log('Locale files have been successfully updated!');
  } catch (error) {
    console.error('Error running i18n Key Updater Tool:', error);
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

// Create backups of existing locale files
async function createBackups(localeData) {
  console.log('Creating backups of existing locale files...');
  
  for (const lang of config.supportedLanguages) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${config.localeDir}/${lang}_backup_${timestamp}.json`;
      
      const jsonString = JSON.stringify(localeData[lang], null, 2);
      await saveFile(backupFileName, jsonString);
      
      console.log(`Created backup: ${backupFileName}`);
    } catch (error) {
      console.error(`Error creating backup for ${lang}.json:`, error);
    }
  }
}

// Save updated locale files
async function saveUpdatedLocaleFiles(updatedLocaleData) {
  console.log('Saving updated locale files...');
  
  for (const lang of config.supportedLanguages) {
    try {
      const fileName = `${config.localeDir}/${lang}.json`;
      const jsonString = JSON.stringify(updatedLocaleData[lang], null, 2);
      
      await saveFile(fileName, jsonString);
      
      console.log(`Updated ${lang}.json successfully`);
    } catch (error) {
      console.error(`Error saving ${lang}.json:`, error);
    }
  }
}

// Helper function to save a file
async function saveFile(fileName, content) {
  return new Promise((resolve, reject) => {
    // In a browser environment, we can't directly save files to the filesystem
    // This is a placeholder for server-side implementation
    console.log(`Would save file ${fileName} (server-side implementation needed)`);
    
    // For demonstration, we'll create a download link
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.split('/').pop();
    a.textContent = `Download ${a.download}`;
    a.style.display = 'block';
    a.style.margin = '10px 0';
    
    // Add to the page
    const container = document.getElementById('download-container') || document.body;
    container.appendChild(a);
    
    resolve();
  });
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

// Export functions for use in the UI
window.runUpdater = runUpdater;