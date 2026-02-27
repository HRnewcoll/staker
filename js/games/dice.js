// ===== DICE GAME =====
const DiceGame = (() => {
  let isOver = true; // bet over or under
  let target = 50.0;
  let rolling = false;

  function getMultiplier(chance) {
    return parseFloat((0.99 / (chance / 100)).toFixed(4));
  }

  function updateStats() {
    const chance = isOver ? (100 - target) : target;
    const multi = getMultiplier(chance);
    document.getElementById('diceChance').textContent = chance.toFixed(2) + '%';
    document.getElementById('diceMultiplier').textContent = multi.toFixed(4) + 'x';
    const bet = getBetAmount();
    document.getElementById('dicePayout').textContent = '$' + (bet * multi).toFixed(2);

    // Update slider visuals
    const pct = target / 100;
    document.getElementById('diceTrackWin').style.width = (isOver ? (1 - pct) : pct) * 100 + '%';
    if (!isOver) document.getElementById('diceTrackWin').style.left = '0';
    else document.getElementById('diceTrackWin').style.left = pct * 100 + '%';
    document.getElementById('diceMarker').style.left = pct * 100 + '%';
    document.getElementById('diceTargetDisplay').textContent = target.toFixed(2);
  }

  function roll() {
    if (rolling) return;
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    rolling = true;
    document.getElementById('diceRollBtn').disabled = true;

    // Animate roll
    let frames = 0;
    const totalFrames = 15;
    const el = document.getElementById('diceRollValue');
    const anim = setInterval(() => {
      el.textContent = (Math.random() * 100).toFixed(2);
      frames++;
      if (frames >= totalFrames) {
        clearInterval(anim);
        const result = parseFloat((Math.random() * 100).toFixed(2));
        el.textContent = result.toFixed(2);
        const chance = isOver ? (100 - target) : target;
        const multi = getMultiplier(chance);
        const win = isOver ? (result > target) : (result < target);
        el.className = 'dice-roll-value ' + (win ? 'win' : 'lose');
        if (win) {
          addBalance(bet * multi);
          showResult(true, bet * multi - bet, multi);
        } else {
          showResult(false, bet, 0);
        }
        addLiveBet('Dice', bet, win ? multi : 0, win);
        rolling = false;
        document.getElementById('diceRollBtn').disabled = false;
      }
    }, 50);
  }

  function setOver(over) {
    isOver = over;
    document.getElementById('diceOverBtn').classList.toggle('active-mode', over);
    document.getElementById('diceUnderBtn').classList.toggle('active-mode', !over);
    updateStats();
  }

  function init() {
    updateStats();
    document.getElementById('diceTarget').addEventListener('input', (e) => {
      target = Math.min(98, Math.max(2, parseFloat(e.target.value) || 50));
      document.getElementById('diceTarget').value = target;
      updateStats();
    });
    document.querySelector('#diceView .bet-input')?.addEventListener('input', updateStats);
    document.getElementById('diceRollBtn').addEventListener('click', roll);
    document.getElementById('diceOverBtn').addEventListener('click', () => setOver(true));
    document.getElementById('diceUnderBtn').addEventListener('click', () => setOver(false));
  }

  return { init };
})();
