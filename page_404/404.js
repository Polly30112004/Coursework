const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let isGameRunning = true;
let scoreInterval;


document.addEventListener("keydown", function(event)
{
jump();
});

function jump ()
{
    if ( dino.classList != "jump")
        dino.classList.add("jump");
    setTimeout(function ()
     {
        dino.classList.remove("jump")
     }, 300);
    
}


let isAlive = setInterval (function ()
{
    if (!isGameRunning) return;
    let dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
    let cactusLeft = parseInt(window.getComputedStyle(cactus).getPropertyValue("left"));   
    if(cactusLeft < 50 && cactusLeft > 0 && dinoTop >= 140)
    {
        endGame();
    }
})

function startScore() {
    scoreInterval = setInterval(updateScore, 100); 
}

/*насроить остановку, вывод поверх игры надписи игра окончена, выводить лучший счет зареганово пользователя, счет настроить как 000001-99999*/


function endGame() {
    isGameRunning = false;
    clearInterval(isAlive); // Останавливаем проверку столкновений
    clearInterval(scoreInterval); // Останавливаем счетчик
    cactus.style.animation = "none"; // Останавливаем движение кактуса
    gameOver.style.display = "block"; // Показываем "GAME OVER"
    restartButton.style.display = "block"; // Показываем кнопку перезапуска

    // Обновляем лучший результат
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        scoreDisplay.textContent = `Счет: ${score} | Лучший: ${highScore}`;
    }
}


