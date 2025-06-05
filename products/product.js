// product.js

import { getTranslations, applyLanguage } from '/header_footer/language-switcher.js';
import { updateHeader } from '/header_footer/header_footer_js.js';

console.log('localStorage:', localStorage);

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let productId = null;
    let availableDates = [];

    const getCurrentTranslations = () => getTranslations(localStorage.getItem('language') || 'en');
    const getCurrentLanguage = () => localStorage.getItem('language') || 'en';

    function checkUser() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }

    function isAdmin() {
        const admin = currentUser && (currentUser.userName === 'Admin' || currentUser.isAdmin === true);
        console.log('isAdmin check:', admin, 'currentUser:', currentUser);
        return admin;
    }

    function getProductId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function waitForHeader(callback) {
        if (document.getElementById('header')?.innerHTML) {
            callback();
        } else {
            document.addEventListener('headerLoaded', callback, { once: true });
        }
    }

    function setupLanguageInputs() {
        waitForHeader(() => {
            const langRadios = document.querySelectorAll('input[name="language"]');
            if (langRadios.length === 0) {
                console.warn('No language radio buttons found after header load');
                return;
            }
            langRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    const lang = radio.value;
                    localStorage.setItem('language', lang);
                    applyLanguage(lang);
                    renderProduct();
                });
                if (radio.value === getCurrentLanguage()) {
                    radio.checked = true;
                }
            });
        });
    }

    function showMessage(message, isSuccess = false) {
        const messageElement = document.getElementById('error-message');
        if (!messageElement) {
            console.error('Message element not found');
            return;
        }

        messageElement.textContent = message;
        messageElement.className = isSuccess ? 'success-message' : 'error-message';
        messageElement.style.display = 'block';

        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }

    function formatDate(dateStr, lang) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateStr);
            return 'Invalid Date';
        }
        const pad = (num) => String(num).padStart(2, '0');
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    function validateForm() {
        const t = getCurrentTranslations();
        const titleEn = document.getElementById('title-en')?.value.trim();
        const titleRu = document.getElementById('title-ru')?.value.trim();
        const descriptionEn = document.getElementById('description-en')?.value.trim();
        const descriptionRu = document.getElementById('description-ru')?.value.trim();
        const type = document.getElementById('type-select')?.value;
        const price = parseFloat(document.getElementById('price')?.value);
        const imageUrl = document.getElementById('image-url')?.value.trim();

        if (!titleEn || !titleRu) {
            showMessage(t.product_page.messages.error.validation.title);
            return false;
        }
        if (!descriptionEn || !descriptionRu) {
            showMessage(t.product_page.messages.error.validation.description);
            return false;
        }
        if (!type) {
            showMessage(t.product_page.messages.error.validation.type);
            return false;
        }
        if (isNaN(price) || price <= 0) {
            showMessage(t.product_page.messages.error.validation.price);
            return false;
        }
        if (!imageUrl) {
            showMessage(t.product_page.messages.error.validation.image);
            return false;
        }
        if (!imageUrl.match(/^(https?:\/\/[^\s/$.?#].[^\s]*\.(png|jpg|jpeg|gif)$)|([A-Za-z]:\/[^<>:"|?*]+\.(png|jpg|jpeg|gif)$)|(\/[^<>:"|?*]+\.(png|jpg|jpeg|gif)$)|(\.\/[^<>:"|?*]+\.(png|jpg|jpeg|gif)$)/i)) {
            showMessage(t.product_page.messages.error.validation.image_invalid || 'Invalid image URL. Please provide a valid URL or path (png, jpg, jpeg, gif).');
            return false;
        }
        if (type !== 'book' && availableDates.length === 0) {
            showMessage(t.product_page.messages.error.validation.dates);
            return false;
        }
        if (new Set(availableDates).size !== availableDates.length) {
            showMessage(t.product_page.messages.error.validation.same_dates);
            return false;
        }
        return true;
    }

    function updateAvailableDates() {
        const datesList = document.getElementById('dates-list');
        if (!datesList) return;

        const dateInputs = datesList.querySelectorAll('input[type="datetime-local"]');
        availableDates = Array.from(dateInputs)
            .map(input => input.value)
            .filter(date => date); // Фильтруем пустые значения
    }

    function addDateField(date = '') {
        const t = getCurrentTranslations();
        const datesList = document.getElementById('dates-list');
        if (!datesList) return;

        const dateObj = date ? new Date(date) : new Date();
        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date in addDateField:', date);
            return;
        }

        const formattedDate = dateObj.toISOString().slice(0, 16);
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';
        dateItem.innerHTML = `
            <input type="datetime-local" value="${formattedDate}" required>
            <span class="date-display">${formatDate(formattedDate, getCurrentLanguage())}</span>
            <button type="button" class="delete-date" data-i18n="product_page.labels.delete_date">${t.product_page.labels.delete_date || 'Удалить дату'}</button>
        `;
        datesList.appendChild(dateItem);

        const deleteBtn = dateItem.querySelector('.delete-date');
        deleteBtn.addEventListener('click', () => {
            const dateValue = dateItem.querySelector('input').value;
            if (!dateValue) return;

            if (productId) {
                fetch(`http://localhost:3000/purchased?productId=${productId}`)
                    .then(response => response.json())
                    .then(purchasedItems => {
                        if (purchasedItems.some(item => item.selectedDate === dateValue)) {
                            showMessage(t.product_page.messages.error.validation.purchased_date);
                        } else {
                            dateItem.remove();
                            updateAvailableDates();
                        }
                    })
                    .catch(error => {
                        console.error('Error checking purchased items:', error);
                        showMessage(t.product_page.messages.error.load);
                    });
            } else {
                dateItem.remove();
                updateAvailableDates();
            }
        });

        const dateInput = dateItem.querySelector('input');
        dateInput.addEventListener('change', () => {
            const newDate = dateInput.value;
            if (newDate) {
                dateItem.querySelector('.date-display').textContent = formatDate(newDate, getCurrentLanguage());
                updateAvailableDates();
            }
        });

        updateAvailableDates();
    }

    function saveProduct(e) {
        e.preventDefault();
        if (!isAdmin()) {
            showMessage(getCurrentTranslations().product_page.messages.error.access_denied);
            return;
        }

        if (!validateForm()) return;

        const product = {
            title: {
                en: document.getElementById('title-en').value,
                ru: document.getElementById('title-ru').value
            },
            description: {
                en: document.getElementById('description-en').value,
                ru: document.getElementById('description-ru').value
            },
            type: {
                en: document.getElementById('type-select').value,
                ru: document.getElementById('type-select').selectedOptions[0].text
            },
            price: parseFloat(document.getElementById('price').value),
            image: document.getElementById('image-url').value,
            availability_dates: availableDates
        };

        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `http://localhost:3000/products/${productId}` : 'http://localhost:3000/products';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to save product');
                return response.json();
            })
            .then(() => {
                const t = getCurrentTranslations();
                showMessage(productId ? t.product_page.messages.success.save : t.product_page.messages.success.create, true);
            })
            .catch(error => {
                console.error('Error saving product:', error);
                showMessage(t.product_page.messages.error.save.replace('{error}', error.message));
            });
    }

    function addToCart() {
        if (!currentUser || currentUser.userName === 'guest') {
            window.location.href = '/log_in/log.html';
            return;
        }
        if (isAdmin()) {
            showMessage(getCurrentTranslations().product_page.messages.error.admin_cart_error || 'Admin cannot add products to cart.');
            return;
        }

        const selectedDate = document.getElementById('date-select')?.value;
        fetch(`http://localhost:3000/products/${productId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load product data');
                return response.json();
            })
            .then(product => {
                const cartItem = {
                    productId: parseInt(productId),
                    userName: currentUser.userName,
                    selectedDate: selectedDate || null,

                };

                return fetch('http://localhost:3000/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cartItem)
                });
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to add product to cart');
                waitForHeader(() => updateHeader(true));
                showMessage(getCurrentTranslations().product_page.messages.success.add_to_cart, true);
            })
            .catch(error => {
                console.error('Error adding to cart:', error);
                showMessage(getCurrentTranslations().product_page.messages.error.load);
            });
    }

    function updateDatesVisibility() {
        const typeSelect = document.getElementById('type-select');
        const datesContainer = document.querySelector('.field-container:has(#dates-list)');
        if (typeSelect && datesContainer) {
            const isBook = typeSelect.value === 'book';
            datesContainer.style.display = isBook ? 'none' : 'block';
            if (isBook) {
                availableDates = [];
                document.getElementById('dates-list').innerHTML = '';
            }
        }
    }

    function renderProduct() {
        const userView = document.getElementById('user-view');
        const adminView = document.getElementById('admin-view');
        const preloader = document.getElementById('preloader');

        if (!userView || !adminView) {
            console.error('View containers not found');
            showMessage('Failed to load view containers');
            preloader.style.display = 'none';
            return;
        }

        preloader.style.display = 'block';

        const t = getCurrentTranslations();
        const lang = getCurrentLanguage();

        if (isAdmin()) {
            console.log('Rendering admin view');
            userView.style.display = 'none';
            adminView.style.display = 'block';

            if (!productId) {
                document.getElementById('title-en').value = '';
                document.getElementById('title-ru').value = '';
                document.getElementById('description-en').value = '';
                document.getElementById('description-ru').value = '';
                document.getElementById('type-select').value = 'group_coaching';
                document.getElementById('price').value = '';
                document.getElementById('image-url').value = '';
                document.getElementById('dates-list').innerHTML = '';
                availableDates = [];
                document.getElementById('save-btn').setAttribute('data-i18n', 'product_page.labels.create');
                document.getElementById('save-btn').textContent = t.product_page.labels.create || 'Create Product';
                preloader.style.display = 'none';
                applyLanguage(lang);
            } else {
                fetch(`http://localhost:3000/products/${productId}`)
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to load product');
                        return response.json();
                    })
                    .then(product => {
                        console.log('Loaded product:', product);
                        document.getElementById('title-en').value = product.title.en || '';
                        document.getElementById('title-ru').value = product.title.ru || '';
                        document.getElementById('description-en').value = product.description.en || '';
                        document.getElementById('description-ru').value = product.description.ru || '';

                        const typeSelect = document.getElementById('type-select');
                        const productType = product.type?.en?.toLowerCase();
                        console.log('Product type.en:', productType);
                        if (productType && typeSelect.options) {
                            const validTypes = ['group_coaching', 'individual_coaching', 'consultation', 'book'];
                            if (validTypes.includes(productType)) {
                                typeSelect.value = productType;
                            } else {
                                console.warn('Invalid product type:', productType);
                                typeSelect.value = 'group_coaching';
                            }
                        } else {
                            typeSelect.value = 'group_coaching';
                        }

                        document.getElementById('price').value = product.price || '';
                        document.getElementById('image-url').value = product.image || '';
                        document.getElementById('dates-list').innerHTML = '';
                        availableDates = [];

                        if (product.availability_dates && Array.isArray(product.availability_dates)) {
                            console.log('Availability dates:', product.availability_dates);
                            product.availability_dates.forEach(date => {
                                if (date) {
                                    const dateObj = new Date(date);
                                    if (!isNaN(dateObj.getTime())) {
                                        addDateField(date);
                                    } else {
                                        console.warn('Skipping invalid date:', date);
                                    }
                                }
                            });
                        } else {
                            console.log('No valid availability dates found');
                        }

                        document.getElementById('save-btn').setAttribute('data-i18n', 'product_page.labels.save');
                        document.getElementById('save-btn').textContent = t.product_page.labels.save || 'Save';
                        updateDatesVisibility();
                        preloader.style.display = 'none';
                        applyLanguage(lang);
                    })
                    .catch(error => {
                        console.error('Error loading product:', error);
                        showMessage(t.product_page.messages.error.load);
                        preloader.style.display = 'none';
                    });
            }

            const typeSelect = document.getElementById('type-select');
            if (typeSelect) {
                console.log('Type select options:', Array.from(typeSelect.options).map(opt => ({
                    value: opt.value,
                    text: opt.textContent
                })));
                typeSelect.addEventListener('change', updateDatesVisibility);
                updateDatesVisibility();
            }
        } else {
            console.log('Rendering user view');
            adminView.style.display = 'none';
            userView.style.display = 'flex';

            if (!productId) {
                userView.innerHTML = `<p data-i18n="product_page.messages.error.load">${t.product_page.messages.error.load}</p>`;
                preloader.style.display = 'none';
                return;
            }

            fetch(`http://localhost:3000/products/${productId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load product');
                    return response.json();
                })
                .then(product => {
                    document.getElementById('product-title').textContent = product.title[lang] || product.title.en;
                    document.getElementById('product-type').textContent = t.product_page.labels.type + ': ' + (product.type[lang] || product.type.en);
                    document.getElementById('product-price').textContent = t.product_page.labels.price + ': $' + product.price;
                    document.getElementById('product-description').textContent = product.description[lang] || product.description.en;
                    document.getElementById('product-image').src = product.image || '/img/placeholder.png';
                    document.getElementById('product-image').alt = product.title[lang] || product.title.en;

                    const datesContainer = document.getElementById('product-dates');
                    const dateSelect = document.getElementById('date-select');
                    if (product.type.en === 'book') {
                        datesContainer.style.display = 'none';
                    } else {
                        datesContainer.style.display = 'block';
                        dateSelect.innerHTML = '';
                        if (product.availability_dates?.length) {
                            product.availability_dates.forEach(date => {
                                if (date) {
                                    const dateObj = new Date(date);
                                    if (!isNaN(dateObj.getTime())) {
                                        const option = document.createElement('option');
                                        option.value = date;
                                        option.textContent = formatDate(date, lang);
                                        dateSelect.appendChild(option);
                                    }
                                }
                            });
                        } else {
                            dateSelect.innerHTML = `<option value="" disabled>${t.product_page.labels.availability_dates}</option>`;
                        }
                    }

                    preloader.style.display = 'none';
                    applyLanguage(lang);
                })
                .catch(error => {
                    console.error('Error loading product:', error);
                    showMessage(t.product_page.messages.error.load);
                    preloader.style.display = 'none';
                });
        }
    }

    function setupEventListeners() {
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const adminForm = document.getElementById('admin-form');
        const addDateBtn = document.getElementById('add-date-btn');

        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }

        if (adminForm) {
            adminForm.addEventListener('submit', saveProduct);
        }

        if (addDateBtn) {
            addDateBtn.addEventListener('click', () => {
                const t = getCurrentTranslations();
                const newDate = new Date();
                newDate.setHours(13, 0);
                const formattedNewDate = newDate.toISOString().slice(0, 16);
                if (availableDates.includes(formattedNewDate)) {
                    showMessage(t.product_page.messages.error.validation.duplicate_date);
                    return;
                }
                addDateField(formattedNewDate);
            });
        }
    }

    checkUser();
    productId = getProductId();
    waitForHeader(() => {
        try {
            renderProduct();
            setupLanguageInputs();
            setupEventListeners();
            updateHeader(true);
        } catch (error) {
            console.error('Error initializing product page:', error);
            showMessage(getCurrentTranslations().product_page.messages.error.load);
            document.getElementById('preloader').style.display = 'none';
        }
    });
});