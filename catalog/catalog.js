document.addEventListener('DOMContentLoaded', () => {
    let products = [];
    let filteredProducts = [];
    let currentPage = 1;
    const itemsPerPage = 6;
    let currentUser = null;
    let priceFilter = { min: null, max: null };

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
            applyFiltersAndSort();
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

    function applyFiltersAndSort() {
        const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';
        filteredProducts = products.filter(product =>
            product.title.toLowerCase().includes(searchQuery)
        );

        // Фильтрация по типу
        const typeFilter = document.getElementById('type-filter')?.value || 'all';
        if (typeFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.type === typeFilter);
        }

        // Фильтрация по цене
        if (priceFilter.min !== null) {
            filteredProducts = filteredProducts.filter(product => product.price >= priceFilter.min);
        }
        if (priceFilter.max !== null) {
            filteredProducts = filteredProducts.filter(product => product.price <= priceFilter.max);
        }

        // Сортировка
        const sortBy = document.getElementById('sort-options')?.value || 'price-asc';
        if (sortBy === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'date-desc') {
            filteredProducts.sort((a, b) => {
                const dateA = a.availability_dates ? new Date(a.availability_dates[0]) : new Date('9999-12-31');
                const dateB = b.availability_dates ? new Date(b.availability_dates[0]) : new Date('9999-12-31');
                return dateB - dateA;
            });
        } else if (sortBy === 'date-asc') {
            filteredProducts.sort((a, b) => {
                const dateA = a.availability_dates ? new Date(a.availability_dates[0]) : new Date('9999-12-31');
                const dateB = b.availability_dates ? new Date(b.availability_dates[0]) : new Date('9999-12-31');
                return dateA - dateB;
            });
        }
    }

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
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.id = product.id;
            card.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <div class="card_text">
                    <h3>${product.title}</h3>
                    <span class="description">${product.description}</span>
                    <span class="price">$${product.price}</span>
                    <div class="add-to-cart" data-id="${product.id}">
                        <img src="/img/shopping_basket.png" alt="Add to Cart">
                    </div>
                </div>
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
        if (totalPages <= 1) return;

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

        const maxVisiblePages = 3;
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.addEventListener('click', () => {
                currentPage = 1;
                renderCatalog();
            });
            pagination.appendChild(firstPageButton);

            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === currentPage ? 'active' : '';
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderCatalog();
            });
            pagination.appendChild(pageButton);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }

            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.addEventListener('click', () => {
                currentPage = totalPages;
                renderCatalog();
            });
            pagination.appendChild(lastPageButton);
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
            window.location.href = '/log_in/log.html';
            return;
        }

        fetch(`http://localhost:3000/products/${productId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось загрузить данные о товаре');
                }
                return response.json();
            })
            .then(product => {
                const selectedDate = product.availability_dates && product.availability_dates.length > 0
                    ? product.availability_dates[0]
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

                return fetch('http://localhost:3000/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cartItem)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось добавить товар в корзину');
                }
                return response.json();
            })
            .then(() => {
                updateHeader(true);
            })
            .catch(error => {
                console.error('Ошибка добавления в корзину:', error);
            });
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                applyFiltersAndSort();
                renderCatalog();
            });
        }

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
                renderCatalog();
            });
        }

        const sortOptions = document.getElementById('sort-options');
        if (sortOptions) {
            sortOptions.addEventListener('change', () => {
                currentPage = 1;
                applyFiltersAndSort();
                renderCatalog();
            });
        }

        const catalogCards = document.getElementById('catalog-cards');
        if (catalogCards) {
            catalogCards.addEventListener('click', (e) => {
                const addToCartBtn = e.target.closest('.add-to-cart');
                const card = e.target.closest('.card');

                if (addToCartBtn) {
                    e.preventDefault();
                    const productId = addToCartBtn.dataset.id;
                    addToCart(productId);
                } else if (card) {
                    const productId = card.dataset.id;
                    window.location.href = `/products/product.html?id=${productId}`;
                }
            });
        }

        const applyPriceFilterBtn = document.getElementById('apply-price-filter');
        const resetPriceFilterBtn = document.getElementById('reset-price-filter');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');

        if (applyPriceFilterBtn && resetPriceFilterBtn) {
            applyPriceFilterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
                const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;

                if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
                    alert('Minimum price cannot be greater than maximum price');
                    return;
                }

                priceFilter.min = minPrice;
                priceFilter.max = maxPrice;
                currentPage = 1;
                applyFiltersAndSort();
                renderCatalog();
            });

            resetPriceFilterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                minPriceInput.value = '';
                maxPriceInput.value = '';
                priceFilter.min = null;
                priceFilter.max = null;
                currentPage = 1;
                applyFiltersAndSort();
                renderCatalog();
            });
        }
    }
});