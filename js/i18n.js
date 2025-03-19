document.addEventListener('DOMContentLoaded', function() {
    // Default language
    let currentLang = localStorage.getItem('language') || 'en';
    
    // Store current language data globally for access by other scripts
    window.currentLangData = null;
    
    // Available languages
    const availableLanguages = ['en', 'zh', 'ja', 'es'];
    
    // Setup language selectors
    setupLanguageSelectors();
    
    // Load language data
    loadLanguage(currentLang);
    
    function setupLanguageSelectors() {
        // Setup language selector if present
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            // Create options for all available languages if they don't exist
            if (languageSelector.children.length < availableLanguages.length) {
                // Clear existing options
                languageSelector.innerHTML = '';
                
                // Add options for each language
                availableLanguages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = getLanguageName(lang);
                    languageSelector.appendChild(option);
                });
            }
            
            languageSelector.value = currentLang;
            languageSelector.addEventListener('change', function() {
                const newLang = this.value;
                updateLanguage(newLang);
            });
        }
        
        // Setup language option links
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const newLang = this.getAttribute('data-lang');
                updateLanguage(newLang);
            });
        });
        
        // Setup language toggle buttons
        const languageButtons = document.querySelectorAll('.language-button');
        languageButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Cycle through available languages
                const currentIndex = availableLanguages.indexOf(currentLang);
                const nextIndex = (currentIndex + 1) % availableLanguages.length;
                updateLanguage(availableLanguages[nextIndex]);
            });
        });
        
        // Setup footer language selector
        const footerLanguageSelector = document.getElementById('footer-language-selector');
        if (footerLanguageSelector) {
            // Create options for all available languages if they don't exist
            if (footerLanguageSelector.children.length < availableLanguages.length) {
                // Clear existing options
                footerLanguageSelector.innerHTML = '';
                
                // Add options for each language
                availableLanguages.forEach(lang => {
                    const option = document.createElement('option');
                    option.value = lang;
                    option.textContent = getLanguageName(lang);
                    footerLanguageSelector.appendChild(option);
                });
            }
            
            footerLanguageSelector.value = currentLang;
            footerLanguageSelector.addEventListener('change', function() {
                const newLang = this.value;
                updateLanguage(newLang);
            });
        }
    }
    
    function updateLanguage(newLang) {
        localStorage.setItem('language', newLang);
        loadLanguage(newLang);
        currentLang = newLang;
        
        // Update all selectors with new language
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.value = newLang;
        }
        
        const footerLanguageSelector = document.getElementById('footer-language-selector');
        if (footerLanguageSelector) {
            footerLanguageSelector.value = newLang;
        }
    }
    
    function getLanguageName(lang) {
        const names = {
            'en': 'English',
            'zh': '中文',
            'ja': '日本語',
            'es': 'Español'
        };
        return names[lang] || lang;
    }
});

function loadLanguage(lang) {
    fetch(`locales/${lang}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load locale file');
            }
            return response.json();
        })
        .then(data => {
            window.currentLangData = data;
            updateContent(data);
        })
        .catch(error => {
            console.error('Error loading language file:', error);
        });
}

function updateContent(langData) {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = getNestedProperty(langData, key);
        if (text) {
            element.textContent = text;
        }
    });
    
    // Update all placeholders with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const text = getNestedProperty(langData, key);
        if (text) {
            element.placeholder = text;
        }
    });

    // Update all alt attributes with data-i18n-alt attribute
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
        const key = element.getAttribute('data-i18n-alt');
        const text = getNestedProperty(langData, key);
        if (text) {
            element.alt = text;
        }
    });

    // Update all title attributes with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const text = getNestedProperty(langData, key);
        if (text) {
            element.title = text;
        }
    });

    // Update all content attributes with data-i18n-content attribute
    document.querySelectorAll('[data-i18n-content]').forEach(element => {
        const key = element.getAttribute('data-i18n-content');
        const text = getNestedProperty(langData, key);
        if (text) {
            if (element.tagName === 'META') {
                element.content = text;
            }
        }
    });
}

function getNestedProperty(obj, path) {
    if (!obj || !path) return null;
    return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] ? prev[curr] : null;
    }, obj);
}