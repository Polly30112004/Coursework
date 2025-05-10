const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const gameOver = document.getElementById("game_over");
const scoreDisplay = document.getElementById("score");
const restartButton = document.getElementById("restart");
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let isGameRunning = false;
let scoreInterval;
let isAlive;

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
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
    updateScoreDisplay();
}

function restartGame() {
    startGame();
}

startGame();