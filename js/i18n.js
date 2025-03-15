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
    fetch(`locale/${lang}.json`)
        .then(response => response.json())
        .then(data => {
            updateContent(data);
        })
        .catch(error => {
            console.error('Error loading language file:', error);
            // Try alternate path if first attempt fails
            fetch(`locales/${lang}.json`)
                .then(response => response.json())
                .then(data => {
                    updateContent(data);
                })
                .catch(err => {
                    console.error('Error loading language file from alternate path:', err);
                });
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
    return path.split('.').reduce((prev, curr) => {
        return prev && prev[curr] ? prev[curr] : null;
    }, obj);
}