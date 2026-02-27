// ===== LIMBO GAME =====
const LimboGame = (() => {
  let animating = false;

  function houseEdge() { return 0.99; }
  function maxMultiplier() { return 1000000; }

  function roll() {
    if (animating) return;
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }

    const target = parseFloat(document.getElementById('limboTarget').value) || 2;
    if (target < 1.01) {
      showToast('Target must be at least 1.01x', 'lose');
      addBalance(bet); return;
    }

    animating = true;
    document.getElementById('limboBetBtn').disabled = true;

    const result = generateResult();
    const win = result >= target;

    // Animate the number counting up
    const el = document.getElementById('limboValue');
    el.className = 'limbo-value limbo-growing';
    let displayed = 1.0;
    const animDuration = 800;
    const startTime = Date.now();

    function step() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / animDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      displayed = 1 + (result - 1) * ease;
      el.textContent = displayed.toFixed(2) + 'x';
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = result.toFixed(2) + 'x';
        el.className = 'limbo-value ' + (win ? 'win' : 'lose');
        const multi = parseFloat((houseEdge() / (1 / target)).toFixed(4));
        if (win) {
          addBalance(bet * multi);
          showResult(true, bet * multi - bet, multi);
        } else {
          showResult(false, bet, 0);
        }
        addLiveBet('Limbo', bet, win ? multi : 0, win);
        document.getElementById('limboWinChance').textContent = parseFloat((houseEdge() / target * 100).toFixed(4)) + '%';
        animating = false;
        document.getElementById('limboBetBtn').disabled = false;
      }
    }
    requestAnimationFrame(step);
  }

  function generateResult() {
    // Provably fair style: geometric distribution
    const r = Math.random();
    if (r === 0) return maxMultiplier();
    const result = houseEdge() / r;
    return Math.min(parseFloat(result.toFixed(2)), maxMultiplier());
  }

  function updateWinChance() {
    const target = parseFloat(document.getElementById('limboTarget').value) || 2;
    const chance = Math.min(99.99, parseFloat((houseEdge() / target * 100).toFixed(4)));
    document.getElementById('limboWinChance').textContent = chance + '%';
    const bet = getBetAmount();
    const multi = parseFloat((houseEdge() / (1 / Math.max(target, 1.01))).toFixed(4));
    document.getElementById('limboPayout').textContent = '$' + (bet * multi).toFixed(2);
  }

  function init() {
    document.getElementById('limboBetBtn').addEventListener('click', roll);
    document.getElementById('limboTarget').addEventListener('input', updateWinChance);
    document.querySelector('#limboView .bet-input')?.addEventListener('input', updateWinChance);
    updateWinChance();
  }

  return { init };
})();
