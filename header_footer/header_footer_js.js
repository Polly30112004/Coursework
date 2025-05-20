let currentUser = null;

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        console.log('Текущий пользователь:', currentUser); 
        return true;
    }
    currentUser = null;
    return false;
}

function updateHeader(isLoggedIn) {
    const authLink = document.getElementById('auth-link');
    const profileLink = document.getElementById('profile-link');
    const cartIconWrapper = document.querySelector('.cart-icon-wrapper');
    
    if (authLink) {
        authLink.innerHTML = ''; 
        authLink.textContent = isLoggedIn ? 'Log Out' : 'Log In';
        authLink.href = isLoggedIn ? '#' : '/log_in/log.html';
        authLink.removeEventListener('click', handleLogout);
        if (isLoggedIn) {
            authLink.addEventListener('click', handleLogout);
        }
    }

    if (profileLink) {
        if (isLoggedIn) {
            profileLink.style.display = 'block';
            profileLink.href = '/profile/profile.html';
            profileLink.textContent = 'Profile';
        } else {
            profileLink.style.display = 'none';
        }
    }

    if (cartIconWrapper) {
        const badge = cartIconWrapper.querySelector('.cart-badge');
        if (isLoggedIn && currentUser && currentUser.userName) { // Используем userName
            fetch(`http://localhost:3000/cart?userName=${currentUser.userName}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при запросе корзины');
                    }
                    return response.json();
                })
                .then(cartItems => {
                    console.log('Товары в корзине для пользователя', currentUser.userName, ':', cartItems); // Для отладки
                    const cartCount = cartItems.length; 
                    badge.textContent = cartCount;
                    badge.setAttribute('data-count', cartCount);
                })
                .catch(error => {
                    console.error('Ошибка проверки корзины:', error);
                    badge.textContent = '0';
                    badge.setAttribute('data-count', '0');
                });
        } else {
            badge.textContent = '0';
            badge.setAttribute('data-count', '0');
        }
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateHeader(false);
    window.location.href = '/log_in/log.html';
}

function showNotification(message) {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">×</button>
        `;
        document.body.appendChild(notification);
    } else {
        notification.querySelector('span').textContent = message;
        notification.style.display = 'flex';
    }

    const closeButton = notification.querySelector('.close-notification');
    closeButton.addEventListener('click', () => {
        notification.style.display = 'none';
    });

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

fetch('/header_footer/header_footer.html')
    .then(response => response.text())
    .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        const headerContent = doc.querySelector('#header');
        if (headerContent) {
            document.getElementById('header').innerHTML = headerContent.outerHTML;
        }

        const footerContent = doc.querySelector('#footer');
        if (footerContent) {
            document.getElementById('footer').innerHTML = footerContent.outerHTML;
        }

        initBurgerMenu();
        initFooterSubscription();
        const isLoggedIn = checkAuth();
        updateHeader(isLoggedIn);
    })
    .catch(error => console.error('Ошибка загрузки хедера/футера:', error));

function initBurgerMenu() {
    const hamMenu = document.querySelector('.ham-menu');
    const header = document.querySelector('.header');
    const links = document.querySelectorAll('.links a');
    const buttonCart = document.querySelector('.button-cart');

    if (!hamMenu || !header || !buttonCart) {
        console.error('Required elements not found:', { hamMenu, header, buttonCart });
        return;
    }

    hamMenu.addEventListener('click', () => {
        hamMenu.classList.toggle('active');
        header.classList.toggle('active');

        if (window.innerWidth <= 768) {
            buttonCart.classList.toggle('active');
        } else {
            buttonCart.classList.remove('active');
        }
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            hamMenu.classList.remove('active');
            header.classList.remove('active');
            buttonCart.classList.remove('active');
        });
    });

    const shopLink = buttonCart.querySelector('.shop');
    if (shopLink) {
        shopLink.addEventListener('click', () => {
            window.location.href = '/catalog/catalog.html';
            hamMenu.classList.remove('active');
            header.classList.remove('active');
            buttonCart.classList.remove('active');
        });
    }

    buttonCart.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG' || e.target === buttonCart) {
            window.location.href = '/cart/cart.html';
            hamMenu.classList.remove('active');
            header.classList.remove('active');
            buttonCart.classList.remove('active');
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            buttonCart.classList.remove('active');
        } else if (header.classList.contains('active')) {
            buttonCart.classList.add('active');
        }
    });
}

function initFooterSubscription() {
    const subscribeButton = document.querySelector('.subscribe-form button');
    if (subscribeButton) {
        subscribeButton.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Subscription successful! You will receive updates soon.');
        });
    }
}