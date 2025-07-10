const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// Game objects
const paddleWidth = 10, paddleHeight = 100;

const player = {
  x: 0,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  dy: 10
};

const auto = {
  x: canvas.width - paddleWidth,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
  dy: 4
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  speed: 3,
  dx: 5,
  dy: 5
};

let playerScore = 0;
let autoScore = 0;

// Starting Screen
const startScreen = document.createElement('div');
startScreen.style.cssText = `
  position: absolute; top:0; left:0; width:100%; height:100%; 
  background: #000c; color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:10;
`;
startScreen.innerHTML = `
  <h1>Pong Game</h1>
  <button id="startBtn" style="font-size:24px; padding:10px 30px; cursor:pointer;">Game Start</button>
`;
document.body.appendChild(startScreen);

const stopBtn = document.createElement('button');
stopBtn.textContent = '게임 종료';
stopBtn.style.cssText = `
  position: absolute; top: 20px; right: 20px; padding: 10px 20px;
  font-size: 16px; cursor: pointer; display: none; z-index: 10;
`;
document.body.appendChild(stopBtn);

// Draw paddles
function drawPaddle(x, y, width, height) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, width, height);
}

// Draw ball
function drawBall() {
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
}

// Draw score
function drawScore() {
  ctx.font = "32px Arial";
  ctx.fillText(`${playerScore} : ${autoScore}`, canvas.width / 2 - 50, 50);
}

// Move paddles - keybord
// document.addEventListener("keydown", movePaddle);

// Using mouse
canvas.addEventListener("mousemove", function (e) {

  const rect = canvas.getBoundingClientRect();
  const root = document.documentElement;

  const mouseY = e.clientY - rect.top - root.scrollTop;
  player.y = mouseY - player.height / 2;

  // Do not go out of range
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
});


function movePaddle(e) {
  switch (e.key) {
    case "ArrowUp":
      player.y -= player.dy;
      break;
    case "ArrowDown":
      player.y += player.dy;
      break;
  }

  // Keep player paddle in bounds
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// auto paddle follows the ball
function moveauto() {
  if (ball.y < auto.y + auto.height / 2) {
    auto.y -= auto.dy;
  } else {
    auto.y += auto.dy;
  }

  // Keep auto paddle in bounds
  if (auto.y < 0) auto.y = 0;
  if (auto.y + auto.height > canvas.height) auto.y = canvas.height - auto.height;
}

// Reset ball
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.dx *= -1; // Serve to other side
}

// Update game frame
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPaddle(player.x, player.y, player.width, player.height);
  drawPaddle(auto.x, auto.y, auto.width, auto.height);
  drawBall();
  drawScore();

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Bounce top/bottom
  if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // Paddle collision — player
  if (
    ball.x - ball.radius < player.x + player.width &&
    ball.y > player.y &&
    ball.y < player.y + player.height
  ) {
    ball.dx *= -1;
  }

  // Paddle collision — auto
  if (
    ball.x + ball.radius > auto.x &&
    ball.y > auto.y &&
    ball.y < auto.y + auto.height
  ) {
    ball.dx *= -1;
  }

  // Score points
  if (ball.x - ball.radius < 0) {
    autoScore++;
    resetBall();
  } else if (ball.x + ball.radius > canvas.width) {
    playerScore++;
    resetBall();
  }

  moveauto();

  requestAnimationFrame(update);
}

update();

// 시작 
function startGame() {
  playerScore = 0;
  autoScore = 0;
  ball.speed = 5;
  ball.dx = 5;
  ball.dy = 5;
  player.y = canvas.height / 2 - player.height / 2;
  auto.y = canvas.height / 2 - auto.height / 2;

  startScreen.style.display = 'none';
  stopBtn.style.display = 'block';

  update();
}

// 종료
function stopGame() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  stopBtn.style.display = 'none';
  startScreen.style.display = 'flex';
}

// Button
document.getElementById("startBtn").addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);
