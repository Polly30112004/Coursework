import { getTranslations } from '/header_footer/language-switcher.js';
import { updateHeader } from '/header_footer/header_footer_js.js';



document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const itemsPerPage = 6;
    let currentUser = null;
    let priceFilter = { min: null, max: null };
    let pendingDeleteProductId = null;

    const getCurrentTranslations = () => getTranslations(localStorage.getItem('language') || 'en');
    const getCurrentLanguage = () => localStorage.getItem('language') || 'en';

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

    if (isAdmin()) {
        fetch(`http://localhost:3000/cart?userName=null`)
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

    function loadFilters() {
        const savedFilters = localStorage.getItem('catalogFilters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                currentPage = filters.currentPage || 1;
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
                localStorage.removeItem('catalogFilters');
                priceFilter = { min: null, max: null };
            }
        }
    }

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
    const t = getCurrentTranslations();
    const lang = getCurrentLanguage();
    const searchQuery = document.getElementById('search-input')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    const sortBy = document.getElementById('sort-options')?.value || 'price-asc';

    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.append('type.en', typeFilter);
    if (priceFilter.min !== null) params.append('price_gte', priceFilter.min);
    if (priceFilter.max !== null) params.append('price_lte', priceFilter.max);
    if (searchQuery) params.append('q', searchQuery); 

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

    fetch(`http://localhost:3000/products?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return response.json();
        })
        .then(products => {
            const countParams = new URLSearchParams(params);
            countParams.delete('_page');
            countParams.delete('_limit');
            return fetch(`http://localhost:3000/products?${countParams.toString()}`)
                .then(countResponse => {
                    if (!countResponse.ok) throw new Error(`HTTP error: ${countResponse.status}`);
                    return countResponse.json();
                })
                .then(countData => {
                    const totalPages = Math.ceil(countData.length / itemsPerPage);
                    return { products, totalPages };
                });
        })
        .then(({ products, totalPages }) => {
            renderCatalog(products, totalPages);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showModal('catalog_page.modal.error');
        });
}

function renderPagination(totalPages) {
    const t = getCurrentTranslations();
    const pagination = document.getElementById('pagination');
    if (!pagination) {
        console.error('Element with id="pagination" not found');
        return;
    }
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = t.catalog_page.pagination.previous;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            saveFilters();
            fetchProducts();
        }
    });
    pagination.appendChild(prevButton);

    // Показываем все страницы, если их мало, или ограниченный диапазон
    let startPage = 1;
    let endPage = totalPages;

    // Ограничиваем максимум 3 видимых страницы для простоты
    const maxVisiblePages = 3;
    if (totalPages > maxVisiblePages) {
        if (currentPage <= 2) {
            endPage = maxVisiblePages;
        } else if (currentPage >= totalPages - 1) {
            startPage = totalPages - maxVisiblePages + 1;
        } else {
            startPage = currentPage - 1;
            endPage = currentPage + 1;
        }
    }

    if (startPage > 1) {
        const ellipsisStart = document.createElement('span');
        ellipsisStart.className = 'ellipsis';
        ellipsisStart.textContent = '...';
        pagination.appendChild(ellipsisStart);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i > totalPages) break; // Предотвращаем лишние кнопки
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
        const ellipsisEnd = document.createElement('span');
        ellipsisEnd.className = 'ellipsis';
        ellipsisEnd.textContent = '...';
        pagination.appendChild(ellipsisEnd);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = t.catalog_page.pagination.next;
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

    loadFilters();
    fetchProducts();
    setupEventListeners();

    function renderCatalog(products, totalPages) {
        const t = getCurrentTranslations();
        const lang = getCurrentLanguage();
        const catalogCards = document.getElementById('catalog-cards');
        if (!catalogCards) {
            console.error('Element with id="catalog-cards" not found in DOM');
            showModal('catalog_page.modal.error');
            return;
        }
        catalogCards.innerHTML = '';

        if (!products || products.length === 0) {
            catalogCards.innerHTML = `<p data-i18n="catalog_page.modal.no_products">${t.catalog_page.modal.no_products}</p>`;
            return;
        }

        products.forEach(product => {
            const translatedTitle = product.title[lang] || product.title.en;
            const translatedDescription = product.description[lang] || product.description.en;
            const translatedType = product.type[lang] || product.type.en;

            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.id = product.id;
            card.innerHTML = `
                <div class="card-image">
                    <img src="${product.image}" alt="${translatedTitle}">
                </div>
                <div class="card_text">
                    <h3>${translatedTitle}</h3>
                    <span class="description">${translatedDescription}</span>
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
        console.warn('Admin cannot add products to cart.');
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
            updateHeader(true); // Обновляем хедер (корзину)
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            // Не показываем модальное окно
        });
}

function deleteProduct(productId) {
    if (!isAdmin()) {
        showModal('catalog_page.modal.admin_only_error');
        return;
    }

    // Проверяем, есть ли продукт в purchased и его тип
    Promise.all([
        fetch(`http://localhost:3000/purchased?productId=${productId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load purchased items');
                return response.json();
            }),
        fetch(`http://localhost:3000/products/${productId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load product');
                return response.json();
            })
    ])
        .then(([purchasedItems, product]) => {
            const isBook = product.type.en.toLowerCase() === 'book';
            if (!isBook && purchasedItems.length > 0) {
                showModal('catalog_page.modal.delete_purchased_error');
                return;
            }
            // Если продукт можно удалить, показываем подтверждение
            showModal('catalog_page.modal.delete_confirm', true, productId);
        })
        .catch(error => {
            console.error('Error checking product for deletion:', error);
            showModal('catalog_page.modal.delete_error');
        });
}

function confirmDelete() {
    if (!pendingDeleteProductId) return;

    fetch(`http://localhost:3000/cart?productId=${pendingDeleteProductId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load cart');
            return response.json();
        })
        .then(cartItems => {
            const deleteCartPromises = cartItems.map(item =>
                fetch(`http://localhost:3000/cart/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            return Promise.all(deleteCartPromises);
        })
        .then(() => {
            return fetch(`http://localhost:3000/purchased?productId=${pendingDeleteProductId}`);
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load purchased items');
            return response.json();
        })
        .then(purchasedItems => {
            const deletePurchasedPromises = purchasedItems.map(item =>
                fetch(`http://localhost:3000/purchased/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            return Promise.all(deletePurchasedPromises);
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
            showModal('catalog_page.modal.delete_error');
        });
}

function showModal(messageKey, isConfirm = false, productId = null) {
    const t = getCurrentTranslations();
    const modal = document.getElementById('delete-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmButton = document.getElementById('modal-confirm');
    const cancelButton = document.getElementById('modal-cancel');

    if (!modal || !modalMessage || !cancelButton) {
        console.error('Modal elements not found');
        return;
    }

    let message = messageKey;
    try {
        const keys = messageKey.split('.');
        let translation = t;
        for (const key of keys) {
            translation = translation[key];
            if (!translation) throw new Error('Translation not found');
        }
        message = translation;
    } catch (e) {
        console.warn(`Translation not found for key: ${messageKey}`, e);
        const fallbackTranslations = {
            'catalog_page.modal.error': 'Failed to load products. Please check your server connection.',
            'catalog_page.modal.no_products': 'No products found.',
            'catalog_page.modal.admin_cart_error': 'Admin cannot add products to cart.',
            'catalog_page.modal.admin_only_error': 'Only admin can perform this action.',
            'catalog_page.modal.add_to_cart_error': 'Failed to add product to cart. Please try again.',
            'catalog_page.modal.delete_confirm': 'Are you sure you want to delete this product?',
            'catalog_page.modal.delete_error': 'Failed to delete product. Please try again.',
            'catalog_page.modal.delete_purchased_error': 'Cannot delete this product because it has been purchased.',
            'catalog_page.controls.price_filter.error': 'Minimum price cannot be greater than maximum price.'
        };
        message = fallbackTranslations[messageKey] || messageKey;
    }

    modalMessage.textContent = message;
    confirmButton.style.display = isConfirm ? 'block' : 'none';
    cancelButton.textContent = isConfirm ? t.catalog_page.modal.cancel || 'Cancel' : t.catalog_page.modal.close || 'Close';
    pendingDeleteProductId = isConfirm ? productId : null;

    modal.style.display = 'flex';
}

    function setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const typeFilter = document.getElementById('type-filter');
        const sortOptions = document.getElementById('sort-options');
        const applyPriceFilter = document.getElementById('apply-price-filter');
        const resetPriceFilter = document.getElementById('reset-price-filter');
        const catalogCards = document.getElementById('catalog-cards');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');
        const modalClose = document.querySelector('.modal-close');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        if (sortOptions) {
            sortOptions.addEventListener('change', () => {
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        if (applyPriceFilter) {
            applyPriceFilter.addEventListener('click', () => {
                const minPrice = parseFloat(document.getElementById('min-price').value) || null;
                const maxPrice = parseFloat(document.getElementById('max-price').value) || null;

                if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
                    const t = getCurrentTranslations();
                    showModal('catalog_page.controls.price_filter.error');
                    return;
                }

                priceFilter.min = minPrice;
                priceFilter.max = maxPrice;
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        if (resetPriceFilter) {
            resetPriceFilter.addEventListener('click', () => {
                document.getElementById('min-price').value = '';
                document.getElementById('max-price').value = '';
                priceFilter = { min: null, max: null };
                currentPage = 1;
                saveFilters();
                fetchProducts();
            });
        }

        if (catalogCards) {
        catalogCards.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('.add-to-cart');
            const deleteBtn = e.target.closest('.delete-product');
            const card = e.target.closest('.card');

            if (addToCartBtn) {
                const productId = addToCartBtn.dataset.id;
                addToCart(productId);
            } else if (deleteBtn) {
                const productId = deleteBtn.dataset.id;
                deleteProduct(productId);
            } else if (card) {
                // Открываем страницу товара, если клик не по корзине/удалению
                const productId = card.dataset.id;
                window.location.href = `/products/product.html?id=${productId}`;
            }
        });
    }

        if (modalConfirm) {
            modalConfirm.addEventListener('click', confirmDelete);
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', closeModal);
        }

        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        // Слушатель для смены языка
        document.addEventListener('languageChanged', () => {
            fetchProducts();
        });
    }
});