// ===== DRAGON TOWER GAME =====
const DragonTowerGame = (() => {
  // Difficulty: cols, dragons per row
  const DIFFICULTIES = {
    easy:   { cols: 3, dragons: 1 },
    medium: { cols: 4, dragons: 2 },
    hard:   { cols: 5, dragons: 3 },
    expert: { cols: 6, dragons: 4 },
  };
  const ROWS = 5;

  const BASE_MULTIPLIERS = [1.46, 2.19, 3.29, 4.94, 7.41];
  const MULTI_SCALES = { easy: 1, medium: 1.7, hard: 3.2, expert: 7 };

  let difficulty = 'easy';
  let board = []; // board[row] = array of 'gem'|'dragon'
  let currentRow = 0; // which row player is on (0=bottom)
  let gameActive = false;
  let betAmount = 0;
  let currentMulti = 1;

  function getConfig() { return DIFFICULTIES[difficulty]; }

  function getMulti(rowCleared) {
    const base = BASE_MULTIPLIERS[Math.min(rowCleared, ROWS - 1)];
    return parseFloat((base * MULTI_SCALES[difficulty]).toFixed(4));
  }

  function generateBoard() {
    const { cols, dragons } = getConfig();
    board = [];
    for (let r = 0; r < ROWS; r++) {
      const row = Array(cols).fill('gem');
      const dragonPositions = new Set();
      while (dragonPositions.size < dragons) {
        dragonPositions.add(Math.floor(Math.random() * cols));
      }
      dragonPositions.forEach(i => { row[i] = 'dragon'; });
      board.push(row);
    }
    currentRow = 0;
    currentMulti = 1;
  }

  function renderTower(revealedRows = new Set(), pickedCells = {}, gameOver = false) {
    const grid = document.getElementById('dtGrid');
    if (!grid) return;
    const { cols } = getConfig();
    grid.innerHTML = '';
    grid.style.setProperty('--dt-cols', cols);

    // Render from top (row ROWS-1) to bottom (row 0)
    for (let r = ROWS - 1; r >= 0; r--) {
      const rowEl = document.createElement('div');
      rowEl.className = 'tower-row';

      for (let c = 0; c < cols; c++) {
        const egg = document.createElement('div');
        const isCurrentRow = r === currentRow && gameActive;
        const isRevealed = revealedRows.has(r);
        const isPicked = pickedCells[r] === c;

        egg.className = 'tower-egg';

        if (isRevealed && board[r]) {
          const type = board[r][c];
          egg.classList.add(type === 'gem' ? 'gem' : 'dragon');
          egg.textContent = type === 'gem' ? '💎' : '🐉';
          if (isPicked) egg.classList.add('picked');
        } else if (isCurrentRow) {
          egg.classList.add('active-row');
          egg.textContent = '🥚';
          egg.addEventListener('click', () => pickEgg(r, c));
        } else if (r < currentRow && gameActive) {
          // Already passed rows show cleared
          egg.classList.add('cleared');
          egg.textContent = '✓';
        } else {
          egg.textContent = '🥚';
          egg.classList.add('inactive');
        }
        rowEl.appendChild(egg);
      }
      grid.appendChild(rowEl);
    }

    // Stats
    const cmEl = document.getElementById('dtCurrentMulti');
    const nmEl = document.getElementById('dtNextMulti');
    const gemsEl = document.getElementById('dtGemsFound');
    if (cmEl) cmEl.textContent = currentMulti.toFixed(4) + 'x';
    if (nmEl) nmEl.textContent = gameActive && currentRow < ROWS ? getMulti(currentRow).toFixed(4) + 'x' : '—';
    if (gemsEl) gemsEl.textContent = currentRow;

    const cashBtn = document.getElementById('dtCashBtn');
    if (cashBtn) cashBtn.disabled = !gameActive || currentRow === 0;
  }

  let revealedRows = new Set();
  let pickedCells = {};

  function startGame() {
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet;
    difficulty = document.getElementById('dtDifficulty').value || 'easy';
    generateBoard();
    gameActive = true;
    revealedRows = new Set();
    pickedCells = {};
    document.getElementById('dtBetBtn').textContent = 'New Game';
    document.getElementById('dtBetBtn').disabled = false;
    renderTower(revealedRows, pickedCells);
  }

  function pickEgg(row, col) {
    if (!gameActive || row !== currentRow) return;
    const type = board[row][col];
    pickedCells[row] = col;
    revealedRows.add(row);

    if (type === 'dragon') {
      // Lose - reveal whole row
      gameActive = false;
      renderTower(revealedRows, pickedCells, true);
      showResult(false, betAmount, 0);
      addLiveBet('Dragon Tower', betAmount, 0, false);
      document.getElementById('dtBetBtn').textContent = 'Bet';
      document.getElementById('dtBetBtn').disabled = false;
    } else {
      // Gem - advance
      currentMulti = getMulti(currentRow);
      currentRow++;
      renderTower(revealedRows, pickedCells);

      if (currentRow >= ROWS) {
        // Completed all rows - auto cash out
        cashOut();
      }
    }
  }

  function cashOut() {
    if (!gameActive || currentRow === 0) return;
    const win = betAmount * currentMulti;
    addBalance(win);
    gameActive = false;
    // Reveal remaining rows
    for (let r = 0; r < ROWS; r++) revealedRows.add(r);
    renderTower(revealedRows, pickedCells);
    showResult(true, win - betAmount, currentMulti);
    addLiveBet('Dragon Tower', betAmount, currentMulti, true);
    document.getElementById('dtBetBtn').textContent = 'Bet';
    document.getElementById('dtBetBtn').disabled = false;
  }

  function init() {
    difficulty = 'easy';
    renderTower(new Set(), {});
    document.getElementById('dtBetBtn').addEventListener('click', startGame);
    document.getElementById('dtCashBtn').addEventListener('click', cashOut);
    document.getElementById('dtDifficulty').addEventListener('change', (e) => {
      if (!gameActive) { difficulty = e.target.value; renderTower(new Set(), {}); }
    });
  }

  return { init };
})();
