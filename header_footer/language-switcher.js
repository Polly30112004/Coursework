import { translations } from '/header_footer/translations.js';

console.log('Translations loaded:', translations, 'Available languages:', Object.keys(translations));

let isApplyingLanguage = false;

export function getTranslations(lang) {
    return translations[lang] || translations['en'];
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('Applied theme:', theme);
}

export function applyLanguage(lang, caller = 'unknown') {
    if (isApplyingLanguage) {
        console.log(`applyLanguage skipped (already in progress) from ${caller}, lang: ${lang}`);
        return;
    }
    isApplyingLanguage = true;
    console.log(`applyLanguage called from ${caller}, lang: ${lang}, DOM ready: ${document.readyState}`);
    try {
        if (!translations) {
            console.error('Translations object not loaded yet, retrying after delay');
            setTimeout(() => {
                isApplyingLanguage = false;
                applyLanguage(lang, caller);
            }, 100);
            return;
        }
        if (!translations[lang]) {
            console.warn(`Language ${lang} not supported, falling back to 'en'`);
            lang = 'en';
            localStorage.setItem('language', 'en');
        }

        document.documentElement.lang = lang;
        const t = getTranslations(lang);
        console.log('Translations loaded:', !!t);

        const elements = document.querySelectorAll('[data-i18n]');
        console.log('Found elements with data-i18n:', elements.length);
        elements.forEach(el => {
            const keys = el.getAttribute('data-i18n').split('.');
            let translation = t;

            keys.forEach(key => {
                translation = translation?.[key];
            });

            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            } else {
                console.warn('Translation not found for:', el.getAttribute('data-i18n'), 'in element:', el);
            }
        });

        const event = new CustomEvent('languageChanged', { detail: { language: lang } });
        document.dispatchEvent(event);
    } finally {
        isApplyingLanguage = false;
    }
}

function applyVisibility(visibility) {
    // Логика видимости, если требуется
}

function updateThemeInput() {
    const themeCheckbox = document.getElementById('theme');
    if (themeCheckbox) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        themeCheckbox.checked = currentTheme === 'dark';
        themeCheckbox.replaceWith(themeCheckbox.cloneNode(true));
        const newThemeCheckbox = document.getElementById('theme');
        newThemeCheckbox.addEventListener('change', function () {
            const theme = this.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            applyTheme(theme);
            const event = new CustomEvent('themeChanged', { detail: { theme } });
            document.dispatchEvent(event);
        });
    } else {
        console.debug('Theme checkbox not found, possibly no header on this page:', window.location.pathname);
    }
}

function updateLanguageInputs() {
    const currentLang = localStorage.getItem('language') || 'en';
    const radios = document.querySelectorAll('input[name="language"]');
    console.log('Found language radio buttons:', radios.length);
    radios.forEach(radio => {
        radio.checked = radio.value === currentLang;
        radio.replaceWith(radio.cloneNode(true));
        const newRadio = document.querySelector(`input[name="language"][value="${radio.value}"]`);
        newRadio.addEventListener('change', function () {
            if (this.checked) {
                console.log('Language changed to:', this.value);
                localStorage.setItem('language', this.value);
                applyLanguage(this.value, 'languageInputChange');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (!localStorage.getItem('language')) {
        localStorage.setItem('language', 'en');
    }

    let savedTheme = localStorage.getItem('theme') || 'light';
    localStorage.setItem('theme', savedTheme);
    applyTheme(savedTheme);

    if (document.querySelector('#header')) {
        updateThemeInput();
        updateLanguageInputs();
    }

    document.addEventListener('headerLoaded', () => {
        updateLanguageInputs();
        updateThemeInput();
        const lang = localStorage.getItem('language') || 'en';
        console.log('Header loaded, applying language:', lang);
        applyLanguage(lang, 'headerLoaded');
    });

    const savedVisibility = localStorage.getItem('visibility') || 'visible';
    applyVisibility(savedVisibility);
    const visibilityCheckbox = document.getElementById('visibility');
    if (visibilityCheckbox) {
        visibilityCheckbox.checked = savedVisibility === 'hidden';
        visibilityCheckbox.addEventListener('change', function () {
            const visibility = this.checked ? 'hidden' : 'visible';
            localStorage.setItem('visibility', visibility);
            applyVisibility(visibility);
        });
    }
});