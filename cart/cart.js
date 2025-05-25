document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const payAllBtn = document.getElementById('pay-all-btn');
    let currentUser = null;

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

    const loadCart = async () => {
        try {
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
                cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
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
                        <h3>${product.title}</h3>
                        <p>Type: ${product.type}</p>
                        ${cartItem.selectedDate ? `
                            <div class="date-selector">
                                <label for="date-select-${cartItem.id}">Date: </label>
                                <select id="date-select-${cartItem.id}" data-cart-id="${cartItem.id}">
                                    ${product.availability_dates.map(date => `
                                        <option value="${date}" ${date === cartItem.selectedDate ? 'selected' : ''}>
                                            ${new Date(date).toLocaleString('en-US', {
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
                        <p>Price: $${product.price}</p>
                        ${isExpired ? '<p class="expired">Expired</p>' : ''}
                    </div>
                    <div class="cart-item-actions">
                        <button class="pay-btn" data-cart-id="${cartItem.id}" ${isExpired ? 'disabled' : ''}>Pay</button>
                        <button class="delete-btn" data-cart-id="${cartItem.id}">
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
            cartItemsContainer.innerHTML = '<p>Failed to load cart. Please check the server and try again.</p>';
        }
    };

    const deleteItem = async (cartId) => {
        try {
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
            cartItemsContainer.innerHTML = '<p>Failed to delete item. Please try again.</p>';
        }
    };

    const updateDate = async (cartId, newDate) => {
        try {
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
            cartItemsContainer.innerHTML = '<p>Failed to update date. Please try again.</p>';
        }
    };

    const payItem = async (cartId) => {
        try {
            // Загружаем товар из корзины
            const cartResponse = await fetch(`http://localhost:3000/cart/${cartId}`);
            if (!cartResponse.ok) {
                throw new Error(`Failed to load cart item: ${cartResponse.status}`);
            }
            const cartItem = await cartResponse.json();

            // Проверяем, истёк ли срок
            const today = new Date();
            if (cartItem.selectedDate && new Date(cartItem.selectedDate) < today) {
                cartItemsContainer.innerHTML = '<p>Cannot pay for expired item.</p>';
                return;
            }

            // Проверяем, что cartItem не пустой
            if (!cartItem || !cartItem.productId || !cartItem.userName) {
                throw new Error('Invalid cart item data');
            }

            // Логируем данные и URL
            console.log('Sending to purchased:', {
                url: 'http://localhost:3000/purchased',
                cartItem
            });

            // Проверяем доступность endpoint’а
            const endpointCheck = await fetch('http://localhost:3000/purchased', { method: 'GET' });
            if (!endpointCheck.ok && endpointCheck.status === 404) {
                throw new Error('The /purchased endpoint does not exist on the server. Check db.json for the "purchased" collection.');
            }

            // Отправляем товар в purchased
            const purchasedResponse = await fetch('http://localhost:3000/purchased', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cartItem)
            });

            if (!purchasedResponse.ok) {
                throw new Error(`Failed to add item to purchased: ${purchasedResponse.status}`);
            }

            // Удаляем товар из корзины
            const deleteResponse = await fetch(`http://localhost:3000/cart/${cartId}`, {
                method: 'DELETE'
            });
            if (!deleteResponse.ok) {
                throw new Error(`Failed to delete item from cart: ${deleteResponse.status}`);
            }

            // Перезагружаем корзину
            await loadCart();
            // Обновляем счетчик в хедере
            updateHeader(true);
        } catch (error) {
            console.error('Error paying for item:', error);
            cartItemsContainer.innerHTML = `<p>Failed to pay for item: ${error.message}. Please ensure the /purchased endpoint exists in your server configuration (db.json).</p>`;
        }
    };

    const payAll = async () => {
        try {
            // Загружаем корзину
            const cartResponse = await fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`);
            if (!cartResponse.ok) {
                throw new Error(`Failed to load cart: ${cartResponse.status}`);
            }
            const cartItems = await cartResponse.json();

            // Проверяем наличие просроченных товаров
            const today = new Date();
            const hasExpired = cartItems.some(item => {
                return item.selectedDate && new Date(item.selectedDate) < today;
            });

            if (hasExpired) {
                cartItemsContainer.innerHTML = '<p>Cannot pay because some items are expired.</p>';
                return;
            }

            // Проверяем доступность endpoint’а
            const endpointCheck = await fetch('http://localhost:3000/purchased', { method: 'GET' });
            if (!endpointCheck.ok && endpointCheck.status === 404) {
                throw new Error('The /purchased endpoint does not exist on the server. Check db.json for the "purchased" collection.');
            }

            // Отправляем все товары в purchased и удаляем из корзины
            for (const item of cartItems) {
                // Проверяем, что item не пустой
                if (!item || !item.productId || !item.userName) {
                    throw new Error('Invalid cart item data');
                }

                // Логируем данные и URL
                console.log('Sending to purchased:', {
                    url: 'http://localhost:3000/purchased',
                    item
                });

                // Отправляем товар в purchased
                const purchasedResponse = await fetch('http://localhost:3000/purchased', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item)
                });

                if (!purchasedResponse.ok) {
                    throw new Error(`Failed to add item to purchased: ${purchasedResponse.status}`);
                }

                // Удаляем товар из корзины
                const deleteResponse = await fetch(`http://localhost:3000/cart/${item.id}`, {
                    method: 'DELETE'
                });
                if (!deleteResponse.ok) {
                    throw new Error(`Failed to delete item from cart: ${deleteResponse.status}`);
                }
            }

            // Перезагружаем корзину
            await loadCart();
            // Обновляем счетчик в хедере
            updateHeader(true);
        } catch (error) {
            console.error('Error paying for all items:', error);
            cartItemsContainer.innerHTML = `<p>Failed to pay for all items: ${error.message}. Please ensure the /purchased endpoint exists in your server configuration (db.json).</p>`;
        }
    };

    // Загружаем корзину при загрузке страницы
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
});