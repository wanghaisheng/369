document.addEventListener('DOMContentLoaded', function() {
    // 获取浏览器语言
    function getBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        // 只取语言代码的前两个字符，例如zh-CN变成zh
        return browserLang.substring(0, 2);
    }
    
    // 检查浏览器语言是否在支持的语言列表中
    function isLanguageSupported(lang) {
        const supportedLanguages = ['en', 'zh'];
        return supportedLanguages.includes(lang);
    }
    
    // 默认语言：优先使用本地存储的语言，其次使用浏览器语言，最后使用英语
    const browserLang = getBrowserLanguage();
    let currentLang = localStorage.getItem('language') || 
                     (isLanguageSupported(browserLang) ? browserLang : 'en');
    
    // 加载语言文件
    loadLanguage(currentLang);
    
    // 语言选择器事件监听
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        // 设置选择器初始值
        languageSelector.value = currentLang;
        
        languageSelector.addEventListener('change', function() {
            const selectedLang = this.value;
            localStorage.setItem('language', selectedLang);
            loadLanguage(selectedLang);
        });
    }
    
    // 加载语言文件并应用翻译
    function loadLanguage(lang) {
        fetch(`locales/${lang}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Language file not found');
                }
                return response.json();
            })
            .then(data => {
                applyTranslations(data);
                document.documentElement.lang = lang; // 更新html的lang属性
                
                // 更新语言选择器的值
                if (languageSelector) {
                    languageSelector.value = lang;
                }
                
                // 触发自定义事件，通知其他脚本语言已更改
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
            })
            .catch(error => {
                console.error('Error loading language file:', error);
                // 如果加载失败，尝试加载默认语言
                if (lang !== 'en') {
                    loadLanguage('en');
                }
            });
    }
    
    // 应用翻译到页面元素
    function applyTranslations(translations) {
        // 处理data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // 处理data-i18n-placeholder属性的元素
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.setAttribute('placeholder', translation);
            }
        });
        
        // 处理select选项中的data-i18n属性
        document.querySelectorAll('option[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // 处理data-i18n-value属性的元素
        document.querySelectorAll('[data-i18n-value]').forEach(element => {
            const key = element.getAttribute('data-i18n-value');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.setAttribute('value', translation);
            }
        });
        
        // 处理data-i18n-title属性的元素
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.setAttribute('title', translation);
            }
        });
        
        // 处理data-i18n-alt属性的元素（图片替代文本）
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            const translation = getNestedTranslation(translations, key);
            
            if (translation) {
                element.setAttribute('alt', translation);
            }
        });
    }
    
    // 获取嵌套的翻译值
    function getNestedTranslation(obj, path) {
        if (!path || !obj) return null;
        
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return null;
            }
        }
        
        return result;
    }
});

