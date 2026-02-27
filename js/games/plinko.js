// ===== PLINKO GAME =====
const PlinkoGame = (() => {
  const ROWS = 12;
  const MULTIPLIERS_MAP = {
    low:  [5.6,2.1,1.1,1,0.5,0.3,0.5,1,1.1,2.1,5.6],
    medium:[13,3,1.3,0.7,0.4,0.4,0.7,1.3,3,13],
    high: [29,4,1.5,0.3,0.2,0.3,1.5,4,29]
  };

  let balls = [];
  let pegs = [];
  let animId = null;
  let risk = 'medium';
  let dropping = false;

  function buildPegs(canvas) {
    pegs = [];
    const w = canvas.width, h = canvas.height;
    const startY = 60, pegGap = (h - startY - 60) / ROWS;
    for (let row = 0; row < ROWS; row++) {
      const count = row + 3;
      const rowWidth = (count - 1) * 36;
      const startX = (w - rowWidth) / 2;
      for (let col = 0; col < count; col++) {
        pegs.push({ x: startX + col * 36, y: startY + row * pegGap, r: 4 });
      }
    }
  }

  function dropBall(canvas) {
    const w = canvas.width;
    const startX = w / 2 + (Math.random() - 0.5) * 4;
    balls.push({ x: startX, y: 20, vx: (Math.random() - 0.5) * 1.5, vy: 2, radius: 7, alpha: 1, done: false, slot: -1 });
  }

  function getBuckets(canvas) {
    const mults = MULTIPLIERS_MAP[risk];
    const w = canvas.width, h = canvas.height;
    const bucketW = w / mults.length;
    return mults.map((m, i) => ({ x: i * bucketW, w: bucketW, m }));
  }

  function getSlotColor(m) {
    if (m >= 10) return '#c084fc';
    if (m >= 3) return '#f0a500';
    if (m >= 1) return '#00e701';
    return '#f04444';
  }

  function draw(canvas) {
    const cx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    cx.clearRect(0, 0, w, h);

    // Background
    cx.fillStyle = '#162532'; cx.fillRect(0, 0, w, h);

    // Draw pegs
    pegs.forEach(p => {
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = '#4a7a9b'; cx.fill();
    });

    // Draw buckets
    const buckets = getBuckets(canvas);
    buckets.forEach(b => {
      cx.fillStyle = getSlotColor(b.m);
      cx.fillRect(b.x + 1, h - 40, b.w - 2, 36);
      cx.fillStyle = '#fff'; cx.font = 'bold 10px sans-serif';
      cx.textAlign = 'center';
      cx.fillText(b.m + 'x', b.x + b.w / 2, h - 18);
    });

    // Update and draw balls
    balls.forEach(ball => {
      if (ball.done) return;
      ball.vy += 0.15; // gravity
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Peg collisions
      pegs.forEach(p => {
        const dx = ball.x - p.x, dy = ball.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ball.radius + p.r + 2) {
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.vx = Math.cos(angle) * speed * 0.7 + (Math.random() - 0.5) * 1.5;
          ball.vy = Math.abs(Math.sin(angle) * speed * 0.7) * -1 + 0.5;
          ball.y = p.y + (ball.radius + p.r + 2) * Math.sin(angle);
        }
      });

      // Wall bounce
      if (ball.x < ball.radius) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); }
      if (ball.x > w - ball.radius) { ball.x = w - ball.radius; ball.vx = -Math.abs(ball.vx); }

      // Land in bucket
      if (ball.y >= h - 44) {
        ball.done = true;
        const bw = w / buckets.length;
        const slotIdx = Math.min(Math.floor(ball.x / bw), buckets.length - 1);
        ball.slot = slotIdx;
      }

      // Draw ball
      cx.beginPath(); cx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      const grad = cx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.radius);
      grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#c084fc');
      cx.fillStyle = grad; cx.fill();
    });
  }

  function animate(canvas) {
    draw(canvas);
    const doneBalls = balls.filter(b => b.done);
    doneBalls.forEach(ball => {
      if (ball.slot >= 0) {
        const buckets = getBuckets(canvas);
        const m = buckets[ball.slot].m;
        const bet = ball.betAmount || 0;
        if (bet > 0) {
          if (m > 0) addBalance(bet * m);
          showResult(m >= 1, bet * m - bet, m);
          addLiveBet('Plinko', bet, m, m >= 1);
        }
        ball.slot = -1;
        balls = balls.filter(b => b !== ball);
        dropping = false;
        document.getElementById('plinkoBetBtn').disabled = false;
      }
    });
    animId = requestAnimationFrame(() => animate(canvas));
  }

  function init() {
    const canvas = document.getElementById('plinkoCanvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 420;
    canvas.height = 520;
    buildPegs(canvas);
    animate(canvas);

    document.getElementById('plinkoRisk').addEventListener('change', (e) => { risk = e.target.value; });
    document.getElementById('plinkoBetBtn').addEventListener('click', () => {
      if (dropping) return;
      const bet = getBetAmount();
      if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
      if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
      dropping = true;
      document.getElementById('plinkoBetBtn').disabled = true;
      const ball = { x: canvas.width / 2 + (Math.random() - 0.5) * 4, y: 20, vx: (Math.random() - 0.5) * 1.5, vy: 2, radius: 7, done: false, slot: -1, betAmount: bet };
      balls.push(ball);
    });
  }

  return { init };
})();
