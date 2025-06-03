// language-switcher.js

import { translations } from '/header_footer/translations.js';

let isApplyingLanguage = false;

export function getTranslations(lang) {
    return translations[lang] || translations['en'];
}

function applyTheme(theme) {
    console.log(`Применение темы: ${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
    const settingsToggle = document.querySelector('.settings-toggle');
    if (settingsToggle) {
        settingsToggle.style.display = theme === 'accessibility' ? 'block' : 'none';
    }
}

function applyFontSize(size) {
    console.log(`Применение размера шрифта: ${size}`);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('accessibilityFontSize', size);
}

function applyAccessibilitySettings() {
    console.log('Применение настроек доступности');
    const fontSize = localStorage.getItem('accessibilityFontSize') || 'small';
    const colorScheme = localStorage.getItem('accessibilityColorScheme') || 'white-black';
    const images = localStorage.getItem('accessibilityImages') || 'on';

    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    document.documentElement.setAttribute('data-images', images);

    const allImages = document.querySelectorAll('img:not(.brand_icon):not(.restart-toggle img):not(.visibility-toggle img):not(.theme-toggle img):not(.settings-toggle img):not(.cart-icon-wrapper img):not(.social-icons img)');
    const lang = localStorage.getItem('language') || 'en';
    const t = getTranslations(lang);

    document.querySelectorAll('.image-placeholder').forEach(placeholder => placeholder.remove());

    if (images === 'off') {
        allImages.forEach(img => {
            if (!img.classList.contains('accessibility-panel') && !img.closest('.accessibility-panel')) {
                let placeholder = document.createElement('span');
                placeholder.className = 'image-placeholder';
                placeholder.textContent = t.accessibility.imagePlaceholder || '[Image]';
                img.parentNode.insertBefore(placeholder, img);
                img.style.display = 'none';
            }
        });
    } else {
        allImages.forEach(img => {
            img.style.display = 'block';
        });
    }
}

export function applyLanguage(lang, caller = 'unknown') {
    if (isApplyingLanguage) {
        console.log(`applyLanguage пропущен (уже выполняется) от ${caller}, lang: ${lang}`);
        return;
    }
    isApplyingLanguage = true;
    console.log(`applyLanguage вызван от ${caller}, lang: ${lang}, DOM готов: ${document.readyState}`);
    try {
        if (!translations) {
            console.error('Объект переводов не загружен, повтор через 100мс');
            setTimeout(() => {
                isApplyingLanguage = false;
                applyLanguage(lang, caller);
            }, 100);
            return;
        }
        if (!translations[lang]) {
            console.warn(`Язык ${lang} не поддерживается, откат на 'en'`);
            lang = 'en';
            localStorage.setItem('language', 'en');
        }

        document.documentElement.lang = lang;
        const t = getTranslations(lang);

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const keys = el.getAttribute('data-i18n').split('.');
            let translation = t;
            for (let key of keys) {
                translation = translation?.[key];
            }

            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            } else {
                console.warn('Перевод не найден для:', el.getAttribute('data-i18n'), 'в элементе:', el);
            }
        });

        document.querySelectorAll('.image-placeholder').forEach(placeholder => {
            placeholder.textContent = t.accessibility.imagePlaceholder || '[Image]';
        });

        const event = new CustomEvent('languageChanged', { detail: { language: lang } });
        document.dispatchEvent(event);
    } finally {
        isApplyingLanguage = false;
    }
}

function showAccessibilityPanel() {
    console.log('Показ панели доступности');
    let panel = document.querySelector('.accessibility-panel');
    const lang = localStorage.getItem('language') || 'en';
    const t = getTranslations(lang);

    if (panel) {
        panel.remove();
    }

    panel = document.createElement('div');
    panel.className = 'accessibility-panel';
    panel.innerHTML = `
        <div class="accessibility-controls">
            <h3 data-i18n="accessibility.panelTitle">${t.accessibility.panelTitle}</h3>
            <div class="control-group font-size-control">
                <label data-i18n="accessibility.fontSize">${t.accessibility.fontSize}</label>
                <div class="button-group">
                    <button class="font-size-button" data-font-size="small" data-i18n="accessibility.fontSizeSmall">${t.accessibility.fontSizeSmall}</button>
                    <button class="font-size-button" data-font-size="medium" data-i18n="accessibility.fontSizeMedium">${t.accessibility.fontSizeMedium}</button>
                    <button class="font-size-button" data-font-size="large" data-i18n="accessibility.fontSizeLarge">${t.accessibility.fontSizeLarge}</button>
                </div>
            </div>
            <div class="control-group color-scheme-control">
                <label data-i18n="accessibility.colorScheme">${t.accessibility.colorScheme}</label>
                <div class="button-group">
                    <button data-color-scheme="black-white" data-i18n="accessibility.colorSchemeBlackWhite">${t.accessibility.colorSchemeBlackWhite}</button>
                    <button data-color-scheme="white-black" data-i18n="accessibility.colorSchemeWhiteBlack">${t.accessibility.colorSchemeWhiteBlack}</button>
                    <button data-color-scheme="black-green" data-i18n="accessibility.colorSchemeBlackGreen">${t.accessibility.colorSchemeBlackGreen}</button>
                    <button data-color-scheme="beige-brown" data-i18n="accessibility.colorSchemeBeigeBrown">${t.accessibility.colorSchemeBeigeBrown}</button>
                    <button data-color-scheme="blue-lightblue" data-i18n="accessibility.colorSchemeBlueLightblue">${t.accessibility.colorSchemeBlueLightblue}</button>
                </div>
            </div>
            <div class="control-group images-control">
                <label data-i18n="accessibility.images">${t.accessibility.images}</label>
                <div class="button-group">
                    <button data-images="on" data-i18n="accessibility.imagesOn">${t.accessibility.imagesOn}</button>
                    <button data-images="off" data-i18n="accessibility.imagesOff">${t.accessibility.imagesOff}</button>
                </div>
            </div>
            <div class="action-buttons">
                <button class="apply-settings" data-i18n="accessibility.apply">${t.accessibility.apply}</button>
                <button class="close-settings" data-i18n="accessibility.close">${t.accessibility.close}</button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    const currentFontSize = localStorage.getItem('accessibilityFontSize') || 'small';
    const currentColorScheme = localStorage.getItem('accessibilityColorScheme') || 'white-black';
    const currentImages = localStorage.getItem('accessibilityImages') || 'on';

    let tempFontSize = currentFontSize;
    let tempColorScheme = currentColorScheme;
    let tempImages = currentImages;

    // Font Size Buttons
    panel.querySelectorAll('.font-size-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-font-size') === currentFontSize);
        btn.addEventListener('click', () => {
            tempFontSize = btn.getAttribute('data-font-size');
            applyFontSize(tempFontSize); // Мгновенное применение
            panel.querySelectorAll('.font-size-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Color Scheme Buttons
    panel.querySelectorAll('.color-scheme-control button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color-scheme') === currentColorScheme);
        btn.addEventListener('click', () => {
            tempColorScheme = btn.getAttribute('data-color-scheme');
            panel.querySelectorAll('.color-scheme-control button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Images Buttons
    panel.querySelectorAll('.images-control button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-images') === currentImages);
        btn.addEventListener('click', () => {
            tempImages = btn.getAttribute('data-images');
            panel.querySelectorAll('.images-control button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Apply Settings
    panel.querySelector('.apply-settings').addEventListener('click', () => {
        localStorage.setItem('accessibilityColorScheme', tempColorScheme);
        localStorage.setItem('accessibilityImages', tempImages);
        applyAccessibilitySettings();
        panel.classList.remove('show');
    });

    // Close Settings
    panel.querySelector('.close-settings').addEventListener('click', () => {
        panel.classList.remove('show');
    });

    panel.classList.add('show');
    applyLanguage(lang, 'showAccessibilityPanel');
}

export function applyVisibility() {
    console.log('Применение видимости');
    const visibility = localStorage.getItem('visibility') || 'visible';
    const isHomePage = document.body.getAttribute('data-page') === 'home';

    if (visibility === 'accessibility' && isHomePage) {
        applyTheme('accessibility');
        applyAccessibilitySettings();
    } else {
        localStorage.setItem('visibility', 'visible');
        const theme = localStorage.getItem('theme') || 'light';
        applyTheme(theme);
        document.documentElement.removeAttribute('data-font-size');
        document.documentElement.removeAttribute('data-color-scheme');
        document.documentElement.removeAttribute('data-images');
        document.querySelectorAll('img').forEach(img => {
            img.style.display = 'block';
        });
        document.querySelectorAll('.image-placeholder').forEach(placeholder => {
            placeholder.remove();
        });
    }

    const visibilityWrapper = document.querySelector('.visibility-wrapper');
    if (visibilityWrapper) {
        visibilityWrapper.style.display = 'block';
    }

    const visibilityCheckbox = document.getElementById('visibility');
    if (visibilityCheckbox) {
        visibilityCheckbox.checked = visibility === 'accessibility' && isHomePage;
    }
}

function updateThemeInput() {
    const themeToggle = document.getElementById('theme-toggle');
    const isHomePage = document.body.getAttribute('data-page') === 'home';

    if (themeToggle) {
        themeToggle.classList.toggle('visible', isHomePage);
        const currentTheme = localStorage.getItem('theme') || 'light';
        themeToggle.checked = currentTheme === 'dark';

        const newThemeToggle = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newThemeToggle, themeToggle);

        newThemeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
            applyVisibility();
            const event = new CustomEvent('themeChanged', { detail: { theme } });
            document.dispatchEvent(event);
        });
    }
}

function updateLanguageInputs() {
    const currentLang = localStorage.getItem('language') || 'en';
    const radios = document.querySelectorAll('input[name="language"]');
    radios.forEach(radio => {
        radio.checked = radio.value === currentLang;
        const newRadio = radio.cloneNode(true);
        radio.parentNode.replaceChild(newRadio, radio);
        newRadio.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('language', this.value);
                applyLanguage(this.value, 'languageInputChange');
            }
        });
    });
}

function initializeVisibilityCheckbox(attempt = 0, maxAttempts = 10) {
    console.log(`Инициализация visibilityCheckbox, попытка ${attempt + 1}`);
    const visibilityCheckbox = document.getElementById('visibility');
    if (visibilityCheckbox) {
        console.log('visibilityCheckbox найден:', visibilityCheckbox);
        visibilityCheckbox.checked = localStorage.getItem('visibility') === 'accessibility' && document.body.getAttribute('data-page') === 'home';
        const newVisibilityCheckbox = visibilityCheckbox.cloneNode(true);
        visibilityCheckbox.parentNode.replaceChild(newVisibilityCheckbox, visibilityCheckbox);
        newVisibilityCheckbox.addEventListener('change', function() {
            const isHomePage = document.body.getAttribute('data-page') === 'home';
            if (this.checked && !isHomePage) {
                console.log('Режим доступности доступен только на главной странице');
                this.checked = false;
                return;
            }
            const visibility = this.checked ? 'accessibility' : 'visible';
            console.log(`Переключение видимости на: ${visibility}`);
            localStorage.setItem('visibility', visibility);
            applyVisibility();
            if (visibility === 'accessibility') {
                showAccessibilityPanel();
            }
        });
    } else if (attempt < maxAttempts) {
        console.warn(`visibilityCheckbox не найден, повтор (${attempt + 1}/${maxAttempts})`);
        setTimeout(() => initializeVisibilityCheckbox(attempt + 1, maxAttempts), 500);
    } else {
        console.error('visibilityCheckbox не найден после максимума попыток');
    }
}

function initializeSettingsToggle() {
    console.log('Инициализация переключателя настроек');
    const settingsToggle = document.querySelector('.settings-toggle');
    if (settingsToggle) {
        const newSettingsToggle = settingsToggle.cloneNode(true);
        settingsToggle.parentNode.replaceChild(newSettingsToggle, settingsToggle);
        newSettingsToggle.addEventListener('click', () => {
            if (localStorage.getItem('visibility') === 'accessibility' && document.body.getAttribute('data-page') === 'home') {
                showAccessibilityPanel();
            }
        });
    }
}

function handleNavigationLinks() {
    const links = document.querySelectorAll('#header .links a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const isHomePage = document.body.getAttribute('data-page') === 'home';
            const href = link.getAttribute('href');
            if (isHomePage && href && !href.includes('index.html') && !href.includes('#')) {
                console.log('Сброс режима доступности для навигации');
                localStorage.setItem('visibility', 'visible');
                applyVisibility();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    if (!localStorage.getItem('language')) {
        localStorage.setItem('language', 'en');
    }
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'light');
    }
    if (!localStorage.getItem('visibility')) {
        localStorage.setItem('visibility', 'visible');
    }
    if (!localStorage.getItem('accessibilityFontSize')) {
        localStorage.setItem('accessibilityFontSize', 'small');
    }
    if (!localStorage.getItem('accessibilityColorScheme')) {
        localStorage.setItem('accessibilityColorScheme', 'white-black');
    }
    if (!localStorage.getItem('accessibilityImages')) {
        localStorage.setItem('accessibilityImages', 'on');
    }
    applyVisibility();
});

document.addEventListener('headerLoaded', () => {
    console.log('Заголовок загружен');
    updateLanguageInputs();
    updateThemeInput();
    const lang = localStorage.getItem('language') || 'en';
    applyLanguage(lang, 'headerLoaded');
    applyVisibility();
    initializeVisibilityCheckbox();
    initializeSettingsToggle();
    handleNavigationLinks();
});