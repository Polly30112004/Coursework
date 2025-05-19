const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const gameOver = document.getElementById("game_over");
const scoreDisplay = document.getElementById("score");
const restartButton = document.getElementById("restart");
let score = 0;
let highScore = 0; 
let isGameRunning = false;
let scoreInterval;
let isAlive;
let currentUser = null;

// Проверка авторизации
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    console.log('Текущий пользователь:', user ? JSON.parse(user) : null);
    if (user) {
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// Загрузка лучшего результата пользователя
function loadHighScore() {
    if (!currentUser) return;
    fetch(`http://localhost:3000/users?userName=${currentUser.userName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные пользователя');
            }
            return response.json();
        })
        .then(users => {
            if (users.length > 0) {
                highScore = parseInt(users[0].bestScore) || 0;
                updateScoreDisplay();
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки лучшего результата:', error);
        });
}

// Обновление лучшего результата в db.json
function updateHighScore() {
    if (!currentUser || score <= highScore) return;
    fetch(`http://localhost:3000/users?userName=${currentUser.userName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось найти пользователя');
            }
            return response.json();
        })
        .then(users => {
            if (users.length > 0) {
                const user = users[0];
                return fetch(`http://localhost:3000/users/${user.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ bestScore: score.toString() })
                });
            }
            throw new Error('Пользователь не найден');
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Не удалось обновить результат');
            }
            highScore = score;
            updateScoreDisplay();
        })
        .catch(error => {
            console.error('Ошибка обновления лучшего результата:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    if (checkAuth()) {
        loadHighScore();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.code === "Space" && isGameRunning) {
        jump();
    }
});

function jump() {
    if (!dino.classList.contains("jump")) {
        dino.classList.add("jump");
        setTimeout(function() {
            dino.classList.remove("jump");
        }, 300);
    }
}

function startGame() {
    isGameRunning = true;
    score = 0;
    updateScoreDisplay();
    cactus.style.animation = "CactusMove 1.5s infinite linear";
    gameOver.style.display = "none";
    restartButton.style.display = "none";
    startScore();
    isAlive = setInterval(checkCollision, 10);
}

function checkCollision() {
    if (!isGameRunning) return;
    let dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
    let cactusLeft = parseInt(window.getComputedStyle(cactus).getPropertyValue("left"));
    if (cactusLeft < 50 && cactusLeft > 0 && dinoTop >= 140) {
        endGame();
    }
}

function startScore() {
    scoreInterval = setInterval(updateScore, 100);
}

function updateScore() {
    if (!isGameRunning) return;
    score++;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const formattedScore = score.toString().padStart(6, '0');
    const formattedHighScore = highScore.toString().padStart(6, '0');
    scoreDisplay.textContent = `Score: ${formattedScore} | Best: ${formattedHighScore}`;
}

function endGame() {
    isGameRunning = false;
    clearInterval(isAlive);
    clearInterval(scoreInterval);
    cactus.style.animation = "none";
    gameOver.style.display = "block";
    restartButton.style.display = "block";

    if (score > highScore) {
        updateHighScore();
    }
}

function restartGame() {
    startGame();
}

startGame();