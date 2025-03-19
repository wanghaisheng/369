document.addEventListener('DOMContentLoaded', function() {
    console.log("Validating i18n attributes against JSON files...");
    
    // Available languages
    const availableLanguages = ['en', 'zh', 'ja', 'es'];
    
    // Load all language JSON files
    Promise.all(
        availableLanguages.map(lang => 
            fetch(`locales/${lang}.json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${lang} locale file`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error(`Error loading ${lang} language file:`, error);
                    return null;
                })
        )
    )
    .then(languageData => {
        // Filter out any failed loads
        const validLanguageData = languageData.filter(data => data !== null);
        
        if (validLanguageData.length === 0) {
            console.error("No language files could be loaded. Validation cannot proceed.");
            return;
        }
        
        // Get all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${elements.length} elements with data-i18n attributes`);
        
        // Track missing keys per language
        let missingKeys = {};
        availableLanguages.forEach(lang => {
            missingKeys[lang] = [];
        });
        
        const langIndex = {};
        validLanguageData.forEach((data, index) => {
            const lang = availableLanguages[index];
            if (data) {
                langIndex[lang] = data;
            }
        });
        
        // Validate each element
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            
            // Check if key exists in all language files
            availableLanguages.forEach(lang => {
                if (langIndex[lang]) {
                    const value = getNestedProperty(langIndex[lang], key);
                    if (!value) {
                        missingKeys[lang].push(key);
                        console.error(`Missing ${lang} translation for key: ${key}`);
                        
                        // Add visual indicator in dev environment
                        if (lang === 'en') {  // Primary language
                            el.style.border = "1px solid red";
                            el.title = "Missing translation key: " + key;
                        } else if (!el.style.border) {
                            el.style.outline = `1px solid orange`;
                            el.title = (el.title ? el.title + " | " : "") + `Missing ${lang} translation: ${key}`;
                        }
                    }
                }
            });
        });
        
        // Also check elements with data-i18n-placeholder, data-i18n-content, data-i18n-alt
        const attributeSelectors = ['data-i18n-placeholder', 'data-i18n-content', 'data-i18n-alt', 'data-i18n-title'];
        
        attributeSelectors.forEach(attr => {
            const attrElements = document.querySelectorAll(`[${attr}]`);
            console.log(`Found ${attrElements.length} elements with ${attr} attributes`);
            
            attrElements.forEach(el => {
                const key = el.getAttribute(attr);
                
                // Check if key exists in all language files
                availableLanguages.forEach(lang => {
                    if (langIndex[lang]) {
                        const value = getNestedProperty(langIndex[lang], key);
                        if (!value) {
                            missingKeys[lang].push(key);
                            console.error(`Missing ${lang} translation for ${attr} key: ${key}`);
                            
                            if (lang === 'en') {  // Primary language
                                el.style.outline = "1px solid red";
                                el.title = "Missing translation key: " + key;
                            } else if (!el.style.outline) {
                                el.style.outline = `1px solid orange`;
                                el.title = (el.title ? el.title + " | " : "") + `Missing ${lang} translation: ${key}`;
                            }
                        }
                    }
                });
            });
        });
        
        // Summary
        console.log(`\n=== Validation Summary ===`);
        availableLanguages.forEach(lang => {
            if (langIndex[lang]) {
                console.log(`Missing ${lang} translations: ${missingKeys[lang].length}`);
            }
        });
        
        // Check if all translations are complete
        const allComplete = Object.values(missingKeys).every(keys => keys.length === 0);
        
        if (allComplete) {
            console.log("All translations are complete and valid!");
        } else {
            console.log("Some translations are missing. See errors above for details.");
            
            // Create a floating indicator for developers
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                const totalMissingKeys = Object.values(missingKeys).reduce((total, keys) => total + keys.length, 0);
                const indicator = document.createElement('div');
                indicator.style.position = 'fixed';
                indicator.style.bottom = '10px';
                indicator.style.right = '10px';
                indicator.style.padding = '10px 15px';
                indicator.style.backgroundColor = totalMissingKeys > 0 ? '#f44336' : '#4CAF50';
                indicator.style.color = 'white';
                indicator.style.borderRadius = '4px';
                indicator.style.zIndex = '9999';
                indicator.style.fontSize = '14px';
                indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
                indicator.innerHTML = `i18n issues: ${totalMissingKeys}`;
                document.body.appendChild(indicator);
                
                indicator.addEventListener('click', function() {
                    console.table(missingKeys);
                });
            }
        }
    })
    .catch(error => {
        console.error("Error validating translations:", error);
    });
    
    // Helper function to get nested property from object
    function getNestedProperty(obj, path) {
        if (!obj || !path) return null;
        return path.split('.').reduce((prev, curr) => {
            return prev && prev[curr] ? prev[curr] : null;
        }, obj);
    }
});