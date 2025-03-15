document.addEventListener('DOMContentLoaded', function() {
    console.log("Validating i18n attributes against JSON files...");
    
    // Load both language JSON files
    Promise.all([
        fetch('locale/en.json').then(response => response.json()),
        fetch('locale/zh.json').then(response => response.json())
    ])
    .then(([enData, zhData]) => {
        // Get all elements with data-i18n attributes
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${elements.length} elements with data-i18n attributes`);
        
        let missingKeys = {en: [], zh: []};
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            
            // Check if key exists in both language files
            const enValue = getNestedProperty(enData, key);
            const zhValue = getNestedProperty(zhData, key);
            
            if (!enValue) {
                missingKeys.en.push(key);
                console.error(`Missing English translation for key: ${key}`);
            }
            
            if (!zhValue) {
                missingKeys.zh.push(key);
                console.error(`Missing Chinese translation for key: ${key}`);
            }
        });
        
        // Also check elements with data-i18n-placeholder, data-i18n-content, data-i18n-alt
        const attributeSelectors = ['data-i18n-placeholder', 'data-i18n-content', 'data-i18n-alt', 'data-i18n-title'];
        
        attributeSelectors.forEach(attr => {
            const attrElements = document.querySelectorAll(`[${attr}]`);
            console.log(`Found ${attrElements.length} elements with ${attr} attributes`);
            
            attrElements.forEach(el => {
                const key = el.getAttribute(attr);
                
                // Check if key exists in both language files
                const enValue = getNestedProperty(enData, key);
                const zhValue = getNestedProperty(zhData, key);
                
                if (!enValue) {
                    missingKeys.en.push(key);
                    console.error(`Missing English translation for ${attr} key: ${key}`);
                }
                
                if (!zhValue) {
                    missingKeys.zh.push(key);
                    console.error(`Missing Chinese translation for ${attr} key: ${key}`);
                }
            });
        });
        
        // Summary
        console.log(`\n=== Validation Summary ===`);
        console.log(`Missing English translations: ${missingKeys.en.length}`);
        console.log(`Missing Chinese translations: ${missingKeys.zh.length}`);
        
        if (missingKeys.en.length === 0 && missingKeys.zh.length === 0) {
            console.log("All translations are complete and valid!");
        } else {
            console.log("Some translations are missing. See errors above for details.");
        }
    })
    .catch(error => {
        console.error("Error loading language files:", error);
    });
    
    // Helper function to get nested property from object
    function getNestedProperty(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev && prev[curr] ? prev[curr] : null;
        }, obj);
    }
});