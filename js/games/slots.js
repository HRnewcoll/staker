// ===== SLOTS GAME =====
const SlotsGame = (() => {
  const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔', '🍀'];
  const PAYTABLE = {
    '🍒': { 3: 3, 2: 1.5 },
    '🍋': { 3: 4, 2: 1.8 },
    '🍊': { 3: 5 },
    '🍇': { 3: 8 },
    '⭐': { 3: 10 },
    '🔔': { 3: 15 },
    '🍀': { 3: 20 },
    '💎': { 3: 50 },
    '7️⃣': { 3: 100 },
  };
  const WEIGHTS = [18, 15, 14, 12, 8, 6, 5, 4, 2]; // cherry most common, 7 rarest

  let spinning = false;
  let reels = ['🍒', '🍋', '🍊'];

  function weightedRandom() {
    const total = WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SYMBOLS.length; i++) {
      r -= WEIGHTS[i];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[0];
  }

  function calcWin(bet, result) {
    const [a, b, c] = result;
    // Check 3 of a kind
    if (a === b && b === c) {
      const p = PAYTABLE[a];
      return p && p[3] ? bet * p[3] : 0;
    }
    // Check 2 of a kind (cherries/lemons)
    if (a === b || b === c || a === c) {
      const sym = (a === b) ? a : (b === c ? b : a);
      const p = PAYTABLE[sym];
      return p && p[2] ? bet * p[2] : 0;
    }
    return 0;
  }

  function spin() {
    if (spinning) return;
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }

    spinning = true;
    document.getElementById('slotsSpinBtn').disabled = true;
    document.getElementById('slotsResult').textContent = '';

    const finalResult = [weightedRandom(), weightedRandom(), weightedRandom()];
    const reelIds = ['reel0', 'reel1', 'reel2'];

    // Animate reels stopping one by one
    const animIntervals = reelIds.map((id, i) => {
      const el = document.getElementById(id);
      el.classList.add('spinning');
      const stopDelay = 600 + i * 400;
      const interval = setInterval(() => {
        el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }, 80);
      setTimeout(() => {
        clearInterval(interval);
        el.textContent = finalResult[i];
        el.classList.remove('spinning');
        if (i === 2) {
          // All done
          reels = finalResult;
          const win = calcWin(bet, finalResult);
          // Highlight matching reels
          if (finalResult[0] === finalResult[1] && finalResult[1] === finalResult[2]) {
            reelIds.forEach(rid => document.getElementById(rid).classList.add('win'));
          } else {
            reelIds.forEach(rid => document.getElementById(rid).classList.remove('win'));
          }
          if (win > 0) {
            addBalance(win);
            showResult(true, win - bet, win / bet);
            document.getElementById('slotsResult').textContent = `🎉 WIN: $${win.toFixed(2)}`;
            document.getElementById('slotsResult').style.color = '#00e701';
          } else {
            document.getElementById('slotsResult').textContent = `No win. Try again!`;
            document.getElementById('slotsResult').style.color = '#f04444';
          }
          addLiveBet('Slots', bet, win > 0 ? win / bet : 0, win > 0);
          spinning = false;
          document.getElementById('slotsSpinBtn').disabled = false;
        }
      }, stopDelay);
      return interval;
    });
  }

  function init() {
    // Set initial symbols
    ['reel0', 'reel1', 'reel2'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.textContent = reels[i];
    });
    document.getElementById('slotsSpinBtn').addEventListener('click', spin);
    // Build paytable display
    const pt = document.getElementById('slotsPaytable');
    if (pt) {
      pt.innerHTML = Object.entries(PAYTABLE).map(([sym, pays]) =>
        Object.entries(pays).map(([count, multi]) =>
          `<span class="payline-item">${sym.repeat(count === '3' ? 3 : 2)} = ${multi}x</span>`
        ).join('')
      ).join('');
    }
  }

  return { init };
})();
