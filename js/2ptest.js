

// ====== 설정 ======
const socket = io('https://mariopong-back-4cre.onrender.com/pong');
let joined = false;
let currentRoom = null;
let myPaddleIndex = null;
let gameActive = false;
let playerIndex = 2;
let userName = localStorage.getItem('userName') || '익명';
let characters = JSON.parse(localStorage.getItem('characters') || '["Mario"]');
let skillCooldown = 10; // 기본값, 캐릭터에 따라 변경
let lastSkillTime = 0;
let skillReady = false;
let myCharacter = localStorage.getItem('character_now') || characters[0];

// ====== 화면 요소 ======
const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const readyBtn = document.getElementById('readyBtn');
const leaveBtn = document.getElementById('leaveBtn');
const exitGameBtn = document.getElementById('exitGameBtn');
const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultScore = document.getElementById('resultScore');
const toLobbyBtn = document.getElementById('toLobbyBtn');
const roomInfoBox = document.getElementById('roomInfoBox');
const blindOverlay = document.getElementById('blindOverlay');

// ====== 유틸 ======
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ====== 스킬 쿨타임 바 ======
function updateSkillBar() {
  const now = Date.now();
  const elapsed = (now - lastSkillTime) / 1000;
  let percent = Math.min(1, elapsed / skillCooldown);
  document.getElementById('skillBar').style.width = (percent * 100) + '%';
  skillReady = percent >= 1;
  document.getElementById('skillLabel').innerText = skillReady ? '스킬 사용 가능! (Space)' : `쿨타임: ${Math.ceil(skillCooldown - elapsed)}초`;
}
setInterval(updateSkillBar, 100);

// ====== 방 입장/생성 ======
function joinRoom(roomName) {
  if (!roomName) {
    errorDiv.innerText = '방 이름을 입력하세요.';
    return;
  }
  socket.emit('joinRoom', roomName, userName);
  errorDiv.innerText = '';
  currentRoom = roomName;
}
document.getElementById('createBtn').onclick = () => {
  joinRoom(document.getElementById('roomInput').value.trim());
};
document.getElementById('joinBtn').onclick = () => {
  joinRoom(document.getElementById('roomInput').value.trim());
};
leaveBtn.onclick = () => {
  if (joined && currentRoom) {
    socket.emit('leaveRoom', currentRoom);
    statusDiv.innerText = '방에서 나왔습니다.';
    readyBtn.disabled = true;
    leaveBtn.disabled = true;
    joined = false;
    currentRoom = null;
    showLobby();
    roomInfoBox.innerHTML = '';
  }
};
readyBtn.onclick = () => {
  socket.emit('ready', myCharacter);
  statusDiv.innerText = '준비완료! 상대방을 기다리는 중...';
  readyBtn.disabled = true;
};
exitGameBtn.onclick = () => {
  socket.emit('leaveRoom', currentRoom);
  readyBtn.disabled = true;
  leaveBtn.disabled = true;
  joined = false;
  currentRoom = null;
  showLobby();
  roomInfoBox.innerHTML = '';
};

// ====== 스킬 발동 ======
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && skillReady && gameActive) {
    socket.emit('useSkill');
    lastSkillTime = Date.now();
    skillReady = false;
    updateSkillBar();
  }
});

// ====== 화면 전환 ======
function showLobby() {
  gameScreen.style.display = 'none';
  lobbyScreen.style.display = 'flex';
  readyBtn.disabled = false;
  leaveBtn.disabled = false;
  statusDiv.innerText = '';
  gameActive = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  hideResultModal();
  socket.emit('requestRoomInfo');
  roomInfoBox.style.display = 'block';
}
function showGame() {
  lobbyScreen.style.display = 'none';
  gameScreen.style.display = 'flex';
  gameActive = true;
  resizeCanvas();
  lastSkillTime = Date.now() - skillCooldown * 1000; // 게임 시작시 스킬 바로 사용 가능
}

// ====== 결과 모달 ======
function showResultModal(winner, score) {
  resultTitle.innerText = (myPaddleIndex === winner) ? "승리!" : "패배!";
  resultScore.innerText = `최종 점수: ${score[0]} : ${score[1]}`;
  resultModal.style.display = 'flex';
}
function hideResultModal() {
  resultModal.style.display = 'none';
}
toLobbyBtn.onclick = () => {
  showLobby();
};

// ====== 소켓 이벤트 ======
socket.on('roomFull', (data) => {
  errorDiv.innerText = data.message;
});
socket.on('enteredRoom', (index) => {
  statusDiv.innerText = '방에 입장했습니다. 준비 버튼을 눌러주세요!';
  readyBtn.disabled = false;
  leaveBtn.disabled = false;
  joined = true;
  playerIndex = index;
});
socket.on('connect', () => {
  statusDiv.innerText = '서버에 연결됨';
});
socket.on('disconnect', () => {
  statusDiv.innerText = '서버 연결 끊김';
  readyBtn.disabled = true;
  leaveBtn.disabled = true;
  joined = false;
  currentRoom = null;
  showLobby();
});
socket.on('connect_error', (err) => {
  errorDiv.innerText = '연결 오류: ' + err.message;
});
socket.on('waiting', (data) => {
  if (socket.id === data) {
    statusDiv.innerText = '준비완료! 상대방을 기다리는 중...';
  }
});
socket.on('startGame', () => {
  showGame();
  statusDiv.innerText = '';
  socket.emit('getPaddleIndex', currentRoom);
});
socket.on('gameState', (state) => {
  window.lastGameState = state;
  renderGame(state);
});
socket.on('paddleIndex', (idx) => {
  myPaddleIndex = idx;
});
socket.on('gameOver', (data) => {
  gameActive = false;
  showResultModal(data.winner, data.score);
});
socket.on('componentLeft', (id) => {
  if (socket.id !== id) {
    socket.emit('leaveRoom', currentRoom);
    showLobby();
  }
});
socket.on('roomInfo', (players) => {
  if (!players || players.length === 0) {
    roomInfoBox.innerHTML = '';
    return;
  }
  let html = `<strong>방 이름: ${currentRoom}</strong><br>`;
  players.forEach((p, i) => {
    // 내 소켓 ID와 비교해 내 영역에만 select 표시
    if (p.id === socket.id) {
      html += `P${i + 1}: ${p.userName} (${p.ready ? '✅' : '❌'})<br>`;
      html += `<select id="characterSelect">
            ${characters.map(ch => `<option value="${ch}" ${p.character === ch ? 'selected' : ''}>${ch}</option>`).join('')}
          </select><br>`;
    } else {
      html += `P${i + 1}: ${p.userName} (${p.ready ? '✅' : '❌'}) - <span>${p.character || '미선택'}</span><br>`;
    }
  });
  roomInfoBox.innerHTML = html;

  const select = document.getElementById('characterSelect');
  if (select) {
    select.onchange = function () {
      myCharacter = select.value;
      socket.emit('selectCharacter', select.value);
      localStorage.setItem('character_now', select.value);
      skillCooldown = 10;
    };
  }
});
socket.on('blindEffect', ({ duration }) => {
  blindOverlay.style.display = 'flex';
  setTimeout(() => {
    blindOverlay.style.display = 'none';
  }, duration || 1000);
});

// ====== 게임 화면 ======
function renderGame(state) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const cw = canvas.width, ch = canvas.height;
  // 서버에서 받은 패들 크기 사용
  const paddleWidth0 = (state.paddleWidth ? state.paddleWidth[0] : 10) / 700 * cw;
  const paddleWidth1 = (state.paddleWidth ? state.paddleWidth[1] : 10) / 700 * cw;
  const paddleHeight0 = (state.paddleHeight ? state.paddleHeight[0] : 75) / 500 * ch;
  const paddleHeight1 = (state.paddleHeight ? state.paddleHeight[1] : 75) / 500 * ch;

  const paddleY0 = state.paddleY ? state.paddleY[0] / 500 * ch : ch / 2 - paddleHeight0 / 2;
  const paddleY1 = state.paddleY ? state.paddleY[1] / 500 * ch : ch / 2 - paddleHeight1 / 2;
  const paddleX0 = cw * 0.03;
  const paddleX1 = cw - paddleWidth1 - cw * 0.03;

  context.fillStyle = 'black';
  context.fillRect(0, 0, cw, ch);

  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(cw / 2, 0);
  context.lineTo(cw / 2, ch);
  context.strokeStyle = 'grey';
  context.stroke();

  context.setLineDash([]);
  context.fillStyle = 'white';
  context.fillRect(paddleX0, paddleY0, paddleWidth0, paddleHeight0);
  context.fillRect(paddleX1, paddleY1, paddleWidth1, paddleHeight1);

  const ballX = (state.ballX / 700) * cw;
  const ballY = (state.ballY / 500) * ch;
  context.beginPath();
  context.arc(ballX, ballY, Math.min(cw, ch) * 0.02, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  for (const ball of state.fakeBalls) {
    context.beginPath();
    context.arc(ball.x, ball.y, Math.min(cw, ch) * 0.02, 0, 2 * Math.PI, false);
    context.fill();
  }
  context.globalAlpha = 1.0;

  context.font = `${Math.floor(ch * 0.08)}px Courier New`;
  context.fillText(state.score ? state.score[0] : 0, cw * 0.25, ch * 0.1);
  context.fillText(state.score ? state.score[1] : 0, cw * 0.75, ch * 0.1);
}

// ====== 패들 조작(마우스/터치) ======
canvas.addEventListener('mousemove', (e) => {
  if (!gameActive || myPaddleIndex === null) return;
  const rect = canvas.getBoundingClientRect();
  let y = e.clientY - rect.top;
  const ch = canvas.height;

  const paddleHeight = (window.lastGameState && window.lastGameState.paddleHeight)
    ? window.lastGameState.paddleHeight[myPaddleIndex] / 500 * ch
    : ch * 0.15;
  y = Math.max(0, Math.min(y, ch - paddleHeight));
  const yServer = y / ch * 500;
  socket.emit('paddleMove', { yPosition: yServer });
});
canvas.addEventListener('touchmove', (e) => {
  if (!gameActive || myPaddleIndex === null) return;
  const rect = canvas.getBoundingClientRect();
  let y = e.touches[0].clientY - rect.top;
  const ch = canvas.height;
  const paddleHeight = (window.lastGameState && window.lastGameState.paddleHeight)
    ? window.lastGameState.paddleHeight[myPaddleIndex] / 500 * ch
    : ch * 0.15;
  y = Math.max(0, Math.min(y, ch - paddleHeight));
  const yServer = y / ch * 500;
  socket.emit('paddleMove', { yPosition: yServer });
  e.preventDefault();
}, { passive: false });

window.addEventListener('DOMContentLoaded', resizeCanvas);