document.addEventListener('DOMContentLoaded', function() {
    // Default language
    let currentLang = localStorage.getItem('language') || 'en';
    
    // Load language data
    loadLanguage(currentLang);
    
    // Setup language selector if present
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        languageSelector.value = currentLang;
        languageSelector.addEventListener('change', function() {
            const newLang = this.value;
            localStorage.setItem('language', newLang);
            loadLanguage(newLang);
        });
    }
    
    // Setup language buttons
    const languageButtons = document.querySelectorAll('.language-button');
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const newLang = currentLang === 'en' ? 'zh' : 'en';
            localStorage.setItem('language', newLang);
            loadLanguage(newLang);
            currentLang = newLang;
        });
    });
});

function loadLanguage(lang) {
    fetch(`locales/${lang}.json`)
        .then(response => response.json())
        .then(data => {
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
}

function getNestedProperty(obj, path) {
    return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] ? prev[curr] : null;
    }, obj);
}

