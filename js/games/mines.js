// ===== MINES GAME =====
const MinesGame = (() => {
  const GRID_SIZE = 25;
  let mineCount = 5;
  let board = [];
  let revealed = [];
  let gameActive = false;
  let betAmount = 0;
  let gemsFound = 0;
  let minePositions = new Set();

  const MULTIPLIERS = {
    1:  [1.03,1.08,1.12,1.18,1.24,1.31,1.39,1.48,1.59,1.72,1.87,2.05,2.28,2.56,2.92,3.40,4.07,5.05,6.57,9.17,14.4,26.1,60.5,244,3920],
    3:  [1.08,1.17,1.28,1.41,1.56,1.74,1.96,2.24,2.58,3.01,3.56,4.29,5.29,6.68,8.72,11.9,17.1,26.4,44.9,86.7,197,621],
    5:  [1.15,1.35,1.59,1.90,2.29,2.80,3.47,4.37,5.60,7.31,9.75,13.3,18.8,27.6,42.4,69.1,120,228,499,1372],
    10: [1.27,1.64,2.15,2.87,3.89,5.38,7.59,11.0,16.4,25.1,40.0,66.6,117,221,454,1049],
    20: [1.61,2.63,4.40,7.52,13.3,24.5,47.0,95.2,207,493]
  };

  function getMultiplierTable() {
    const keys = Object.keys(MULTIPLIERS).map(Number).sort((a, b) => Math.abs(a - mineCount) - Math.abs(b - mineCount));
    return MULTIPLIERS[keys[0]] || MULTIPLIERS[5];
  }

  function getCurrentMultiplier() {
    const table = getMultiplierTable();
    const idx = Math.min(gemsFound - 1, table.length - 1);
    return gemsFound > 0 ? table[idx] || 1 : 1;
  }

  function getNextMultiplier() {
    const table = getMultiplierTable();
    const idx = Math.min(gemsFound, table.length - 1);
    return table[idx] || table[table.length - 1];
  }

  function generateBoard() {
    board = Array(GRID_SIZE).fill('gem');
    minePositions.clear();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * GRID_SIZE));
    }
    minePositions.forEach(i => { board[i] = 'mine'; });
    revealed = Array(GRID_SIZE).fill(false);
    gemsFound = 0;
  }

  function renderBoard() {
    const grid = document.getElementById('minesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < GRID_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'mine-cell' + (!gameActive ? ' disabled' : '');
      if (revealed[i]) {
        cell.classList.add(board[i]);
        cell.textContent = board[i] === 'gem' ? '💎' : '💣';
      } else {
        cell.textContent = '';
      }
      if (gameActive && !revealed[i]) {
        cell.addEventListener('click', () => clickCell(i));
      }
      grid.appendChild(cell);
    }
    document.getElementById('minesMultiplier').textContent = gemsFound > 0 ? getCurrentMultiplier().toFixed(2) + 'x' : '1.00x';
    document.getElementById('minesNextMulti').textContent = getNextMultiplier().toFixed(2) + 'x';
    document.getElementById('minesGemsFound').textContent = gemsFound;
    document.getElementById('minesCashoutBtn').disabled = !gameActive || gemsFound === 0;
    const cashoutWin = betAmount * getCurrentMultiplier();
    document.getElementById('minesCashoutAmount').textContent = gemsFound > 0 ? '$' + cashoutWin.toFixed(2) : '-';
  }

  function clickCell(idx) {
    if (!gameActive || revealed[idx]) return;
    revealed[idx] = true;

    if (board[idx] === 'mine') {
      // Reveal all mines
      minePositions.forEach(i => { revealed[i] = true; });
      gameActive = false;
      renderBoard();
      showResult(false, betAmount, 0);
      addLiveBet('Mines', betAmount, 0, false);
      document.getElementById('minesStartBtn').disabled = false;
      document.getElementById('minesStartBtn').textContent = 'Bet';
      document.getElementById('minesBetInput').disabled = false;
      document.getElementById('minesMineCount').disabled = false;
    } else {
      gemsFound++;
      renderBoard();
      const table = getMultiplierTable();
      if (gemsFound >= GRID_SIZE - mineCount) {
        // All gems found, auto cashout
        cashOut();
      }
    }
  }

  function startGame() {
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet;
    mineCount = parseInt(document.getElementById('minesMineCount').value) || 5;
    generateBoard();
    gameActive = true;
    document.getElementById('minesStartBtn').disabled = true;
    document.getElementById('minesStartBtn').textContent = 'Game in progress...';
    document.getElementById('minesBetInput').disabled = true;
    document.getElementById('minesMineCount').disabled = true;
    renderBoard();
  }

  function cashOut() {
    if (!gameActive || gemsFound === 0) return;
    const multi = getCurrentMultiplier();
    const win = betAmount * multi;
    addBalance(win);
    gameActive = false;
    // Reveal all mines
    minePositions.forEach(i => { revealed[i] = true; });
    renderBoard();
    showResult(true, win - betAmount, multi);
    addLiveBet('Mines', betAmount, multi, true);
    document.getElementById('minesStartBtn').disabled = false;
    document.getElementById('minesStartBtn').textContent = 'Bet';
    document.getElementById('minesBetInput').disabled = false;
    document.getElementById('minesMineCount').disabled = false;
  }

  function init() {
    renderBoard();
    document.getElementById('minesStartBtn').addEventListener('click', startGame);
    document.getElementById('minesCashoutBtn').addEventListener('click', cashOut);
  }

  return { init };
})();
