// ===== CRASH GAME =====
const CrashGame = (() => {
  let gameState = 'waiting'; // waiting, running, crashed
  let multiplier = 1.0;
  let cashedOut = false;
  let betPlaced = false;
  let betAmount = 0;
  let animFrame = null;
  let startTime = null;
  let crashPoint = 1.0;
  let history = [];
  const canvas = () => document.getElementById('crashCanvas');
  const ctx = () => canvas() ? canvas().getContext('2d') : null;

  function generateCrashPoint() {
    // House edge ~3%
    const r = Math.random();
    if (r < 0.03) return 1.01;
    return Math.max(1.0, parseFloat((0.97 / (1 - Math.random())).toFixed(2)));
  }

  function draw() {
    const c = canvas();
    if (!c) return;
    const cx = ctx();
    const w = c.width, h = c.height;
    cx.clearRect(0, 0, w, h);

    // Background grid
    cx.strokeStyle = 'rgba(255,255,255,0.04)';
    cx.lineWidth = 1;
    for (let i = 0; i < w; i += 60) { cx.beginPath(); cx.moveTo(i, 0); cx.lineTo(i, h); cx.stroke(); }
    for (let i = 0; i < h; i += 40) { cx.beginPath(); cx.moveTo(0, i); cx.lineTo(w, i); cx.stroke(); }

    if (gameState === 'waiting') {
      cx.fillStyle = '#557086'; cx.font = 'bold 20px sans-serif';
      cx.textAlign = 'center'; cx.fillText('Waiting for next round...', w / 2, h / 2);
      return;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    const points = [];
    const maxX = Math.max(elapsed, 3);

    for (let t = 0; t <= elapsed; t += 0.05) {
      const m = Math.pow(Math.E, 0.12 * t);
      const x = (t / maxX) * (w - 40) + 20;
      const y = h - 30 - ((m - 1) / (multiplier - 1 || 0.001)) * (h - 60);
      points.push({ x, y });
    }

    if (points.length > 1) {
      const color = gameState === 'crashed' ? '#f04444' : '#00e701';
      cx.beginPath();
      cx.moveTo(points[0].x, points[0].y);
      points.forEach(p => cx.lineTo(p.x, p.y));
      cx.strokeStyle = color; cx.lineWidth = 3; cx.stroke();

      // Fill gradient under curve
      cx.lineTo(points[points.length - 1].x, h - 30);
      cx.lineTo(points[0].x, h - 30);
      cx.closePath();
      const grad = cx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = grad; cx.fill();
    }

    // Axis labels
    cx.fillStyle = '#557086'; cx.font = '11px sans-serif'; cx.textAlign = 'left';
    cx.fillText('1.00x', 4, h - 12);
    cx.textAlign = 'right';
    cx.fillText(multiplier.toFixed(2) + 'x', w - 4, 20);
  }

  function updateMultiplierDisplay() {
    const el = document.getElementById('crashMultiplierDisplay');
    if (!el) return;
    el.textContent = multiplier.toFixed(2) + 'x';
    el.className = 'crash-multiplier-display' + (gameState === 'crashed' ? ' crashed' : '');
  }

  function gameLoop() {
    if (gameState !== 'running') return;
    const elapsed = (Date.now() - startTime) / 1000;
    multiplier = parseFloat(Math.pow(Math.E, 0.12 * elapsed).toFixed(2));

    if (multiplier >= crashPoint) {
      multiplier = crashPoint;
      gameState = 'crashed';
      updateMultiplierDisplay();
      draw();
      if (betPlaced && !cashedOut) {
        showResult(false, betAmount, 0);
        addLiveBet('Crash', betAmount, 0, false);
      }
      addCrashHistory(crashPoint);
      betPlaced = false; cashedOut = false;
      document.getElementById('crashBetBtn').disabled = false;
      document.getElementById('crashBetBtn').textContent = 'Place Bet';
      document.getElementById('crashCashBtn').disabled = true;
      setTimeout(() => startRound(), 3000);
      return;
    }

    updateMultiplierDisplay();
    draw();
    animFrame = requestAnimationFrame(gameLoop);
  }

  function startRound() {
    gameState = 'waiting';
    multiplier = 1.0;
    cashedOut = false;
    crashPoint = generateCrashPoint();
    updateMultiplierDisplay();
    draw();
    setTimeout(() => {
      gameState = 'running';
      startTime = Date.now();
      gameLoop();
    }, 2000);
  }

  function placeBet() {
    if (gameState !== 'waiting' && gameState !== 'crashed') {
      showToast('Wait for next round', 'lose'); return;
    }
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet; betPlaced = true; cashedOut = false;
    document.getElementById('crashBetBtn').disabled = true;
    document.getElementById('crashBetBtn').textContent = 'Bet Placed ✓';
    document.getElementById('crashCashBtn').disabled = false;
    showToast('Bet placed! Cash out before it crashes!', 'info');
  }

  function cashOut() {
    if (gameState !== 'running' || !betPlaced || cashedOut) return;
    cashedOut = true;
    const winAmount = betAmount * multiplier;
    addBalance(winAmount);
    showResult(true, winAmount - betAmount, multiplier);
    addLiveBet('Crash', betAmount, multiplier, true);
    document.getElementById('crashCashBtn').disabled = true;
  }

  function addCrashHistory(point) {
    history.unshift(point);
    if (history.length > 10) history.pop();
    const el = document.getElementById('crashHistory');
    if (!el) return;
    el.innerHTML = history.map(p => {
      let cls = p < 1.5 ? 'low' : p < 5 ? 'mid' : p < 15 ? 'high' : 'mega';
      return `<span class="crash-chip ${cls}">${p.toFixed(2)}x</span>`;
    }).join('');
  }

  function init() {
    const c = canvas();
    if (c) { c.width = c.offsetWidth || 560; c.height = 300; }
    document.getElementById('crashBetBtn').addEventListener('click', placeBet);
    document.getElementById('crashCashBtn').addEventListener('click', cashOut);
    document.getElementById('crashCashBtn').disabled = true;
    startRound();
  }

  return { init };
})();
