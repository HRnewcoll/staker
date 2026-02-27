// ===== KENO GAME =====
const KenoGame = (() => {
  const GRID_SIZE = 40;
  const DRAW_COUNT = 20;

  // Payout multipliers [picks][hits]
  const PAYTABLE = {
    1:  { 1: 3.96 },
    2:  { 2: 7.92 },
    3:  { 2: 1, 3: 23.76 },
    4:  { 2: 1, 3: 4, 4: 47.52 },
    5:  { 3: 1.5, 4: 13, 5: 95.04 },
    6:  { 3: 1, 4: 5, 5: 25, 6: 190 },
    7:  { 4: 2, 5: 15, 6: 55, 7: 400 },
    8:  { 4: 2, 5: 10, 6: 30, 7: 120, 8: 800 },
    9:  { 5: 5, 6: 15, 7: 50, 8: 200, 9: 1000 },
    10: { 5: 5, 6: 10, 7: 25, 8: 100, 9: 500, 10: 2000 },
  };

  let selected = new Set();
  let drawn = new Set();
  let gameActive = false;

  function updatePaytable() {
    const picks = selected.size;
    const el = document.getElementById('kenoPaytable');
    if (!el) return;
    if (picks === 0) { el.innerHTML = '<span style="color:#557086">Pick 1-10 numbers to see payouts</span>'; return; }
    const table = PAYTABLE[Math.min(picks, 10)];
    if (!table) return;
    el.innerHTML = Object.entries(table).map(([hits, multi]) =>
      `<span class="payline-item">${hits} hits = ${multi}x</span>`
    ).join('');
  }

  function renderGrid() {
    const grid = document.getElementById('kenoGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let n = 1; n <= GRID_SIZE; n++) {
      const cell = document.createElement('div');
      cell.className = 'keno-cell';
      cell.textContent = n;
      if (selected.has(n)) cell.classList.add('selected');
      if (drawn.has(n) && selected.has(n)) { cell.classList.remove('selected'); cell.classList.add('hit'); }
      else if (drawn.has(n)) cell.classList.add('drawn');
      if (!gameActive) {
        cell.addEventListener('click', () => toggleSelect(n, cell, grid));
      }
      grid.appendChild(cell);
    }
  }

  function toggleSelect(n, cell, grid) {
    if (selected.has(n)) {
      selected.delete(n);
    } else {
      if (selected.size >= 10) { showToast('Max 10 picks', 'lose'); return; }
      selected.add(n);
    }
    updatePaytable();
    renderGrid();
    document.getElementById('kenoPickCount').textContent = selected.size + ' picks';
  }

  function startGame() {
    if (selected.size === 0) { showToast('Pick at least 1 number', 'lose'); return; }
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }

    gameActive = true;
    drawn.clear();
    document.getElementById('kenoBetBtn').disabled = true;
    document.getElementById('kenoClearBtn').disabled = true;

    // Draw 20 numbers one by one with animation
    const allNumbers = Array.from({length: GRID_SIZE}, (_, i) => i + 1);
    const drawNumbers = [];
    while (drawNumbers.length < DRAW_COUNT) {
      const idx = Math.floor(Math.random() * allNumbers.length);
      drawNumbers.push(allNumbers.splice(idx, 1)[0]);
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i >= drawNumbers.length) {
        clearInterval(interval);
        // Calculate result
        const picks = Math.min(selected.size, 10);
        const hits = [...selected].filter(n => drawn.has(n)).length;
        const table = PAYTABLE[picks];
        const multi = (table && table[hits]) || 0;
        const win = bet * multi;
        if (win > 0) {
          addBalance(win);
          showResult(true, win - bet, multi);
        } else {
          showResult(false, bet, 0);
        }
        document.getElementById('kenoHits').textContent = hits + ' hits';
        document.getElementById('kenoMulti').textContent = multi > 0 ? multi + 'x' : 'No win';
        document.getElementById('kenoMulti').style.color = multi > 0 ? '#00e701' : '#f04444';
        addLiveBet('Keno', bet, multi, multi > 0);
        gameActive = false;
        document.getElementById('kenoBetBtn').disabled = false;
        document.getElementById('kenoClearBtn').disabled = false;
        return;
      }
      drawn.add(drawNumbers[i++]);
      renderGrid();
    }, 100);
  }

  function clearPicks() {
    selected.clear(); drawn.clear(); gameActive = false;
    updatePaytable();
    renderGrid();
    document.getElementById('kenoPickCount').textContent = '0 picks';
    document.getElementById('kenoHits').textContent = '-';
    document.getElementById('kenoMulti').textContent = '-';
  }

  function init() {
    renderGrid();
    updatePaytable();
    document.getElementById('kenoBetBtn').addEventListener('click', startGame);
    document.getElementById('kenoClearBtn').addEventListener('click', clearPicks);
  }

  return { init };
})();
