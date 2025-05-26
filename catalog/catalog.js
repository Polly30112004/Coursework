document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const itemsPerPage = 6;
    let currentUser = null;
    let priceFilter = { min: null, max: null };
    let pendingDeleteProductId = null;

    function checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }

    function isAdmin() {
        return currentUser && currentUser.userName === 'Admin';
    }

    if (!checkAuth()) {
        window.location.href = '/log_in/log.html';
        return;
    }

    // Clear admin's cart on login
    if (isAdmin()) {
        fetch(`http://localhost:3000/cart?userName=Admin`)
            .then(response => response.json())
            .then(cartItems => {
                const deletePromises = cartItems.map(item =>
                    fetch(`http://localhost:3000/cart/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
                return Promise.all(deletePromises);
            })
            .then(() => {
                updateHeader(true);
            })
            .catch(error => console.error('Error clearing admin cart:', error));

        const adminAdd = document.getElementById('admin-add');
        if (adminAdd) {
            adminAdd.style.display = 'block';
            const addButton = document.getElementById('add-product-btn');
            if (addButton) {
                addButton.addEventListener('click', () => {
                    window.location.href = '/products/product.html';
                });
            }
        }
    }

    // Load saved filters from localStorage
   // Исправленная функция loadFilters
function loadFilters() {
    const savedFilters = localStorage.getItem('catalogFilters');
    if (savedFilters) {
        try {
            const filters = JSON.parse(savedFilters);
            currentPage = filters.currentPage || 1;
            
            // Безопасное получение priceFilter
            priceFilter = {
                min: (filters.priceFilter && filters.priceFilter.min !== undefined) ? filters.priceFilter.min : null,
                max: (filters.priceFilter && filters.priceFilter.max !== undefined) ? filters.priceFilter.max : null
            };

            const searchInput = document.getElementById('search-input');
            const typeFilter = document.getElementById('type-filter');
            const sortOptions = document.getElementById('sort-options');
            const minPriceInput = document.getElementById('min-price');
            const maxPriceInput = document.getElementById('max-price');

            if (searchInput && filters.searchQuery !== undefined) {
                searchInput.value = filters.searchQuery;
            }
            if (typeFilter && filters.typeFilter) {
                typeFilter.value = filters.typeFilter;
            }
            if (sortOptions && filters.sortBy) {
                sortOptions.value = filters.sortBy;
            }
            if (minPriceInput && priceFilter.min !== null) {
                minPriceInput.value = priceFilter.min;
            }
            if (maxPriceInput && priceFilter.max !== null) {
                maxPriceInput.value = priceFilter.max;
            }
        } catch (e) {
            console.error('Error parsing saved filters:', e);
            // В случае ошибки сбросим фильтры
            localStorage.removeItem('catalogFilters');
            priceFilter = { min: null, max: null };
        }
    }
}

    // Save filters to localStorage
    function saveFilters() {
        const filters = {
            searchQuery: document.getElementById('search-input')?.value || '',
            typeFilter: document.getElementById('type-filter')?.value || 'all',
            sortBy: document.getElementById('sort-options')?.value || 'price-asc',
            priceFilter: {
                min: priceFilter.min,
                max: priceFilter.max
            },
            currentPage: currentPage
        };
        localStorage.setItem('catalogFilters', JSON.stringify(filters));
    }

    function fetchProducts() {
        const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('type-filter')?.value || 'all';
        const sortBy = document.getElementById('sort-options')?.value || 'price-asc';

        const params = new URLSearchParams();
        if (searchQuery) params.append('title_like', searchQuery);
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (priceFilter.min !== null) params.append('price_gte', priceFilter.min);
        if (priceFilter.max !== null) params.append('price_lte', priceFilter.max);

        if (sortBy === 'price-asc') {
            params.append('_sort', 'price');
            params.append('_order', 'asc');
        } else if (sortBy === 'price-desc') {
            params.append('_sort', 'price');
            params.append('_order', 'desc');
        } else if (sortBy === 'date-asc') {
            params.append('_sort', 'availability_dates');
            params.append('_order', 'asc');
        } else if (sortBy === 'date-desc') {
            params.append('_sort', 'availability_dates');
            params.append('_order', 'desc');
        }

        params.append('_page', currentPage);
        params.append('_limit', itemsPerPage);

        console.log('Fetching products with params:', params.toString());

        fetch(`http://localhost:3000/products?${params.toString()}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
                return response.json();
            })
            .then(products => {
                console.log('Received products:', products);
                const countParams = new URLSearchParams(params);
                countParams.delete('_page');
                countParams.delete('_limit');
                return fetch(`http://localhost:3000/products?${countParams.toString()}`)
                    .then(countResponse => {
                        if (!countResponse.ok) throw new Error(`HTTP error: ${countResponse.status}`);
                        return countResponse.json();
                    })
                    .then(countData => ({ products, totalItems: countData.length }));
            })
            .then(({ products, totalItems }) => {
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                console.log('Total items:', totalItems, 'Total pages:', totalPages);
                renderCatalog(products, totalPages);
            })
            .catch(error => {
                console.error('Error loading products:', error);
                showModal('Failed to load products. Please check your server connection.');
            });
    }

    // Load filters and fetch products
    loadFilters();
    fetchProducts();
    setupEventListeners();

    function renderCatalog(products, totalPages) {
        const catalogCards = document.getElementById('catalog-cards');
        if (!catalogCards) {
            console.error('Element with id="catalog-cards" not found in DOM');
            showModal('Failed to display catalog.');
            return;
        }
        catalogCards.innerHTML = '';

        console.log('Products to render:', products);

        if (!products || products.length === 0) {
            console.log('No products to display');
            catalogCards.innerHTML = '<p>No products found.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.id = product.id;
            card.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <div class="card_text">
                    <h3>${product.title}</h3>
                    <span class="description">${product.description}</span>
                    <span class="price">$${product.price}</span>
                    ${
                        isAdmin()
                            ? `<div class="delete-product" data-id="${product.id}">
                                 <img src="/img/close.svg" alt="Delete Product">
                               </div>`
                            : `<div class="add-to-cart" data-id="${product.id}">
                                 <img src="/img/shopping_basket.png" alt="Add to Cart">
                               </div>`
                    }
                </div>
            `;
            catalogCards.appendChild(card);
        });

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) {
            console.error('Element with id="pagination" not found in DOM');
            return;
        }
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                saveFilters();
                fetchProducts();
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
                saveFilters();
                fetchProducts();
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
                saveFilters();
                fetchProducts();
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
                saveFilters();
                fetchProducts();
            });
            pagination.appendChild(lastPageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                saveFilters();
                fetchProducts();
            }
        });
        pagination.appendChild(nextButton);
    }

    function showModal(message, isConfirm = false, productId = null) {
        const modal = document.getElementById('delete-modal');
        const modalMessage = document.getElementById('modal-message');
        const confirmButton = document.getElementById('modal-confirm');
        const cancelButton = document.getElementById('modal-cancel');

        if (!modal || !modalMessage || !cancelButton) {
            console.error('Modal elements not found');
            return;
        }

        modalMessage.textContent = message;
        confirmButton.style.display = isConfirm ? 'block' : 'none';
        cancelButton.textContent = isConfirm ? 'Cancel' : 'Close';
        pendingDeleteProductId = isConfirm ? productId : null;

        modal.style.display = 'flex';
    }

    function closeModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'none';
            pendingDeleteProductId = null;
        }
    }

    function addToCart(productId) {
        if (!checkAuth()) {
            window.location.href = '/log_in/log.html';
            return;
        }
        if (isAdmin()) {
            showModal('Admin cannot add products to cart.');
            return;
        }

        fetch(`http://localhost:3000/products/${productId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load product data');
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cartItem)
                });
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to add product to cart');
                return response.json();
            })
            .then(() => {
                updateHeader(true);
            })
            .catch(error => {
                console.error('Error adding to cart:', error);
                showModal('Failed to add product to cart. Please try again.');
            });
    }

    function deleteProduct(productId) {
        if (!isAdmin()) {
            showModal('Only admin can delete products.');
            return;
        }
        showModal('Are you sure you want to delete this product?', true, productId);
    }

    function confirmDelete() {
        if (!pendingDeleteProductId) return;

        fetch(`http://localhost:3000/cart?productId=${pendingDeleteProductId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load cart');
                return response.json();
            })
            .then(cartItems => {
                const deletePromises = cartItems.map(item =>
                    fetch(`http://localhost:3000/cart/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' }
                    })
                );
                return Promise.all(deletePromises);
            })
            .then(() => {
                return fetch(`http://localhost:3000/products/${pendingDeleteProductId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
            })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete product');
                closeModal();
                fetchProducts();
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                closeModal();
                showModal('Failed to delete product. Please try again.');
            });
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        const sortOptions = document.getElementById('sort-options');
        if (sortOptions) {
            sortOptions.addEventListener('change', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        const catalogCards = document.getElementById('catalog-cards');
        if (catalogCards) {
            catalogCards.addEventListener('click', (e) => {
                const addToCartBtn = e.target.closest('.add-to-cart');
                const deleteProductBtn = e.target.closest('.delete-product');
                const card = e.target.closest('.card');

                if (addToCartBtn && !isAdmin()) {
                    e.preventDefault();
                    const productId = addToCartBtn.dataset.id;
                    addToCart(productId);
                } else if (deleteProductBtn) {
                    e.preventDefault();
                    const productId = deleteProductBtn.dataset.id;
                    deleteProduct(productId);
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
                    showModal('Minimum price cannot be greater than maximum price.');
                    return;
                }

                priceFilter.min = minPrice;
                priceFilter.max = maxPrice;
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });

            resetPriceFilterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                minPriceInput.value = '';
                maxPriceInput.value = '';
                priceFilter.min = null;
                priceFilter.max = null;
                saveFilters();
                fetchProducts();
            });
        }

        const modalClose = document.querySelector('.modal-close');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (modalConfirm) modalConfirm.addEventListener('click', confirmDelete);
        if (modalCancel) modalCancel.addEventListener('click', closeModal);
    }
});