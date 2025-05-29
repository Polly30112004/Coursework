import { getTranslations, applyLanguage } from '/header_footer/language-switcher.js';
import { updateHeader } from '/header_footer/header_footer_js.js';

document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const payAllBtn = document.getElementById('pay-all-btn');
    let currentUser = null;

    const getCurrentTranslations = () => getTranslations(localStorage.getItem('language') || 'en');
    const getCurrentLanguage = () => localStorage.getItem('language') || 'en';

    // Проверка авторизации
    function checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }

    if (!checkAuth()) {
        window.location.href = '/log_in/log.html';
        return;
    }

    // Применение переводов к статическим элементам
    function applyStaticTranslations() {
        const t = getCurrentTranslations();
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = key.split('.').reduce((o, k) => (o && o[k] ? o[k] : null), t);
            if (translation) {
                el.textContent = translation;
            }
        });
        document.title = t.cart_page.title || 'Happy Coaching';
    }

    const loadCart = async () => {
        try {
            const t = getCurrentTranslations();
            const lang = getCurrentLanguage();

            // Загружаем корзину
            const cartResponse = await fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`);
            if (!cartResponse.ok) throw new Error(`Failed to load cart: ${cartResponse.status}`);
            const cartItems = await cartResponse.json();

            // Загружаем все товары
            const productsResponse = await fetch('http://localhost:3000/products');
            if (!productsResponse.ok) throw new Error(`Failed to load products: ${productsResponse.status}`);
            const products = await productsResponse.json();

            // Очищаем контейнер
            cartItemsContainer.innerHTML = '';

            let total = 0;
            const today = new Date();

            if (cartItems.length === 0) {
                cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.empty">${t.cart_page.messages.empty}</p>`;
                cartTotalSpan.textContent = '0';
                payAllBtn.disabled = true;
                return;
            }

            // Для каждого элемента корзины
            for (const cartItem of cartItems) {
                const product = products.find(p => p.id === cartItem.productId);
                if (!product) continue;

                total += product.price;

                // Проверяем, истёк ли срок
                const isExpired = cartItem.selectedDate && new Date(cartItem.selectedDate) < today;

                // Создаем элемент корзины
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.dataset.cartId = cartItem.id;
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h3>${product.title[lang] || product.title.en}</h3>
                        <p data-i18n="cart_page.labels.type">${t.cart_page.labels.type}: ${product.type[lang] || product.type.en}</p>
                        ${cartItem.selectedDate ? `
                            <div class="date-selector">
                                <label for="date-select-${cartItem.id}" data-i18n="cart_page.labels.date">${t.cart_page.labels.date}: </label>
                                <select id="date-select-${cartItem.id}" data-cart-id="${cartItem.id}">
                                    ${product.availability_dates.map(date => `
                                        <option value="${date}" ${date === cartItem.selectedDate ? 'selected' : ''}>
                                            ${new Date(date).toLocaleString(lang, {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        ` : ''}
                        <p data-i18n="cart_page.labels.price">${t.cart_page.labels.price}: $${product.price}</p>
                        ${isExpired ? `<p class="expired" data-i18n="cart_page.messages.expired">${t.cart_page.messages.expired}</p>` : ''}
                    </div>
                    <div class="cart-item-actions">
                        <button class="pay-btn" data-cart-id="${cartItem.id}" ${isExpired ? 'disabled' : ''} data-i18n="cart_page.labels.pay">${t.cart_page.labels.pay}</button>
                        <button class="delete-btn" data-cart-id="${cartItem.id}" title="${t.cart_page.labels.delete}">
                            <img src="/img/close.svg" alt="Delete">
                        </button>
                    </div>
                `;

                cartItemsContainer.appendChild(itemElement);
            }

            // Обновляем итоговую сумму
            cartTotalSpan.textContent = total.toFixed(2);
            payAllBtn.disabled = total === 0 || cartItems.some(item => {
                return item.selectedDate && new Date(item.selectedDate) < today;
            });
        } catch (error) {
            console.error('Error loading cart:', error);
            const t = getCurrentTranslations();
            cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.load">${t.cart_page.messages.error.load}</p>`;
        }
    };

    const deleteItem = async (cartId) => {
        try {
            const t = getCurrentTranslations();
            // Удаляем товар из корзины
            const response = await fetch(`http://localhost:3000/cart/${cartId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`Failed to delete item: ${response.status}`);

            // Перезагружаем корзину
            await loadCart();
            // Обновляем счетчик в хедере
            updateHeader(true);
        } catch (error) {
            console.error('Error deleting item:', error);
            const t = getCurrentTranslations();
            cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.delete">${t.cart_page.messages.error.delete}</p>`;
        }
    };

    const updateDate = async (cartId, newDate) => {
        try {
            const t = getCurrentTranslations();
            // Обновляем selectedDate
            const response = await fetch(`http://localhost:3000/cart/${cartId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selectedDate: newDate })
            });
            if (!response.ok) throw new Error(`Failed to update date: ${response.status}`);

            // Перезагружаем корзину
            await loadCart();
        } catch (error) {
            console.error('Error updating date:', error);
            const t = getCurrentTranslations();
            cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.update_date">${t.cart_page.messages.error.update_date}</p>`;
        }
    };

   const payItem = async (cartId) => {
    try {
        const t = getCurrentTranslations();
        const cartResponse = await fetch(`http://localhost:3000/cart/${cartId}`);
        if (!cartResponse.ok) {
            throw new Error(`Failed to load cart item: ${cartResponse.status}`);
        }
        const cartItem = await cartResponse.json();

        const today = new Date();
        if (cartItem.selectedDate && new Date(cartItem.selectedDate) < today) {
            cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.expired_item">${t.cart_page.messages.error.expired_item}</p>`;
            return;
        }

        if (!cartItem || !cartItem.productId || !cartItem.userName) {
            throw new Error('Invalid cart item data: missing productId or userName');
        }

        // Формируем минимальный объект без id
        const purchaseData = {
            productId: cartItem.productId,
            userName: cartItem.userName,
            selectedDate: cartItem.selectedDate
        };

        console.log('Sending to purchased:', { url: 'http://localhost:3000/purchased', purchaseData });

        const endpointCheck = await fetch('http://localhost:3000/purchased', { method: 'GET' });
        if (!endpointCheck.ok && endpointCheck.status === 404) {
            throw new Error('The /purchased endpoint does not exist. Add "purchased": [] to db.json.');
        }

        const purchasedResponse = await fetch('http://localhost:3000/purchased', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData)
        });

        if (!purchasedResponse.ok) {
            const errorText = await purchasedResponse.text(); // Получаем текст ошибки
            throw new Error(`Failed to add item to purchased: ${purchasedResponse.status} - ${errorText}`);
        }

        const deleteResponse = await fetch(`http://localhost:3000/cart/${cartId}`, {
            method: 'DELETE'
        });
        if (!deleteResponse.ok) {
            throw new Error(`Failed to delete item from cart: ${deleteResponse.status}`);
        }

        await loadCart();
        updateHeader(true);
        const successDiv = document.createElement('div');
        successDiv.style.color = 'var(--accent)';
        successDiv.style.marginTop = '10px';
        successDiv.textContent = t.cart_page.messages.success.pay;
        cartItemsContainer.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
        console.error('Error paying for item:', error);
        const t = getCurrentTranslations();
        cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.pay">${t.cart_page.messages.error.pay}: ${error.message}</p>`;
    }
};

const payAll = async () => {
    try {
        const t = getCurrentTranslations();
        const cartResponse = await fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`);
        if (!cartResponse.ok) {
            throw new Error(`Failed to load cart: ${cartResponse.status}`);
        }
        const cartItems = await cartResponse.json();

        const today = new Date();
        const hasExpired = cartItems.some(item => {
            return item.selectedDate && new Date(item.selectedDate) < today;
        });

        if (hasExpired) {
            cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.expired_items">${t.cart_page.messages.error.expired_items}</p>`;
            return;
        }

        const endpointCheck = await fetch('http://localhost:3000/purchased', { method: 'GET' });
        if (!endpointCheck.ok && endpointCheck.status === 404) {
            throw new Error('The /purchased endpoint does not exist. Add "purchased": [] to db.json.');
        }

        for (const item of cartItems) {
            if (!item || !item.productId || !item.userName) {
                throw new Error('Invalid cart item data: missing productId or userName');
            }

            // Формируем минимальный объект без id
            const purchaseData = {
                productId: item.productId,
                userName: item.userName,
                selectedDate: item.selectedDate
            };

            console.log('Sending to purchased:', { url: 'http://localhost:3000/purchased', purchaseData });

            const purchasedResponse = await fetch('http://localhost:3000/purchased', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData)
            });

            if (!purchasedResponse.ok) {
                const errorText = await purchasedResponse.text(); // Получаем текст ошибки
                throw new Error(`Failed to add item to purchased: ${purchasedResponse.status} - ${errorText}`);
            }

            const deleteResponse = await fetch(`http://localhost:3000/cart/${item.id}`, {
                method: 'DELETE'
            });
            if (!deleteResponse.ok) {
                throw new Error(`Failed to delete item from cart: ${deleteResponse.status}`);
            }
        }

        await loadCart();
        updateHeader(true);
        const successDiv = document.createElement('div');
        successDiv.style.color = 'var(--accent)';
        successDiv.style.marginTop = '10px';
        successDiv.textContent = t.cart_page.messages.success.pay_all;
        cartItemsContainer.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
        console.error('Error paying for all items:', error);
        const t = getCurrentTranslations();
        cartItemsContainer.innerHTML = `<p data-i18n="cart_page.messages.error.pay_all">${t.cart_page.messages.error.pay_all}: ${error.message}</p>`;
    }
};

    // Инициализация
    applyStaticTranslations();
    await loadCart();

    // Обработчики событий
    cartItemsContainer.addEventListener('click', (e) => {
        // Удаление товара
        if (e.target.closest('.delete-btn')) {
            const cartId = e.target.closest('.delete-btn').getAttribute('data-cart-id');
            deleteItem(cartId);
        }

        // Оплата товара
        if (e.target.classList.contains('pay-btn')) {
            const cartId = e.target.getAttribute('data-cart-id');
            payItem(cartId);
        }
    });

    // Обработчик изменения даты
    cartItemsContainer.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT' && e.target.id.startsWith('date-select-')) {
            const cartId = e.target.getAttribute('data-cart-id');
            const newDate = e.target.value;
            updateDate(cartId, newDate);
        }
    });

    // Обработчик кнопки "Pay for All"
    payAllBtn.addEventListener('click', payAll);

    // Обработчик смены языка
    document.addEventListener('languageChanged', () => {
        applyStaticTranslations();
        loadCart();
    });
});