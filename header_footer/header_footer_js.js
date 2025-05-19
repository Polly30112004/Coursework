let currentUser = null;

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    console.log('Текущий пользователь:', user ? JSON.parse(user) : null); 
    if (user) {
        currentUser = JSON.parse(user);
        return true;
    }
    currentUser = null;
    return false;
}

// Обновление ссылки Log In/Log Out
function updateHeader(isLoggedIn) {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.innerHTML = ''; 
        authLink.textContent = isLoggedIn ? 'Log Out' : 'Log In';
        authLink.href = isLoggedIn ? '#' : '/log_in/log.html';
        authLink.removeEventListener('click', handleLogout);
        if (isLoggedIn) {
            authLink.addEventListener('click', handleLogout);
        }
    } else {
        console.error('Элемент с id="auth-link" не найден в DOM');
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateHeader(false);
    window.location.href = '/log_in/log.html';
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

        updateHeader(checkAuth());
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