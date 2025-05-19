import commonPasswords from './common-passwords.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const birthdateInput = document.getElementById('birthdate');
    const passwordMethodRadios = document.getElementsByName('password-method');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const generatedPasswordInput = document.getElementById('generated-password');
    const regeneratePasswordBtn = document.getElementById('regenerate-password');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const middleNameInput = document.getElementById('middle-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');
    const usernameInput = document.getElementById('username');
    const regenerateUsernameBtn = document.getElementById('regenerate-username');
    const usernameAttemptsSpan = document.getElementById('username-attempts');
    const agreementCheckbox = document.getElementById('agreement');
    const agreementLink = document.querySelector('.agreement-link');
    const agreementModal = document.getElementById('agreement-modal');
    const closeModal = document.querySelector('.close');
    const agreementAcceptBtn = document.getElementById('agreement-accept');
    const registerBtn = document.getElementById('register-btn');

    let usernameAttempts = 5;

    const validatePhone = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.startsWith('375') && cleaned.length === 12;
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateBirthdate = (birthdate) => {
        const today = new Date();
        const birth = new Date(birthdate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        let adjustedAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            adjustedAge = age - 1;
        }
        return adjustedAge >= 16 && adjustedAge <= 120;
    };

    const validateName = (name) => /^[A-Za-zА-Яа-я]+$/.test(name);

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
        return regex.test(password) && !commonPasswords.includes(password);
    };

    const validateCardNumber = (number) => {
        const cleaned = number.replace(/\D/g, '');
        return /^\d{16}$/.test(cleaned);
    };

    const validateCardExpiry = (expiry) => {
        const regex = /^(0[1-9]|1[0-2])\/([2-9][0-9])$/;
        if (!regex.test(expiry)) return false;
        const [month, year] = expiry.split('/').map(Number);
        const today = new Date();
        const expiryDate = new Date(2000 + year, month - 1, 1);
        return expiryDate >= today;
    };

    const validateCardCvv = (cvv) => /^\d{3}$/.test(cvv);

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return validatePassword(password) ? password : generatePassword();
    };

    const generateUsername = () => {
        const adjectives = ['Epic', 'Savage', 'MemeLord', 'Pixel', 'Cosmic', 'Ninja', 'Wizard', 'Yeet'];
        const nouns = ['Panda', 'Doge', 'Cactus', 'Taco', 'Rocket', 'Lad', 'Vibe', 'Goblin'];
        const randomNum = Math.floor(Math.random() * 100);
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${randomNum}`;
    };

    const togglePasswordFields = () => {
        const method = document.querySelector('input[name="password-method"]:checked').value;
        if (method === 'manual') {
            document.getElementById('manual-password').style.display = 'block';
            document.getElementById('auto-password').style.display = 'none';
            passwordInput.required = true;
            confirmPasswordInput.required = true;
            generatedPasswordInput.required = false;
        } else {
            document.getElementById('manual-password').style.display = 'none';
            document.getElementById('auto-password').style.display = 'block';
            passwordInput.required = false;
            confirmPasswordInput.required = false;
            generatedPasswordInput.required = true;
            generatedPasswordInput.value = generatePassword();
        }
        validateForm();
    };

    const setError = (element, message) => {
        // Находим родительский form-group
        const formGroup = element.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = message;
        }
        element.classList.add('invalid');
    };

    const clearError = (element) => {
        // Находим родительский form-group
        const formGroup = element.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = '';
        }
        element.classList.remove('invalid');
    };

    const validateForm = () => {
        let isValid = true;

        if (!phoneInput.value) {
            setError(phoneInput, 'Phone number is required');
            isValid = false;
        } else if (!validatePhone(phoneInput.value)) {
            setError(phoneInput, 'Phone number must start with +375 and have 9 digits');
            isValid = false;
        } else {
            clearError(phoneInput);
        }

        if (!emailInput.value) {
            setError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            setError(emailInput, 'Enter a valid email address');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        if (!birthdateInput.value) {
            setError(birthdateInput, 'Date of birth is required');
            isValid = false;
        } else if (!validateBirthdate(birthdateInput.value)) {
            setError(birthdateInput, 'You must be between 16 and 120 years old');
            isValid = false;
        } else {
            clearError(birthdateInput);
        }

        const method = document.querySelector('input[name="password-method"]:checked').value;
        if (method === 'manual') {
            if (!passwordInput.value) {
                setError(passwordInput, 'Password is required');
                isValid = false;
            } else if (!validatePassword(passwordInput.value)) {
                setError(passwordInput, 'Password must be 8-20 characters, include uppercase, lowercase, number, special character, and not be common');
                isValid = false;
            } else {
                clearError(passwordInput);
            }

            if (!confirmPasswordInput.value) {
                setError(confirmPasswordInput, 'Confirm password is required');
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                setError(confirmPasswordInput, 'Passwords do not match');
                isValid = false;
            } else {
                clearError(confirmPasswordInput);
            }
        } else {
            if (!generatedPasswordInput.value) {
                setError(generatedPasswordInput, 'Generated password is required');
                isValid = false;
            } else {
                clearError(generatedPasswordInput);
            }
        }

        if (!firstNameInput.value) {
            setError(firstNameInput, 'First name is required');
            isValid = false;
        } else if (!validateName(firstNameInput.value)) {
            setError(firstNameInput, 'First name must contain only letters');
            isValid = false;
        } else {
            clearError(firstNameInput);
        }

        if (!lastNameInput.value) {
            setError(lastNameInput, 'Last name is required');
            isValid = false;
        } else if (!validateName(lastNameInput.value)) {
            setError(lastNameInput, 'Last name must contain only letters');
            isValid = false;
        } else {
            clearError(lastNameInput);
        }

        if (middleNameInput.value && !validateName(middleNameInput.value)) {
            setError(middleNameInput, 'Middle name must contain only letters');
            isValid = false;
        } else {
            clearError(middleNameInput);
        }

        if (!cardNumberInput.value) {
            setError(cardNumberInput, 'Card number is required');
            isValid = false;
        } else if (!validateCardNumber(cardNumberInput.value)) {
            setError(cardNumberInput, 'Enter a valid 16-digit card number');
            isValid = false;
        } else {
            clearError(cardNumberInput);
        }

        if (!cardExpiryInput.value) {
            setError(cardExpiryInput, 'Expiry date is required');
            isValid = false;
        } else if (!validateCardExpiry(cardExpiryInput.value)) {
            setError(cardExpiryInput, 'Enter a valid expiry date (MM/YY, not expired)');
            isValid = false;
        } else {
            clearError(cardExpiryInput);
        }

        if (!cardCvvInput.value) {
            setError(cardCvvInput, 'CVV is required');
            isValid = false;
        } else if (!validateCardCvv(cardCvvInput.value)) {
            setError(cardCvvInput, 'Enter a valid 3-digit CVV');
            isValid = false;
        } else {
            clearError(cardCvvInput);
        }

        if (!usernameInput.value) {
            setError(usernameInput, 'Username is required');
            isValid = false;
        } else {
            clearError(usernameInput);
        }

        if (!agreementCheckbox.checked) {
            setError(agreementCheckbox, 'You must agree to the User Agreement');
            isValid = false;
        } else {
            clearError(agreementCheckbox);
        }

        registerBtn.disabled = !isValid;
        return isValid;
    };

    usernameInput.value = generateUsername();

    passwordMethodRadios.forEach(radio => {
        radio.addEventListener('change', togglePasswordFields);
    });

    regeneratePasswordBtn.addEventListener('click', () => {
        generatedPasswordInput.value = generatePassword();
        validateForm();
    });

    regenerateUsernameBtn.addEventListener('click', () => {
        if (usernameAttempts > 0) {
            usernameInput.value = generateUsername();
            usernameAttempts--;
            usernameAttemptsSpan.textContent = `Attempts left: ${usernameAttempts}`;
            if (usernameAttempts === 0) {
                usernameInput.readOnly = false;
                regenerateUsernameBtn.disabled = true;
                usernameAttemptsSpan.textContent = 'Enter your username manually';
            }
            validateForm();
        }
    });

    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = value;
        validateForm();
    });

    cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 3) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
        validateForm();
    });

    cardCvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        validateForm();
    });

    agreementLink.addEventListener('click', (e) => {
        e.preventDefault();
        agreementModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        agreementModal.style.display = 'none';
    });

    agreementAcceptBtn.addEventListener('click', () => {
        agreementCheckbox.disabled = false;
        agreementCheckbox.checked = true;
        agreementAcceptBtn.disabled = true;
        agreementModal.style.display = 'none';
        validateForm();
    });

    [phoneInput, emailInput, birthdateInput, passwordInput, confirmPasswordInput, firstNameInput, lastNameInput, middleNameInput, cardNumberInput, cardExpiryInput, cardCvvInput, usernameInput, agreementCheckbox].forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('change', validateForm);
    });

    confirmPasswordInput.addEventListener('paste', (e) => {
        e.preventDefault();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const user = {
            name: usernameInput.value,
            password: passwordMethodRadios[0].checked ? passwordInput.value : generatedPasswordInput.value,
            phone: phoneInput.value,
            email: emailInput.value,
            birthdate: birthdateInput.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            middleName: middleNameInput.value || '',
            cardNumber: cardNumberInput.value,
            cardExpiry: cardExpiryInput.value,
            cardCvv: cardCvvInput.value,
            bestScore: '0'
        };

        try {
            const response = await fetch(`http://localhost:3000/users?name=${user.name}`);
            const users = await response.json();
            if (users.length > 0) {
                setError(usernameInput, 'Username already exists');
                return;
            }

            const postResponse = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (!postResponse.ok) throw new Error('Failed to register user');

            window.location.href = '/log_in/log.html';
        } catch (error) {
            console.error('Error registering user:', error);
            setError(form, 'Registration failed. Please try again.');
        }
    });

    togglePasswordFields();
});