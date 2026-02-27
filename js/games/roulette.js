// ===== ROULETTE GAME =====
const RouletteGame = (() => {
  const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const NUMBERS = Array.from({length: 37}, (_, i) => i); // 0-36

  let selectedBets = {}; // { 'number_5': 0.5, 'red': 1.0, ... }
  let spinning = false;
  let wheelAngle = 0;
  let ballAngle = 0;
  let animId = null;

  function getColor(n) {
    if (n === 0) return 'green';
    return RED_NUMBERS.includes(n) ? 'red' : 'black';
  }

  function addBet(type, amount) {
    selectedBets[type] = (selectedBets[type] || 0) + amount;
  }

  function clearBets() {
    selectedBets = {};
    document.querySelectorAll('.r-cell').forEach(el => el.classList.remove('selected'));
    updateBetDisplay();
  }

  function updateBetDisplay() {
    const total = Object.values(selectedBets).reduce((a, b) => a + b, 0);
    const el = document.getElementById('rouletteTotalBet');
    if (el) el.textContent = '$' + total.toFixed(2);
  }

  function buildTable() {
    const table = document.getElementById('rouletteTable');
    if (!table) return;

    // Number grid
    const grid = document.createElement('div');
    grid.className = 'roulette-row';

    // Zero
    const zero = document.createElement('div');
    zero.className = 'r-cell green'; zero.textContent = '0';
    zero.style.width = '32px';
    zero.addEventListener('click', () => { zero.classList.toggle('selected'); toggleBet('number_0'); });
    grid.appendChild(zero);

    // Numbers 1-36 in 3 rows
    const rows = [[], [], []];
    for (let n = 1; n <= 36; n++) {
      const row = (n - 1) % 3;
      rows[row].push(n);
    }

    const numGrid = document.createElement('div');
    numGrid.style.cssText = 'display:flex; flex-direction:column; gap:4px;';
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'roulette-row';
      row.forEach(n => {
        const cell = document.createElement('div');
        cell.className = `r-cell ${getColor(n)}`;
        cell.textContent = n; cell.dataset.num = n;
        cell.addEventListener('click', () => { cell.classList.toggle('selected'); toggleBet('number_' + n); });
        rowEl.appendChild(cell);
      });
      numGrid.appendChild(rowEl);
    });
    grid.appendChild(numGrid);
    table.appendChild(grid);

    // Outside bets
    const outside = document.createElement('div');
    outside.className = 'roulette-row';
    outside.style.marginTop = '8px';
    const outsideBets = [
      { label: '1-18', key: 'low', pays: 2 },
      { label: 'Even', key: 'even', pays: 2 },
      { label: '🔴 Red', key: 'red', pays: 2 },
      { label: '⚫ Black', key: 'black', pays: 2 },
      { label: 'Odd', key: 'odd', pays: 2 },
      { label: '19-36', key: 'high', pays: 2 },
    ];
    outsideBets.forEach(b => {
      const cell = document.createElement('div');
      cell.className = 'r-cell outside-bet'; cell.textContent = b.label;
      cell.style.flex = '1'; cell.dataset.key = b.key;
      cell.addEventListener('click', () => { cell.classList.toggle('selected'); toggleBet(b.key); });
      outside.appendChild(cell);
    });
    table.appendChild(outside);

    // Dozens
    const dozens = document.createElement('div');
    dozens.className = 'roulette-row';
    dozens.style.marginTop = '4px';
    [{ label: '1st 12', key: 'dozen1', pays: 3 }, { label: '2nd 12', key: 'dozen2', pays: 3 }, { label: '3rd 12', key: 'dozen3', pays: 3 }].forEach(b => {
      const cell = document.createElement('div');
      cell.className = 'r-cell outside-bet'; cell.textContent = b.label;
      cell.style.flex = '1'; cell.dataset.key = b.key;
      cell.addEventListener('click', () => { cell.classList.toggle('selected'); toggleBet(b.key); });
      dozens.appendChild(cell);
    });
    table.appendChild(dozens);
  }

  function toggleBet(key) {
    const bet = getBetAmount() || 1;
    if (selectedBets[key]) { delete selectedBets[key]; }
    else { selectedBets[key] = bet; }
    updateBetDisplay();
  }

  function calcWinnings(result) {
    let winnings = 0;
    const color = getColor(result);
    Object.entries(selectedBets).forEach(([key, amt]) => {
      if (key === 'number_' + result) winnings += amt * 36;
      else if (key === 'red' && color === 'red') winnings += amt * 2;
      else if (key === 'black' && color === 'black') winnings += amt * 2;
      else if (key === 'even' && result !== 0 && result % 2 === 0) winnings += amt * 2;
      else if (key === 'odd' && result % 2 === 1) winnings += amt * 2;
      else if (key === 'low' && result >= 1 && result <= 18) winnings += amt * 2;
      else if (key === 'high' && result >= 19 && result <= 36) winnings += amt * 2;
      else if (key === 'dozen1' && result >= 1 && result <= 12) winnings += amt * 3;
      else if (key === 'dozen2' && result >= 13 && result <= 24) winnings += amt * 3;
      else if (key === 'dozen3' && result >= 25 && result <= 36) winnings += amt * 3;
    });
    return winnings;
  }

  function spin() {
    if (spinning) return;
    const totalBet = Object.values(selectedBets).reduce((a, b) => a + b, 0);
    if (totalBet <= 0 || Object.keys(selectedBets).length === 0) { showToast('Place a bet first!', 'lose'); return; }
    if (!deductBalance(totalBet)) { showToast('Insufficient balance', 'lose'); return; }

    spinning = true;
    document.getElementById('rouletteSpinBtn').disabled = true;
    document.getElementById('rouletteResult').textContent = '';

    const resultNumber = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];

    // Animate wheel
    const numSegments = 37;
    const segmentAngle = (2 * Math.PI) / numSegments;
    const extraSpins = (5 + Math.random() * 3) * Math.PI * 2;
    const targetAngle = extraSpins + (2 * Math.PI - resultNumber * segmentAngle);
    const startAngle = wheelAngle;
    const startTime = Date.now();
    const duration = 4000;
    const canvas = document.getElementById('rouletteCanvas');

    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

    function drawWheel(angle) {
      if (!canvas) return;
      const cx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx0 = w / 2, cy0 = h / 2, r = Math.min(w, h) / 2 - 4;
      cx.clearRect(0, 0, w, h);

      NUMBERS.forEach((n, i) => {
        const startA = angle + i * segmentAngle;
        const endA = startA + segmentAngle;
        cx.beginPath(); cx.moveTo(cx0, cy0);
        cx.arc(cx0, cy0, r, startA, endA); cx.closePath();
        cx.fillStyle = i === 0 ? '#1a6b2a' : (RED_NUMBERS.includes(n) ? '#8b1a1a' : '#1a1a1a');
        cx.fill(); cx.strokeStyle = '#0f212e'; cx.lineWidth = 1; cx.stroke();

        const mid = startA + segmentAngle / 2;
        const lx = cx0 + r * 0.75 * Math.cos(mid);
        const ly = cy0 + r * 0.75 * Math.sin(mid);
        cx.save(); cx.translate(lx, ly); cx.rotate(mid + Math.PI / 2);
        cx.fillStyle = '#fff'; cx.font = '9px sans-serif'; cx.textAlign = 'center';
        cx.fillText(n, 0, 0); cx.restore();
      });

      // Outer ring
      cx.beginPath(); cx.arc(cx0, cy0, r, 0, Math.PI * 2);
      cx.strokeStyle = '#f0a500'; cx.lineWidth = 4; cx.stroke();

      // Center
      cx.beginPath(); cx.arc(cx0, cy0, 16, 0, Math.PI * 2);
      cx.fillStyle = '#213743'; cx.fill();
      cx.strokeStyle = '#f0a500'; cx.lineWidth = 2; cx.stroke();

      // Ball
      const ballR = r - 14;
      const bx = cx0 + ballR * Math.cos(-angle * 2 + Date.now() / 200);
      const by = cy0 + ballR * Math.sin(-angle * 2 + Date.now() / 200);
      cx.beginPath(); cx.arc(bx, by, 6, 0, Math.PI * 2);
      cx.fillStyle = '#fff'; cx.fill();
    }

    function step() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      wheelAngle = startAngle + targetAngle * easeOut(t);
      drawWheel(wheelAngle);
      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        wheelAngle = startAngle + targetAngle;
        drawWheel(wheelAngle);
        const winnings = calcWinnings(resultNumber);
        const color = getColor(resultNumber);
        document.getElementById('rouletteResult').textContent = `${resultNumber} (${color.toUpperCase()})`;
        document.getElementById('rouletteResult').style.color = color === 'red' ? '#f04444' : color === 'green' ? '#00e701' : '#b1bad3';
        if (winnings > 0) {
          addBalance(winnings);
          showResult(true, winnings - totalBet, winnings / totalBet);
        } else {
          showResult(false, totalBet, 0);
        }
        addLiveBet('Roulette', totalBet, winnings > 0 ? winnings / totalBet : 0, winnings > 0);
        spinning = false;
        document.getElementById('rouletteSpinBtn').disabled = false;
      }
    }
    drawWheel(wheelAngle);
    animId = requestAnimationFrame(step);
  }

  function init() {
    buildTable();
    const canvas = document.getElementById('rouletteCanvas');
    if (canvas) {
      canvas.width = 260; canvas.height = 260;
      // Draw initial wheel
      const cx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx0 = w / 2, cy0 = h / 2, r = Math.min(w, h) / 2 - 4;
      const segAngle = (2 * Math.PI) / 37;
      NUMBERS.forEach((n, i) => {
        cx.beginPath(); cx.moveTo(cx0, cy0);
        cx.arc(cx0, cy0, r, i * segAngle, (i + 1) * segAngle); cx.closePath();
        cx.fillStyle = n === 0 ? '#1a6b2a' : (RED_NUMBERS.includes(n) ? '#8b1a1a' : '#1a1a1a');
        cx.fill(); cx.strokeStyle = '#0f212e'; cx.lineWidth = 1; cx.stroke();
      });
      cx.beginPath(); cx.arc(cx0, cy0, r, 0, Math.PI * 2);
      cx.strokeStyle = '#f0a500'; cx.lineWidth = 4; cx.stroke();
      cx.beginPath(); cx.arc(cx0, cy0, 16, 0, Math.PI * 2);
      cx.fillStyle = '#213743'; cx.fill();
    }
    document.getElementById('rouletteSpinBtn').addEventListener('click', spin);
    document.getElementById('rouletteClearBtn').addEventListener('click', clearBets);
  }

  return { init };
})();
