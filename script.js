// Game Configuration
const CELL_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 150;
const SPEED_INCREASE = 5;
const MIN_SPEED = 60;

// Game State
let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isGameRunning = false;

// DOM Elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const valentineModal = document.getElementById('valentineModal');
const celebrationModal = document.getElementById('celebrationModal');
const finalScoreSpan = document.getElementById('finalScore');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const closeBtn = document.getElementById('closeBtn');

// Initialize Game
function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx = canvas.getContext('2d');

    // Make canvas responsive on mobile
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    highScoreDisplay.textContent = highScore;

    // Draw initial state
    drawBackground();
    drawIdleMessage();

    // Event Listeners
    startBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyPress);
    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
    playAgainBtn.addEventListener('click', restartGame);
    closeBtn.addEventListener('click', closeCelebration);

    // Mobile Controls - D-Pad
    initMobileControls();

    // Touch/Swipe Controls
    initSwipeControls();
}

// Resize Canvas for Mobile
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(container.clientWidth - 48, 400);

    if (window.innerWidth <= 480) {
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = maxWidth + 'px';
    } else {
        canvas.style.width = '';
        canvas.style.height = '';
    }
}

// Initialize Mobile D-Pad Controls
function initMobileControls() {
    const dpadButtons = document.querySelectorAll('.dpad-btn');

    dpadButtons.forEach(btn => {
        // Touch events for mobile
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDpadPress(btn.dataset.direction);
        }, { passive: false });

        // Mouse events for testing on desktop
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleDpadPress(btn.dataset.direction);
        });
    });
}

// Handle D-Pad Button Press
function handleDpadPress(dir) {
    if (!isGameRunning) return;

    switch (dir) {
        case 'up':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'down':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'left':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'right':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
}

// Initialize Swipe Controls
function initSwipeControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 30;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (!isGameRunning) return;

        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && direction.x !== -1) {
                    nextDirection = { x: 1, y: 0 }; // Right
                } else if (deltaX < 0 && direction.x !== 1) {
                    nextDirection = { x: -1, y: 0 }; // Left
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && direction.y !== -1) {
                    nextDirection = { x: 0, y: 1 }; // Down
                } else if (deltaY < 0 && direction.y !== 1) {
                    nextDirection = { x: 0, y: -1 }; // Up
                }
            }
        }
    }, { passive: true });

    // Prevent scrolling when touching the game area
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// Draw Background
function drawBackground() {
    // Create gradient background
    const gradient = ctx.createRadialGradient(
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0,
        CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2
    );
    gradient.addColorStop(0, '#1a0a14');
    gradient.addColorStop(1, '#0d0510');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 107, 157, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }
}

// Draw Idle Message
function drawIdleMessage() {
    ctx.fillStyle = 'rgba(255, 107, 157, 0.8)';
    ctx.font = '24px Pacifico';
    ctx.textAlign = 'center';
    ctx.fillText('Press Start', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 15);
    ctx.font = '16px Poppins';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('to play for your love 💕', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 15);
}

// Start Game
function startGame() {
    // Reset game state
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isGameRunning = true;

    scoreDisplay.textContent = score;
    startBtn.textContent = 'Playing... 💕';
    startBtn.disabled = true;

    spawnFood();

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameUpdate, gameSpeed);
}

// Spawn Food (Heart-shaped concept)
function spawnFood() {
    const gridSize = CANVAS_SIZE / CELL_SIZE;
    let newFood;

    do {
        newFood = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    food = newFood;
}

// Game Update Loop
function gameUpdate() {
    // Update direction
    direction = { ...nextDirection };

    // Calculate new head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = score;
        spawnFood();

        // Increase speed
        if (gameSpeed > MIN_SPEED) {
            gameSpeed -= SPEED_INCREASE;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameUpdate, gameSpeed);
        }
    } else {
        snake.pop();
    }

    // Draw
    draw();
}

// Check Collision
function checkCollision(head) {
    const gridSize = CANVAS_SIZE / CELL_SIZE;

    // Wall collision
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        return true;
    }

    // Self collision
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// Draw Game
function draw() {
    drawBackground();
    drawFood();
    drawSnake();
}

// Draw Snake
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        // Create gradient for snake segments
        const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);

        if (index === 0) {
            // Head - brighter
            gradient.addColorStop(0, '#ff6b9d');
            gradient.addColorStop(1, '#ff8fb1');
        } else {
            // Body - gradient based on position
            const alpha = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(255, 107, 157, ${alpha})`);
            gradient.addColorStop(1, `rgba(168, 85, 247, ${alpha})`);
        }

        ctx.fillStyle = gradient;

        // Draw rounded rectangle
        const padding = 2;
        const radius = 6;
        roundRect(
            x + padding,
            y + padding,
            CELL_SIZE - padding * 2,
            CELL_SIZE - padding * 2,
            radius
        );

        // Add glow effect to head
        if (index === 0) {
            ctx.shadowColor = '#ff6b9d';
            ctx.shadowBlur = 15;
            roundRect(
                x + padding,
                y + padding,
                CELL_SIZE - padding * 2,
                CELL_SIZE - padding * 2,
                radius
            );
            ctx.shadowBlur = 0;

            // Draw eyes
            drawEyes(x, y);
        }
    });
}

// Draw Eyes
function drawEyes(x, y) {
    ctx.fillStyle = 'white';
    const eyeSize = 4;
    const eyeOffset = 5;

    // Position eyes based on direction
    let leftEyeX = x + CELL_SIZE / 3;
    let rightEyeX = x + (2 * CELL_SIZE) / 3;
    let eyeY = y + CELL_SIZE / 3;

    if (direction.x === -1) {
        leftEyeX = x + CELL_SIZE / 3;
        rightEyeX = x + CELL_SIZE / 3;
        eyeY = y + CELL_SIZE / 4;
    } else if (direction.x === 1) {
        leftEyeX = x + (2 * CELL_SIZE) / 3;
        rightEyeX = x + (2 * CELL_SIZE) / 3;
        eyeY = y + CELL_SIZE / 4;
    } else if (direction.y === -1) {
        eyeY = y + CELL_SIZE / 3;
    } else if (direction.y === 1) {
        eyeY = y + (2 * CELL_SIZE) / 3;
    }

    // Draw eyes with pupils
    ctx.beginPath();
    ctx.arc(leftEyeX - 2, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(rightEyeX + 2, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0a14';
    ctx.beginPath();
    ctx.arc(leftEyeX - 2, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(rightEyeX + 2, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw Food as Heart
function drawFood() {
    const x = food.x * CELL_SIZE + CELL_SIZE / 2;
    const y = food.y * CELL_SIZE + CELL_SIZE / 2;

    // Pulsing effect
    const pulse = Math.sin(Date.now() / 200) * 2 + 10;

    // Draw heart glow
    ctx.shadowColor = '#ff6b9d';
    ctx.shadowBlur = 20;

    // Draw heart
    ctx.fillStyle = '#ff6b9d';
    ctx.font = `${pulse + 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤️', x, y);

    ctx.shadowBlur = 0;
}

// Rounded Rectangle Helper
function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Handle Key Press
function handleKeyPress(e) {
    if (!isGameRunning) return;

    const key = e.key.toLowerCase();

    switch (key) {
        case 'arrowup':
        case 'w':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'arrowdown':
        case 's':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'arrowleft':
        case 'a':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'arrowright':
        case 'd':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }

    e.preventDefault();
}

// Game Over
function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    // Show Valentine modal
    finalScoreSpan.textContent = score;
    valentineModal.classList.add('show');

    startBtn.textContent = 'Start Game 💖';
    startBtn.disabled = false;
}

// Handle Yes Button
function handleYes() {
    valentineModal.classList.remove('show');
    celebrationModal.classList.add('show');
    createConfetti();
}

// Handle No Button (with fun effect)
let noClickCount = 0;
function handleNo() {
    noClickCount++;

    // Make the no button run away or shrink
    if (noClickCount >= 3) {
        noBtn.style.display = 'none';
        yesBtn.style.width = '100%';
        yesBtn.textContent = 'Just say Yes! 💕';
    } else {
        // Move the button randomly
        const randomX = Math.random() * 50 - 25;
        const randomY = Math.random() * 20 - 10;
        noBtn.style.transform = `translate(${randomX}px, ${randomY}px) scale(${1 - noClickCount * 0.2})`;
    }
}

// Create Confetti
function createConfetti() {
    const confettiContainer = document.querySelector('.confetti');
    const colors = ['#ff6b9d', '#ff8fb1', '#a855f7', '#ffd700', '#ff69b4', '#ff1493'];
    const shapes = ['❤️', '💕', '💖', '💗', '✨', '⭐', '💝'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('span');
        confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 10}px;
            left: ${Math.random() * 100}%;
            top: -20px;
            animation: confettiFall ${Math.random() * 3 + 2}s ease-out forwards;
            animation-delay: ${Math.random() * 1}s;
        `;
        confettiContainer.appendChild(confetti);
    }

    // Add confetti animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(500px) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Restart Game
function restartGame() {
    valentineModal.classList.remove('show');
    noClickCount = 0;
    noBtn.style.display = 'inline-block';
    noBtn.style.transform = 'none';
    yesBtn.style.width = 'auto';
    yesBtn.textContent = 'Yes! 💖';
    startGame();
}

// Close Celebration
function closeCelebration() {
    celebrationModal.classList.remove('show');
    noClickCount = 0;
    noBtn.style.display = 'inline-block';
    noBtn.style.transform = 'none';
    yesBtn.style.width = 'auto';
    yesBtn.textContent = 'Yes! 💖';

    // Clear confetti
    const confettiContainer = document.querySelector('.confetti');
    confettiContainer.innerHTML = '';

    drawBackground();
    drawIdleMessage();
}

// Initialize on load
window.addEventListener('load', init);
