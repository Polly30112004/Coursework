document.addEventListener('DOMContentLoaded', () => {
    initCommentsSwiper();
});


document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('name');
    const passwordInput = document.getElementById('password');
    let errorMessage = document.getElementById('error-message');

    nameInput.style.borderColor = '';
    passwordInput.style.borderColor = '';
    if (errorMessage) {
        errorMessage.textContent = '';
    }

    const name = nameInput.value.trim();
    const password = passwordInput.value;

    try {
        const response = await fetch(`http://localhost:3000/users?name=${name}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const users = await response.json();

        if (users.length > 0 && users[0].password === password) {
            localStorage.setItem('currentUser', JSON.stringify({
                userName: users[0].name,
                bestScore: users[0].bestScore
            }));

            window.location.href = '/catalog/catalog.html';
        } else {
            nameInput.style.borderColor = 'red';
            passwordInput.style.borderColor = 'red';

            if (!errorMessage) {
                errorMessage = document.createElement('div');
                errorMessage.id = 'error-message';
                errorMessage.style.color = 'red';
                errorMessage.style.marginTop = '10px';
                document.getElementById('loginForm').appendChild(errorMessage);
            }
            errorMessage.textContent = 'Invalid username or password';
        }
    } catch (error) {
        console.error('Error during login:', error.message, error.stack);

        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'error-message';
            errorMessage.style.color = 'red';
            errorMessage.style.marginTop = '10px';
            document.getElementById('loginForm').appendChild(errorMessage);
        }
        errorMessage.textContent = 'An error occurred. Please try again.';
    }
});