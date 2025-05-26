// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Initialize editing state
let isEditing = false;
const userLocale = localStorage.getItem('language') || 'en';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and set isAdmin based on userName
    function checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            currentUser = JSON.parse(user);
            if (!currentUser.hasOwnProperty('isAdmin')) {
                currentUser.isAdmin = /admin/i.test(currentUser.userName);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            return true;
        }
        return false;
    }

    // Redirect to login if not authenticated
    if (!checkAuth()) {
        window.location.href = '/log_in/log.html';
        return;
    }

    // Load product data or initialize new product
    let product;
    if (productId) {
        // Edit mode
        console.log('Fetching data for productId:', productId);
        try {
            const response = await fetch(`http://localhost:3000/products/${productId}`);
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Product not found: ${response.status}`);
            }
            product = await response.json();
            console.log('Product data:', product);
            // Ensure availability_dates is an array
            product.availability_dates = Array.isArray(product.availability_dates) ? product.availability_dates : [];
        } catch (error) {
            console.error('Error loading product:', error);
            displayError('Failed to load product. Please try again.');
            return;
        }
    } else if (currentUser.isAdmin) {
        // Create mode
        const now = new Date();
        now.setMinutes(0, 0, 0); // Round to next hour
        now.setHours(now.getHours() + 1);
        product = {
            title: '',
            type: '',
            price: '',
            description: '',
            image: '',
            availability_dates: ['group coaching', 'individual coaching', 'consultation'].includes('') ? [now.toISOString()] : []
        };
        console.log('Entering create mode with empty product');
    } else {
        displayError('Access denied: Admins only.');
        return;
    }

    if (currentUser.isAdmin) {
        enterEditMode(product, !productId); // isNewProduct = true if no productId
    } else {
        displayProduct(product);
        addUserControls(product);
    }

    // Display product data (for non-admins)
    function displayProduct(product) {
        let titleElement = document.getElementById('product-title');
        if (!titleElement) {
            titleElement = document.createElement('h1');
            titleElement.id = 'product-title';
            document.querySelector('.product-info').prepend(titleElement);
        }
        titleElement.textContent = product.title || 'No title';

        let imageElement = document.getElementById('product-image');
        if (!imageElement) {
            imageElement = document.createElement('img');
            imageElement.id = 'product-image';
            imageElement.alt = 'Product Image';
            document.getElementById('product-image-container').appendChild(imageElement);
        }
        imageElement.src = product.image || '/img/placeholder.jpg';
        imageElement.alt = product.title || 'Product image';

        let typeElement = document.getElementById('product-type');
        if (!typeElement) {
            typeElement = document.createElement('div');
            typeElement.id = 'product-type';
            document.querySelector('.product-info').appendChild(typeElement);
        }
        if (product.type) {
            typeElement.textContent = `Type: ${product.type}`;
            typeElement.className = 'info-item';
            typeElement.style.display = 'block';
        } else {
            typeElement.style.display = 'none';
        }

        let priceElement = document.getElementById('product-price');
        if (!priceElement) {
            priceElement = document.createElement('p');
            priceElement.id = 'product-price';
            document.querySelector('.product-info').appendChild(priceElement);
        }
        if (product.price) {
            priceElement.textContent = `Price: $${product.price}`;
            priceElement.className = 'info-item price';
            priceElement.style.display = 'block';
        } else {
            priceElement.style.display = 'none';
        }

        let descriptionElement = document.getElementById('product-description');
        if (!descriptionElement) {
            descriptionElement = document.createElement('p');
            descriptionElement.id = 'product-description';
            document.querySelector('.product-info').appendChild(descriptionElement);
        }
        if (product.description) {
            descriptionElement.textContent = `Description: ${product.description}`;
            descriptionElement.className = 'info-item description';
            descriptionElement.style.display = 'block';
        } else {
            descriptionElement.style.display = 'none';
        }

        let datesElement = document.getElementById('product-dates');
        if (!datesElement) {
            datesElement = document.createElement('div');
            datesElement.id = 'product-dates';
            document.querySelector('.product-info').appendChild(datesElement);
        }
        datesElement.innerHTML = '';
        datesElement.className = 'info-item dates';
        if (product.availability_dates.length > 0 && product.type !== 'book') {
            const label = document.createElement('label');
            label.textContent = 'Available dates: ';
            label.setAttribute('for', 'availability-dates-select');

            const select = document.createElement('select');
            select.id = 'availability-dates-select';
            product.availability_dates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
               option.textContent = new Date(date).toLocaleString(userLocale, {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: false
                });
                select.appendChild(option);
            });

            datesElement.appendChild(label);
            datesElement.appendChild(select);
            datesElement.style.display = 'block';
        } else {
            datesElement.style.display = 'none';
        }

        let actionButtons = document.getElementById('action-buttons');
        if (!actionButtons) {
            actionButtons = document.createElement('div');
            actionButtons.id = 'action-buttons';
            document.querySelector('.product-info').appendChild(actionButtons);
        }
    }

    // Add user controls (Add to Cart button)
    function addUserControls(product) {
        const actionButtons = document.getElementById('action-buttons');
        if (!actionButtons) {
            console.error('Action buttons container not found.');
            return;
        }
        actionButtons.innerHTML = '';
        const addToCartBtn = document.createElement('button');
        addToCartBtn.id = 'add-to-cart-btn';
        addToCartBtn.className = 'add-to-cart';
        addToCartBtn.innerHTML = '<img src="/img/shopping_basket.png" alt="Cart icon"> Add to Cart';
        actionButtons.appendChild(addToCartBtn);

        addToCartBtn.addEventListener('click', async () => {
            if (!checkAuth()) {
                window.location.href = '/log_in/log.html';
                return;
            }

            const selectedDate = product.availability_dates.length > 0 && product.type !== 'book'
                ? document.getElementById('availability-dates-select')?.value || null
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

            console.log('Adding to cart:', cartItem);

            try {
                const response = await fetch('http://localhost:3000/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cartItem)
                });

                if (!response.ok) {
                    throw new Error(`Failed to add to cart: ${response.status}`);
                }

                await updateCartBadge();
                displaySuccess('Product successfully added to cart.');
            } catch (error) {
                console.error('Error adding to cart:', error);
                displayError('Failed to add product to cart. Please try again.');
            }
        });
    }

    // Enter edit mode for admins (edit or create)
    function enterEditMode(product, isNewProduct = false) {
        isEditing = true;

        const imageContainer = document.getElementById('product-image-container');
        // Clear existing image or placeholder
        imageContainer.innerHTML = '';

        if (isNewProduct) {
            // Create mode: Grey placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            imageContainer.appendChild(placeholder);
        } else {
            // Edit mode: Image
            let imageElement = document.createElement('img');
            imageElement.id = 'product-image';
            imageElement.alt = 'Product Image';
            imageElement.src = product.image || '/img/placeholder.jpg';
            imageContainer.appendChild(imageElement);
        }

        // Title
        let titleElement = document.getElementById('product-title');
        const titleContainer = document.createElement('div');
        titleContainer.className = 'field-container';
        const titleLabel = document.createElement('label');
        titleLabel.textContent = 'Title';
        titleLabel.setAttribute('for', 'title-input');
        const titleInput = document.createElement('input');
        titleInput.id = 'title-input';
        titleInput.className = 'edit-field';
        titleInput.value = product.title || '';
        titleContainer.appendChild(titleLabel);
        titleContainer.appendChild(titleInput);
        titleElement.replaceWith(titleContainer);

        // Type (select)
        let typeElement = document.getElementById('product-type');
        const typeContainer = document.createElement('div');
        typeContainer.className = 'field-container';
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Type';
        typeLabel.setAttribute('for', 'type-select');
        const typeSelect = document.createElement('select');
        typeSelect.id = 'type-select';
        typeSelect.className = 'type-select';
        const types = ['group coaching', 'individual coaching', 'consultation', 'book'];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            if (type === product.type) option.selected = true;
            typeSelect.appendChild(option);
        });
        typeContainer.appendChild(typeLabel);
        typeContainer.appendChild(typeSelect);
        typeElement.replaceWith(typeContainer);

        // Price
        let priceElement = document.getElementById('product-price');
        const priceContainer = document.createElement('div');
        priceContainer.className = 'field-container';
        const priceLabel = document.createElement('label');
        priceLabel.textContent = 'Price ($)';
        priceLabel.setAttribute('for', 'price-input');
        const priceInput = document.createElement('input');
        priceInput.id = 'price-input';
        priceInput.className = 'edit-field';
        priceInput.type = 'number';
        priceInput.min = '0.01';
        priceInput.step = '0.01';
        priceInput.value = product.price || '';
        priceContainer.appendChild(priceLabel);
        priceContainer.appendChild(priceInput);
        priceElement.replaceWith(priceContainer);

        // Description
        let descriptionElement = document.getElementById('product-description');
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'field-container';
        const descriptionLabel = document.createElement('label');
        descriptionLabel.textContent = 'Description';
        descriptionLabel.setAttribute('for', 'description-textarea');
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.id = 'description-textarea';
        descriptionTextarea.className = 'edit-field textarea';
        descriptionTextarea.value = product.description || '';
        descriptionContainer.appendChild(descriptionLabel);
        descriptionContainer.appendChild(descriptionTextarea);
        descriptionElement.replaceWith(descriptionContainer);

        // Image upload
        let imageUploadDiv = document.querySelector('.image-upload');
        if (imageUploadDiv) imageUploadDiv.remove();
        imageUploadDiv = document.createElement('div');
        imageUploadDiv.className = 'image-upload';
        const imageLabel = document.createElement('label');
        imageLabel.textContent = 'Image';
        imageLabel.className = 'image-upload-label';
        imageLabel.setAttribute('for', 'image-input');
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/jpeg,image/png';
        imageInput.id = 'image-input';
        imageInput.style.display = 'none';
        imageUploadDiv.appendChild(imageLabel);
        imageUploadDiv.appendChild(imageInput);
        imageContainer.appendChild(imageUploadDiv);

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('Selected file:', file.name, file.type, file.size);
                const previewImg = document.createElement('img');
                previewImg.id = 'product-image';
                previewImg.alt = 'Product Image Preview';
                previewImg.src = URL.createObjectURL(file);
                const placeholder = imageContainer.querySelector('.image-placeholder');
                if (placeholder) placeholder.remove();
                const existingImg = imageContainer.querySelector('#product-image');
                if (existingImg) existingImg.remove();
                imageContainer.insertBefore(previewImg, imageUploadDiv);
            }
        });

        // Availability Dates
        let datesElement = document.getElementById('product-dates');
        datesElement.innerHTML = '';
        const datesContainer = document.createElement('div');
        datesContainer.id = 'dates-container';
        const datesLabel = document.createElement('label');
        datesLabel.textContent = 'Availability Dates';
        const datesList = document.createElement('div');
        datesList.className = 'dates-list';
        datesContainer.appendChild(datesLabel);
        datesContainer.appendChild(datesList);

        if (product.type !== 'book') {
            product.availability_dates.forEach(date => {
                const dateItem = createDateItem(date);
                datesList.appendChild(dateItem);
            });

            const addDateBtn = document.createElement('button');
            addDateBtn.className = 'add-date-btn';
            addDateBtn.textContent = 'Add new date';
            addDateBtn.addEventListener('click', () => {
                const datesList = document.querySelector('.dates-list');
                const allDates = Array.from(datesList.querySelectorAll('input[type="datetime-local"]'))
                    .map(input => input.value)
                    .filter(val => val)
                    .map(val => new Date(val).getTime());

                let newDate;
                if (allDates.length === 0) {
                    newDate = new Date();
                    newDate.setMinutes(0, 0, 0);
                    newDate.setHours(newDate.getHours() + 1);
                } else {
                    const lastDate = new Date(Math.max(...allDates));
                    newDate = new Date(lastDate.getTime() + 60 * 60 * 1000);
                }

                let attempts = 0;
                const maxAttempts = 10;
                while (allDates.includes(newDate.getTime()) && attempts < maxAttempts) {
                    newDate = new Date(newDate.getTime() + 60 * 60 * 1000);
                    attempts++;
                }

                if (attempts >= maxAttempts) {
                    displayError('Cannot add new date: too many similar dates.');
                    return;
                }

                const dateItem = createDateItem(newDate.toISOString());
                datesList.appendChild(dateItem);
            });
            datesContainer.appendChild(addDateBtn);
        }

        datesElement.appendChild(datesContainer);

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'book') {
                datesContainer.style.display = 'none';
                datesList.innerHTML = '';
            } else {
                if (datesList.children.length === 0) {
                    const now = new Date();
                    now.setMinutes(0, 0, 0);
                    now.setHours(now.getHours() + 1);
                    const dateItem = createDateItem(now.toISOString());
                    datesList.appendChild(dateItem);
                }
                datesContainer.style.display = 'block';
            }
        });

        if (product.type === 'book') {
            datesContainer.style.display = 'none';
        } else {
            datesContainer.style.display = 'block';
        }

        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.innerHTML = '';
            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-btn';
            saveBtn.textContent = isNewProduct ? 'Create Product' : 'Save';
            actionButtons.appendChild(saveBtn);

            saveBtn.addEventListener('click', () => saveChanges(product, titleInput, typeSelect, priceInput, descriptionTextarea, imageInput, datesList, isNewProduct));
        } else {
            console.error('Action buttons container not found in edit mode.');
        }
    }

    // Create date item for editing
function createDateItem(date) {
    const dateItem = document.createElement('div');
    dateItem.className = 'date-item';
    const dateInput = document.createElement('input');
    dateInput.type = 'datetime-local';
    dateInput.value = new Date(date).toISOString().slice(0, 16);
    dateInput.lang = userLocale;
    dateInput.title = new Date(date).toLocaleString(userLocale, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    dateInput.addEventListener('change', () => {
        const datesList = document.querySelector('.dates-list');
        const dateInputs = Array.from(datesList.querySelectorAll('input[type="datetime-local"]'));
        const allDates = dateInputs
            .map(input => ({ value: input.value, element: input }))
            .filter(({ value, element }) => value && element !== dateInput)
            .map(({ value }) => value);
        console.log('datesList:', datesList, 'allDates:', allDates);
        if (allDates.includes(dateInput.value)) {
            displayError('This date is already added! Please choose another.');
            dateInput.value = '';
        }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        if (productId) {
            checkDateDeletion(date).then(canDelete => {
                if (canDelete) {
                    dateItem.remove();
                } else {
                    displayError('Cannot delete this date as it is linked to a purchased product.');
                }
            });
        } else {
            dateItem.remove();
        }
    });
    dateItem.appendChild(dateInput);
    dateItem.appendChild(deleteBtn);
    return dateItem;
}
    // Check if date can be deleted
    async function checkDateDeletion(date) {
        try {
            const response = await fetch(`http://localhost:3000/purchased?productId=${productId}&selectedDate=${date}`);
            if (!response.ok) {
                throw new Error(`Failed to check purchased items: ${response.status}`);
            }
            const purchasedItems = await response.json();
            return purchasedItems.length === 0;
        } catch (error) {
            console.error('Error checking purchased items:', error);
            return false;
        }
    }

    // Validate fields
    function validateFields(title, type, price, description, imageFile, imagePath, dates, isBook) {
        if (!title.trim()) return 'Title cannot be empty.';
        if (!type) return 'Type must be selected.';
        if (!description.trim()) return 'Description cannot be empty.';
        if (isNaN(price) || price <= 0) return 'Price must be greater than 0.';
        if (!imageFile && !imagePath) return 'An image must be provided.';
        if (!isBook && dates.length === 0) return 'At least one availability date is required for non-book products.';
        return null;
    }

    // Convert file to Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file as Base64'));
            reader.readAsDataURL(file);
        });
    }

    // Save changes
    async function saveChanges(product, titleInput, typeSelect, priceInput, descriptionTextarea, imageInput, datesList, isNewProduct) {
        try {
            const dates = typeSelect.value === 'book' ? [] : Array.from(datesList.querySelectorAll('input[type="datetime-local"]'))
                .map(input => input.value)
                .filter(val => val);

            const uniqueDates = new Set(dates);
            if (uniqueDates.size < dates.length) {
                displayError('Dates cannot be the same!');
                return;
            }

            const updatedProduct = {
                title: titleInput.value,
                type: typeSelect.value,
                price: parseFloat(priceInput.value),
                description: descriptionTextarea.value,
                availability_dates: typeSelect.value === 'book' ? [] : Array.from(uniqueDates).map(date => new Date(date).toISOString())
            };

            // Validate fields
            const validationError = validateFields(
                updatedProduct.title,
                updatedProduct.type,
                updatedProduct.price,
                updatedProduct.description,
                imageInput.files[0],
                isNewProduct ? null : product.image,
                updatedProduct.availability_dates,
                updatedProduct.type === 'book'
            );
            if (validationError) {
                displayError(validationError);
                return;
            }

            // Handle image upload
            if (imageInput.files[0]) {
                const file = imageInput.files[0];
                console.log('Uploading file:', file.name, file.type, file.size);

                // Convert to Base64
                const base64 = await fileToBase64(file);
                console.log('Base64 length:', base64.length);

                const response = await fetch('http://localhost:3000/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        base64,
                        filename: file.name
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to upload image: ${errorData.error || response.status}`);
                }

                const result = await response.json();
                if (!result.path) {
                    throw new Error('No path returned from upload');
                }
                updatedProduct.image = result.path;
                console.log('Image uploaded:', result.path);
            } else if (!isNewProduct) {
                updatedProduct.image = product.image;
            }

            console.log('Saving product:', updatedProduct);

            let response;
            if (isNewProduct) {
                // Create new product
                response = await fetch('http://localhost:3000/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedProduct)
                });
            } else {
                // Update existing product
                response = await fetch(`http://localhost:3000/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedProduct)
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to save product: ${response.status}`);
            }

            const savedProduct = await response.json();
            isEditing = false;
            if (isNewProduct) {
                // Redirect to the new product's page
                window.location.href = `/catalog/catalog.html`;
            } else {
                const productInfo = document.querySelector('.product-info');
                productInfo.innerHTML = `
                    <h1 id="product-title"></h1>
                    <div id="product-type" class="info-item"></div>
                    <p id="product-price" class="info-item price"></p>
                    <p id="product-description" class="info-item description"></p>
                    <div id="product-dates" class="info-item dates"></div>
                    <div id="action-buttons"></div>
                `;
                enterEditMode(updatedProduct);
                displaySuccess('Product successfully updated.');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            displayError(`Failed to save product: ${error.message}`);
        }
    }

    // Display error message
    function displayError(message) {
        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.textContent = message;
            productInfo.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 3000);
        }
    }

    // Display success message
    function displaySuccess(message) {
        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            const successDiv = document.createElement('div');
            successDiv.style.color = '#20AD96';
            successDiv.textContent = message;
            productInfo.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 3000);
        }
    }

    // Update cart badge
    async function updateCartBadge() {
        if (!currentUser || currentUser.isAdmin) return;
        try {
            const response = await fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`);
            if (!response.ok) {
                throw new Error(`Failed to load cart: ${response.status}`);
            }
            const cartItems = await response.json();
            const cartCount = cartItems.length;
            const cartBadge = document.querySelector('.cart-badge');
            if (cartBadge) {
                cartBadge.textContent = cartCount;
                cartBadge.style.display = cartCount > 0 ? 'block' : 'none';
            } else {
                console.warn('Cart badge element not found in DOM.');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    await updateCartBadge();

    function setupLanguageSelector() {
    const langRadios = document.querySelectorAll('input[name="language"]');
    const updateLanguage = (lang) => {
        const langCode = lang === 'rus' ? 'ru' : 'en';
        localStorage.setItem('language', langCode);
        window.location.reload(); 
    };

    langRadios.forEach(radio => {
        radio.addEventListener('change', (e) => updateLanguage(e.target.value));
    });

    const defaultLang = localStorage.getItem('language') || 'en';
    localStorage.setItem('language', defaultLang);
}

setupLanguageSelector();
});