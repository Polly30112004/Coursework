import commonPasswords from './common-passwords.js';
import { getTranslations } from '/header_footer/language-switcher.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const birthdateInput = document.getElementById('birthdate');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const middleNameInput = document.getElementById('middle-name');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');
    const usernameInput = document.getElementById('username');
    const passwordMethodRadios = document.getElementsByName('password-method');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const generatedPasswordInput = document.getElementById('generated-password');
    const regeneratePasswordBtn = document.getElementById('regenerate-password');
    const saveBtn = document.getElementById('save-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmSaveBtn = document.getElementById('confirm-save');
    const closeModal = document.querySelector('.close');

    let currentUser = null;
    let originalValues = {};
    let userId = null;

    // Получение переводов
    const getCurrentTranslations = () => getTranslations(localStorage.getItem('language') || 'en');

    // Получаем текущего пользователя из localStorage
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
    } else {
        console.error('Пользователь не найден в localStorage');
        return;
    }

    // Функции валидации
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

    const validatePassword = (password) => {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
        return regex.test(password) && !commonPasswords.includes(password);
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

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return validatePassword(password) ? password : generatePassword();
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

    const validateForm = async () => {
        let isValid = true;

        // Валидация телефона
        if (!phoneInput.value) {
            setError(phoneInput, 'register_page.form.phone.required');
            isValid = false;
        } else if (!validatePhone(phoneInput.value)) {
            setError(phoneInput, 'register_page.form.phone.invalid');
            isValid = false;
        } else {
            clearError(phoneInput);
        }

        // Валидация email
        if (!emailInput.value) {
            setError(emailInput, 'register_page.form.email.required');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            setError(emailInput, 'register_page.form.email.invalid');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        // Валидация даты рождения
        if (!birthdateInput.value) {
            setError(birthdateInput, 'register_page.form.birthdate.required');
            isValid = false;
        } else if (!validateBirthdate(birthdateInput.value)) {
            setError(birthdateInput, 'register_page.form.birthdate.invalid');
            isValid = false;
        } else {
            clearError(birthdateInput);
        }

        // Валидация имени
        if (!firstNameInput.value) {
            setError(firstNameInput, 'register_page.form.first_name.required');
            isValid = false;
        } else if (!validateName(firstNameInput.value)) {
            setError(firstNameInput, 'register_page.form.first_name.invalid');
            isValid = false;
        } else {
            clearError(firstNameInput);
        }

        // Валидация фамилии
        if (!lastNameInput.value) {
            setError(lastNameInput, 'register_page.form.last_name.required');
            isValid = false;
        } else if (!validateName(lastNameInput.value)) {
            setError(lastNameInput, 'register_page.form.last_name.invalid');
            isValid = false;
        } else {
            clearError(lastNameInput);
        }

        // Валидация отчества
        if (middleNameInput.value && !validateName(middleNameInput.value)) {
            setError(middleNameInput, 'register_page.form.middle_name.invalid');
            isValid = false;
        } else {
            clearError(middleNameInput);
        }

        // Валидация номера карты
        if (!cardNumberInput.value) {
            setError(cardNumberInput, 'register_page.form.card_number.required');
            isValid = false;
        } else if (!validateCardNumber(cardNumberInput.value)) {
            setError(cardNumberInput, 'register_page.form.card_number.invalid');
            isValid = false;
        } else {
            clearError(cardNumberInput);
        }

        // Валидация срока действия карты
        if (!cardExpiryInput.value) {
            setError(cardExpiryInput, 'register_page.form.card_expiry.required');
            isValid = false;
        } else if (!validateCardExpiry(cardExpiryInput.value)) {
            setError(cardExpiryInput, 'register_page.form.card_expiry.invalid');
            isValid = false;
        } else {
            clearError(cardExpiryInput);
        }

        // Валидация CVV
        if (!cardCvvInput.value) {
            setError(cardCvvInput, 'register_page.form.card_cvv.required');
            isValid = false;
        } else if (!validateCardCvv(cardCvvInput.value)) {
            setError(cardCvvInput, 'register_page.form.card_cvv.invalid');
            isValid = false;
        } else {
            clearError(cardCvvInput);
        }

        // Валидация имени пользователя
        if (!usernameInput.value) {
            setError(usernameInput, 'register_page.form.username.required');
            isValid = false;
        } else if (usernameInput.value !== originalValues.username) {
            // Проверяем уникальность имени
            const response = await fetch(`http://localhost:3000/users?name=${encodeURIComponent(usernameInput.value)}`);
            const users = await response.json();
            if (users.length > 0 && users[0].id !== userId) {
                setError(usernameInput, 'register_page.form.username.exists');
                isValid = false;
            } else {
                clearError(usernameInput);
            }
        } else {
            clearError(usernameInput);
        }

        // Валидация пароля
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

        saveBtn.disabled = !isValid;
        return isValid;
    };

    // Загрузка данных пользователя
    fetch(`http://localhost:3000/users?name=${encodeURIComponent(currentUser.userName)}`)
        .then(response => response.json())
        .then(users => {
            if (users.length === 0) {
                console.error('Пользователь не найден');
                setError(form, 'profile_page.form.server_error');
                return;
            }

            const user = users[0];
            userId = user.id;
            phoneInput.value = user.phone;
            emailInput.value = user.email;
            birthdateInput.value = user.birthdate;
            firstNameInput.value = user.firstName;
            lastNameInput.value = user.lastName;
            middleNameInput.value = user.middleName || '';
            cardNumberInput.value = user.cardNumber.replace(/(.{4})/g, '$1 ').trim();
            cardExpiryInput.value = user.cardExpiry;
            cardCvvInput.value = user.cardCvv;
            usernameInput.value = user.name;
            passwordInput.value = user.password;
            confirmPasswordInput.value = user.password;

            originalValues = {
                phone: user.phone,
                email: user.email,
                birthdate: user.birthdate,
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName || '',
                cardNumber: user.cardNumber,
                cardExpiry: user.cardExpiry,
                cardCvv: user.cardCvv,
                username: user.name,
                password: user.password
            };
        })
        .catch(error => {
            console.error('Ошибка загрузки данных пользователя:', error);
            setError(form, 'profile_page.form.server_error');
        });

    // Форматирование полей
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

    confirmPasswordInput.addEventListener('paste', (e) => {
        e.preventDefault();
    });

    // Обработчики для пароля
    passwordMethodRadios.forEach(radio => {
        radio.addEventListener('change', togglePasswordFields);
    });

    regeneratePasswordBtn.addEventListener('click', () => {
        generatedPasswordInput.value = generatePassword();
        validateForm();
    });

    // Отслеживание изменений в полях
    const inputs = [phoneInput, emailInput, birthdateInput, firstNameInput, lastNameInput, middleNameInput, cardNumberInput, cardExpiryInput, cardCvvInput, usernameInput, passwordInput, confirmPasswordInput, generatedPasswordInput];
    let pendingChanges = {};

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateForm();
            if (input.id === 'password' || input.id === 'confirm-password' || input.id === 'generated-password') {
                const method = document.querySelector('input[name="password-method"]:checked').value;
                const newPassword = method === 'manual' ? passwordInput.value : generatedPasswordInput.value;
                if (newPassword !== originalValues.password) {
                    pendingChanges.password = newPassword;
                    saveBtn.style.display = 'block';
                } else {
                    delete pendingChanges.password;
                    if (Object.keys(pendingChanges).length === 0) {
                        saveBtn.style.display = 'none';
                    }
                }
            } else {
                const field = input.id === 'card-number' ? 'cardNumber' : input.id === 'card-expiry' ? 'cardExpiry' : input.id === 'card-cvv' ? 'cardCvv' : input.id;
                const value = input.id === 'card-number' ? input.value.replace(/\s/g, '') : input.value;
                if (value !== originalValues[field]) {
                    pendingChanges[field] = value;
                    saveBtn.style.display = 'block';
                } else {
                    delete pendingChanges[field];
                    if (Object.keys(pendingChanges).length === 0) {
                        saveBtn.style.display = 'none';
                    }
                }
            }
        });
    });

    // Обработчик для кнопки "Сохранить"
    saveBtn.addEventListener('click', () => {
        if (!validateForm()) return;
        confirmModal.style.display = 'flex';
    });

    // Подтверждение изменений
    confirmSaveBtn.addEventListener('click', () => {
        if (!validateForm()) return;

        const method = document.querySelector('input[name="password-method"]:checked').value;
        const updatedUser = {
            phone: phoneInput.value,
            email: emailInput.value,
            birthdate: birthdateInput.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            middleName: middleNameInput.value || '',
            cardNumber: cardNumberInput.value.replace(/\s/g, ''),
            cardExpiry: cardExpiryInput.value,
            cardCvv: cardCvvInput.value,
            name: usernameInput.value,
            password: method === 'manual' ? passwordInput.value : generatedPasswordInput.value
        };

        fetch(`http://localhost:3000/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to update user');
                originalValues = {
                    phone: updatedUser.phone,
                    email: updatedUser.email,
                    birthdate: updatedUser.birthdate,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    middleName: updatedUser.middleName,
                    cardNumber: updatedUser.cardNumber,
                    cardExpiry: updatedUser.cardExpiry,
                    cardCvv: updatedUser.cardCvv,
                    username: updatedUser.name,
                    password: updatedUser.password
                };
                localStorage.setItem('currentUser', JSON.stringify({ userName: updatedUser.name }));
                pendingChanges = {};
                saveBtn.style.display = 'none';
                confirmModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Ошибка обновления профиля:', error);
                setError(form, 'profile_page.form.server_error');
            });
    });

    // Отмена изменений при закрытии модального окна
    closeModal.addEventListener('click', () => {
        Object.keys(pendingChanges).forEach(field => {
            if (field === 'password') {
                passwordInput.value = originalValues.password;
                confirmPasswordInput.value = originalValues.password;
                generatedPasswordInput.value = '';
            } else {
                const id = field === 'cardNumber' ? 'card-number' : field === 'cardExpiry' ? 'card-expiry' : field === 'cardCvv' ? 'card-cvv' : field;
                document.getElementById(id).value = originalValues[field];
                if (id === 'card-number') {
                    document.getElementById(id).value = originalValues[field].replace(/(.{4})/g, '$1 ').trim();
                }
            }
        });
        pendingChanges = {};
        saveBtn.style.display = 'none';
        confirmModal.style.display = 'none';
        validateForm();
    });

    // Обновление переводов при смене языка
    document.addEventListener('languageChanged', () => {
        validateForm();
    });

    togglePasswordFields();
});