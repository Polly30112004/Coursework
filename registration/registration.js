import commonPasswords from './common-passwords.js';
import { getTranslations } from '/header_footer/language-switcher.js';

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

    const getCurrentTranslations = () => getTranslations(localStorage.getItem('language') || 'en');

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

    const setError = (element, messageKey) => {
        const t = getCurrentTranslations();
        const formGroup = element.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-message');
        if (errorSpan) {
            const keys = messageKey.split('.');
            let message = t;
            keys.forEach(key => message = message?.[key]);
            errorSpan.textContent = message || 'Error';
        }
        element.classList.add('invalid');
    };

    const clearError = (element) => {
        const formGroup = element.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = '';
        }
        element.classList.remove('invalid');
    };

    const updateUsernameAttempts = () => {
        const t = getCurrentTranslations();
        if (usernameAttempts > 0) {
            usernameAttemptsSpan.textContent = t.register_page.form.username.attempts.replace('{count}', usernameAttempts);
        } else {
            usernameAttemptsSpan.textContent = t.register_page.form.username.manual;
        }
    };

    const validateForm = () => {
        let isValid = true;

        if (!phoneInput.value) {
            setError(phoneInput, 'register_page.form.phone.required');
            isValid = false;
        } else if (!validatePhone(phoneInput.value)) {
            setError(phoneInput, 'register_page.form.phone.invalid');
            isValid = false;
        } else {
            clearError(phoneInput);
        }

        if (!emailInput.value) {
            setError(emailInput, 'register_page.form.email.required');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            setError(emailInput, 'register_page.form.email.invalid');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        if (!birthdateInput.value) {
            setError(birthdateInput, 'register_page.form.birthdate.required');
            isValid = false;
        } else if (!validateBirthdate(birthdateInput.value)) {
            setError(birthdateInput, 'register_page.form.birthdate.invalid');
            isValid = false;
        } else {
            clearError(birthdateInput);
        }

        const method = document.querySelector('input[name="password-method"]:checked').value;
        if (method === 'manual') {
            if (!passwordInput.value) {
                setError(passwordInput, 'register_page.form.password.required');
                isValid = false;
            } else if (!validatePassword(passwordInput.value)) {
                setError(passwordInput, 'register_page.form.password.invalid');
                isValid = false;
            } else {
                clearError(passwordInput);
            }

            if (!confirmPasswordInput.value) {
                setError(confirmPasswordInput, 'register_page.form.password.confirm_required');
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                setError(confirmPasswordInput, 'register_page.form.password.mismatch');
                isValid = false;
            } else {
                clearError(confirmPasswordInput);
            }
        } else {
            if (!generatedPasswordInput.value) {
                setError(generatedPasswordInput, 'register_page.form.generated_password.required');
                isValid = false;
            } else {
                clearError(generatedPasswordInput);
            }
        }

        if (!firstNameInput.value) {
            setError(firstNameInput, 'register_page.form.first_name.required');
            isValid = false;
        } else if (!validateName(firstNameInput.value)) {
            setError(firstNameInput, 'register_page.form.first_name.invalid');
            isValid = false;
        } else {
            clearError(firstNameInput);
        }

        if (!lastNameInput.value) {
            setError(lastNameInput, 'register_page.form.last_name.required');
            isValid = false;
        } else if (!validateName(lastNameInput.value)) {
            setError(lastNameInput, 'register_page.form.last_name.invalid');
            isValid = false;
        } else {
            clearError(lastNameInput);
        }

        if (middleNameInput.value && !validateName(middleNameInput.value)) {
            setError(middleNameInput, 'register_page.form.middle_name.invalid');
            isValid = false;
        } else {
            clearError(middleNameInput);
        }

        if (!cardNumberInput.value) {
            setError(cardNumberInput, 'register_page.form.card_number.required');
            isValid = false;
        } else if (!validateCardNumber(cardNumberInput.value)) {
            setError(cardNumberInput, 'register_page.form.card_number.invalid');
            isValid = false;
        } else {
            clearError(cardNumberInput);
        }

        if (!cardExpiryInput.value) {
            setError(cardExpiryInput, 'register_page.form.card_expiry.required');
            isValid = false;
        } else if (!validateCardExpiry(cardExpiryInput.value)) {
            setError(cardExpiryInput, 'register_page.form.card_expiry.invalid');
            isValid = false;
        } else {
            clearError(cardExpiryInput);
        }

        if (!cardCvvInput.value) {
            setError(cardCvvInput, 'register_page.form.card_cvv.required');
            isValid = false;
        } else if (!validateCardCvv(cardCvvInput.value)) {
            setError(cardCvvInput, 'register_page.form.card_cvv.invalid');
            isValid = false;
        } else {
            clearError(cardCvvInput);
        }

        if (!usernameInput.value) {
            setError(usernameInput, 'register_page.form.username.required');
            isValid = false;
        } else {
            clearError(usernameInput);
        }

        if (!agreementCheckbox.checked) {
            setError(agreementCheckbox, 'register_page.form.agreement.required');
            isValid = false;
        } else {
            clearError(agreementCheckbox);
        }

        registerBtn.disabled = !isValid;
        return isValid;
    };

    usernameInput.value = generateUsername();
    updateUsernameAttempts();

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
            updateUsernameAttempts();
            if (usernameAttempts === 0) {
                usernameInput.readOnly = false;
                regenerateUsernameBtn.disabled = true;
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
        agreementModal.style.display = '';
    });

    agreementAcceptBtn.addEventListener('click', () => {
        agreementCheckbox.disabled = false;
        agreementCheckbox.checked = true;
        agreementAcceptBtn.disabled = true;
        agreementModal.style.display = '';
        validateForm();
    });

    [phoneInput, emailInput, birthdateInput, passwordInput, confirmPasswordInput, firstNameInput, lastNameInput, middleNameInput, cardNumberInput, cardExpiryInput, cardCvvInput, usernameInput, agreementCheckbox].forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('change', validateForm);
    });

    confirmPasswordInput.addEventListener('input', (e) => {
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
            cardNumber: cardNumberInput.value.replace(/\s/g, ''),
            cardExpiry: cardExpiryInput.value,
            cardCvv: cardCvvInput.value,
            bestScore: '0'
        };

        try {
            const response = await fetch(`http://localhost:3000/users?name=${encodeURIComponent(user.name)}`);
            const users = await response.json();
            if (users.length > 0) {
                setError(usernameInput, 'register_page.form.username.exists');
                return;
            }

            const postResponse = await fetch(`http://localhost:3000/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (!postResponse.ok) throw new Error('Registration failed');

            window.location.assign('/home/index.html');
        } catch (error) {
            console.error('Error registering user:', error);
            setError(form, 'register_page.form.server_error');
        }
    });

    document.addEventListener('languageChanged', () => {
        updateUsernameAttempts();
        validateForm();
    });

    togglePasswordFields();
});