import commonPasswords from './common-passwords.js';

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

    const setError = (element, message) => {
        const formGroup = element.closest('.form-group');
        const errorSpan = formGroup.querySelector('.error-message');
        if (errorSpan) {
            errorSpan.textContent = message;
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
        if (!phoneInput.value || !validatePhone(phoneInput.value)) {
            setError(phoneInput, 'Phone number must start with +375 and have 9 digits');
            isValid = false;
        } else {
            clearError(phoneInput);
        }

        // Валидация email
        if (!emailInput.value || !validateEmail(emailInput.value)) {
            setError(emailInput, 'Enter a valid email address');
            isValid = false;
        } else {
            clearError(emailInput);
        }

        // Валидация даты рождения
        if (!birthdateInput.value || !validateBirthdate(birthdateInput.value)) {
            setError(birthdateInput, 'You must be between 16 and 120 years old');
            isValid = false;
        } else {
            clearError(birthdateInput);
        }

        // Валидация имени
        if (!firstNameInput.value || !validateName(firstNameInput.value)) {
            setError(firstNameInput, 'First name must contain only letters');
            isValid = false;
        } else {
            clearError(firstNameInput);
        }

        // Валидация фамилии
        if (!lastNameInput.value || !validateName(lastNameInput.value)) {
            setError(lastNameInput, 'Last name must contain only letters');
            isValid = false;
        } else {
            clearError(lastNameInput);
        }

        // Валидация отчества
        if (middleNameInput.value && !validateName(middleNameInput.value)) {
            setError(middleNameInput, 'Middle name must contain only letters');
            isValid = false;
        } else {
            clearError(middleNameInput);
        }

        // Валидация номера карты
        if (!cardNumberInput.value || !validateCardNumber(cardNumberInput.value)) {
            setError(cardNumberInput, 'Enter a valid 16-digit card number');
            isValid = false;
        } else {
            clearError(cardNumberInput);
        }

        // Валидация срока действия карты
        if (!cardExpiryInput.value || !validateCardExpiry(cardExpiryInput.value)) {
            setError(cardExpiryInput, 'Enter a valid expiry date (MM/YY, not expired)');
            isValid = false;
        } else {
            clearError(cardExpiryInput);
        }

        // Валидация CVV
        if (!cardCvvInput.value || !validateCardCvv(cardCvvInput.value)) {
            setError(cardCvvInput, 'Enter a valid 3-digit CVV');
            isValid = false;
        } else {
            clearError(cardCvvInput);
        }

        // Валидация имени пользователя
        if (!usernameInput.value) {
            setError(usernameInput, 'Enter a username');
            isValid = false;
        } else if (usernameInput.value !== originalValues.username) {
            // Проверяем уникальность имени
            const response = await fetch(`http://localhost:3000/users?name=${usernameInput.value}`);
            const users = await response.json();
            if (users.length > 0 && users[0].id !== userId) {
                setError(usernameInput, 'Username already exists');
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
                setError(passwordInput, 'Enter a password');
                isValid = false;
            } else if (!validatePassword(passwordInput.value)) {
                setError(passwordInput, 'Password must be 8-20 characters, include uppercase, lowercase, number, special character, and not be common');
                isValid = false;
            } else {
                clearError(passwordInput);
            }

            if (!confirmPasswordInput.value) {
                setError(confirmPasswordInput, 'Confirm your password');
                isValid = false;
            } else if (confirmPasswordInput.value !== passwordInput.value) {
                setError(confirmPasswordInput, 'Passwords do not match');
                isValid = false;
            } else if (!validatePassword(confirmPasswordInput.value)) {
                // Если пароли совпадают, но не проходят валидацию, показываем правила
                setError(confirmPasswordInput, 'Password must be 8-20 characters, include uppercase, lowercase, number, special character, and not be common');
                isValid = false;
            } else {
                clearError(confirmPasswordInput);
            }
        } else {
            if (!generatedPasswordInput.value) {
                setError(generatedPasswordInput, 'Generate a password');
                isValid = false;
            } else {
                clearError(generatedPasswordInput);
            }
        }

        saveBtn.disabled = !isValid;
        return isValid;
    };

    // Загрузка данных пользователя
    fetch(`http://localhost:3000/users?name=${currentUser.userName}`)
        .then(response => response.json())
        .then(users => {
            if (users.length === 0) {
                console.error('Пользователь не найден');
                return;
            }

            const user = users[0];
            userId = user.id; // Сохраняем ID пользователя
            phoneInput.value = user.phone;
            emailInput.value = user.email;
            birthdateInput.value = user.birthdate;
            firstNameInput.value = user.firstName;
            lastNameInput.value = user.lastName;
            middleNameInput.value = user.middleName || '';
            cardNumberInput.value = user.cardNumber;
            cardExpiryInput.value = user.cardExpiry;
            cardCvvInput.value = user.cardCvv;
            usernameInput.value = user.name;
            passwordInput.value = user.password;
            confirmPasswordInput.value = user.password;

            // Сохраняем исходные значения для сравнения
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
                if (input.value !== originalValues[input.id]) {
                    pendingChanges[input.id] = input.value;
                    saveBtn.style.display = 'block';
                } else {
                    delete pendingChanges[input.id];
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
            cardNumber: cardNumberInput.value,
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
                // Обновляем исходные значения
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
                // Обновляем currentUser в localStorage
                localStorage.setItem('currentUser', JSON.stringify({ userName: updatedUser.name }));
                pendingChanges = {};
                saveBtn.style.display = 'none';
                confirmModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Ошибка обновления профиля:', error);
            });
    });

    // Отмена изменений при закрытии модального окна
    closeModal.addEventListener('click', () => {
        // Возвращаем исходные значения
        Object.keys(pendingChanges).forEach(field => {
            if (field === 'password') {
                passwordInput.value = originalValues.password;
                confirmPasswordInput.value = originalValues.password;
                generatedPasswordInput.value = '';
            } else {
                document.getElementById(field).value = originalValues[field];
            }
        });
        pendingChanges = {};
        saveBtn.style.display = 'none';
        confirmModal.style.display = 'none';
        validateForm();
    });

    togglePasswordFields();
});