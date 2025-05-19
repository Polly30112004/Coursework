document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let filteredProducts = [];
    let currentPage = 1;
    const itemsPerPage = 6;
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

    // Проверка авторизации при загрузке
    if (!checkAuth()) {
        window.location.href = '/log_in/log.html';
        return;
    }

    // Загрузка товаров с сервера
    fetch('http://localhost:3000/products')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Не удалось загрузить товары: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            products = data;
            filteredProducts = [...products];
            renderCatalog();
            setupEventListeners();
        })
        .catch(error => {
            console.error('Ошибка загрузки товаров:', error);
            const catalogCards = document.getElementById('catalog-cards');
            if (catalogCards) {
                catalogCards.innerHTML = '<p>Ошибка загрузки товаров. Попробуйте позже.</p>';
            }
        });

   function renderCatalog() {
    const catalogCards = document.getElementById('catalog-cards');
    if (!catalogCards) {
        console.error('Элемент с id="catalog-cards" не найден в DOM');
        return;
    }
    catalogCards.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (paginatedProducts.length === 0) {
        catalogCards.innerHTML = '<p>Товары не найдены.</p>';
        return;
    }

    paginatedProducts.forEach(product => {
        console.log('Формируем ссылку для товара:', `/products/product.html?id=${product.id}`);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <a href="/products/product.html?id=${product.id}">
                <img src="${product.image}" alt="${product.title}">
                <div class="card_text">
                    <h3>${product.title}</h3>
                    <span class="description">${product.description}</span>
                    <span class="price">$${product.price}</span>
                    <div class="add-to-cart" data-id="${product.id}">
                        <img src="/img/shopping_basket.png" alt="Add to Cart">
                    </div>
                </div>
            </a>
        `;
        catalogCards.appendChild(card);
    });

    renderPagination();
}

    function renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) {
            console.error('Элемент с id="pagination" не найден в DOM');
            return;
        }
        pagination.innerHTML = '';

        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCatalog();
            }
        });
        pagination.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === currentPage ? 'active' : '';
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderCatalog();
            });
            pagination.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCatalog();
            }
        });
        pagination.appendChild(nextButton);
    }

    function addToCart(productId) {
        if (!checkAuth()) {
            alert('Пожалуйста, войдите в аккаунт, чтобы добавить товар в корзину.');
            window.location.href = '/log_in/log.html';
            return;
        }

        const cartItem = {
            productId: parseInt(productId),
            userName: currentUser.userName,
            timestamp: new Date().toISOString()
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
            .then(data => {
                console.log('Товар добавлен в корзину:', data);
                alert(`Товар ${productId} добавлен в корзину для ${currentUser.userName}!`);
            })
            .catch(error => {
                console.error('Ошибка добавления в корзину:', error);
                alert('Ошибка при добавлении в корзину. Попробуйте снова.');
            });
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                filteredProducts = products.filter(product =>
                    product.title.toLowerCase().includes(query)
                );
                currentPage = 1;
                renderCatalog();
            });
        }

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                const type = typeFilter.value;
                filteredProducts = type === 'all'
                    ? [...products]
                    : products.filter(product => product.type === type);
                currentPage = 1;
                renderCatalog();
            });
        }

        const sortOptions = document.getElementById('sort-options');
        if (sortOptions) {
            sortOptions.addEventListener('change', () => {
                const sortBy = sortOptions.value;
                if (sortBy === 'price-asc') {
                    filteredProducts.sort((a, b) => a.price - b.price);
                } else if (sortBy === 'price-desc') {
                    filteredProducts.sort((a, b) => b.price - a.price);
                }
                currentPage = 1;
                renderCatalog();
            });
        }

        const catalogCards = document.getElementById('catalog-cards');
        if (catalogCards) {
            catalogCards.addEventListener('click', (e) => {
                const addToCartBtn = e.target.closest('.add-to-cart');
                if (addToCartBtn) {
                    const productId = addToCartBtn.dataset.id;
                    addToCart(productId);
                }
            });
        }
    }
});