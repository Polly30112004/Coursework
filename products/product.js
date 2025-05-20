
// Получение ID товара из URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {

    // Загрузка данных о товаре
    if (!productId) {
        displayError('ID товара не указан.');
        return;
    }

    console.log('Запрос данных для productId:', productId);
    fetch(`http://localhost:3000/products/${productId}`)
        .then(response => {
            console.log('Статус ответа:', response.status);
            if (!response.ok) {
                throw new Error(`Товар не найден: ${response.status}`);
            }
            return response.json();
        })
        .then(product => {
            console.log('Данные товара:', product);

            // Отображение данных о товаре
            document.getElementById('product-image').src = product.image;
            document.getElementById('product-title').textContent = product.title;

            // Type
            const typeElement = document.getElementById('product-type');
            if (product.type) {
                typeElement.textContent = `Type: ${product.type}`;
            } else {
                typeElement.style.display = 'none';
            }

            // Price
            const priceElement = document.getElementById('product-price');
            if (product.price) {
                priceElement.textContent = `Price: $${product.price}`;
            } else {
                priceElement.style.display = 'none';
            }

            // Description
            const descriptionElement = document.getElementById('product-description');
            if (product.description) {
                descriptionElement.textContent = `Description: ${product.description}`;
            } else {
                descriptionElement.style.display = 'none';
            }

            // Availability Dates
            const datesElement = document.getElementById('product-dates');
            if (product.availability_dates && product.availability_dates.length > 0) {
                const label = document.createElement('label');
                label.textContent = 'Available Dates: ';
                label.setAttribute('for', 'availability-dates-select');

                const select = document.createElement('select');
                select.id = 'availability-dates-select';
                product.availability_dates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    option.textContent = new Date(date).toLocaleString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    select.appendChild(option);
                });

                datesElement.appendChild(label);
                datesElement.appendChild(select);
            } else {
                datesElement.style.display = 'none';
            }

            // Добавление в корзину
            document.getElementById('add-to-cart-btn').addEventListener('click', () => {
                if (!checkAuth()) {
                    window.location.href = '/log_in/log.html';
                    return;
                }

                const selectedDate = product.availability_dates && product.availability_dates.length > 0
                    ? document.getElementById('availability-dates-select').value
                    : null;

                const cartItem = {
                    productId: parseInt(productId),
                    userName: currentUser.userName,
                    selectedDate: selectedDate,
                    productDetails: {
                        title: product.title,
                        type: product.type,
                        price: product.price,
                        description: product.description,
                        image: product.image
                    }
                };

                fetch('http://localhost:3000/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cartItem)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Не удалось добавить товар в корзину');
                        }
                        return response.json();
                    })
                    .then(() => {
                        updateCartBadge();
                    })
                    .catch(error => {
                        console.error('Ошибка добавления в корзину:', error);
                    });
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки товара:', error);
            displayError('Не удалось загрузить товар. Попробуйте позже.');
        });

    function displayError(message) {
        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            productInfo.innerHTML = `<p style="color: red;">${message}</p>`;
        }
    }

    function updateCartBadge() {
        if (!currentUser) return;
        fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить корзину');
                }
                return response.json();
            })
            .then(cartItems => {
                const cartCount = cartItems.length;
                const cartBadge = document.querySelector('.cart-badge');
                if (cartBadge) {
                    cartBadge.textContent = cartCount;
                    cartBadge.style.display = cartCount > 0 ? 'block' : 'none';
                } else {
                    console.warn('Элемент .cart-badge не найден в DOM');
                }
            })
            .catch(error => console.error('Ошибка загрузки корзины:', error));
    }
});