// ===== WHEEL GAME =====
const WheelGame = (() => {
  const SEGMENTS = [
    { label: '0', color: '#1a6b2a', multi: 0 },
    { label: '1.5x', color: '#1a3a5f', multi: 1.5 },
    { label: '1.5x', color: '#1a3a5f', multi: 1.5 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
    { label: '2x', color: '#1a3a5f', multi: 2 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
    { label: '3x', color: '#2a1a4f', multi: 3 },
    { label: '1.5x', color: '#1a3a5f', multi: 1.5 },
    { label: '2x', color: '#1a3a5f', multi: 2 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
    { label: '4x', color: '#3a1a1a', multi: 4 },
    { label: '1.5x', color: '#1a3a5f', multi: 1.5 },
    { label: '2x', color: '#1a3a5f', multi: 2 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
    { label: '0', color: '#1a6b2a', multi: 0 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
    { label: '2x', color: '#1a3a5f', multi: 2 },
    { label: '1.5x', color: '#1a3a5f', multi: 1.5 },
    { label: '10x', color: '#4a1a0a', multi: 10 },
    { label: '1.5x', color: '#2f4553', multi: 1.5 },
  ];

  let spinning = false;
  let currentAngle = 0;
  let animId = null;

  function draw(canvas, angle) {
    const cx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx0 = w / 2, cy0 = h / 2, r = Math.min(w, h) / 2 - 4;
    const segAngle = (Math.PI * 2) / SEGMENTS.length;

    cx.clearRect(0, 0, w, h);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = angle + i * segAngle;
      const endAngle = startAngle + segAngle;

      cx.beginPath();
      cx.moveTo(cx0, cy0);
      cx.arc(cx0, cy0, r, startAngle, endAngle);
      cx.closePath();
      cx.fillStyle = seg.color; cx.fill();
      cx.strokeStyle = '#0f212e'; cx.lineWidth = 2; cx.stroke();

      // Label
      const midAngle = startAngle + segAngle / 2;
      const lx = cx0 + (r * 0.7) * Math.cos(midAngle);
      const ly = cy0 + (r * 0.7) * Math.sin(midAngle);
      cx.save(); cx.translate(lx, ly); cx.rotate(midAngle + Math.PI / 2);
      cx.fillStyle = '#fff'; cx.font = 'bold 11px sans-serif'; cx.textAlign = 'center';
      cx.fillText(seg.label, 0, 0);
      cx.restore();
    });

    // Center circle
    cx.beginPath(); cx.arc(cx0, cy0, 18, 0, Math.PI * 2);
    cx.fillStyle = '#1a2c3a'; cx.fill();
    cx.strokeStyle = '#2f4553'; cx.lineWidth = 3; cx.stroke();
  }

  function spin(bet, canvas) {
    if (spinning) return;
    spinning = true;
    document.getElementById('wheelSpinBtn').disabled = true;

    const segAngle = (Math.PI * 2) / SEGMENTS.length;
    const extraSpins = (4 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    const resultIdx = Math.floor(Math.random() * SEGMENTS.length);
    const targetAngle = extraSpins + (Math.PI * 2 - resultIdx * segAngle - segAngle / 2 + Math.PI * 1.5);
    const startAngle = currentAngle;
    const duration = 4000;
    const startTime = Date.now();

    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

    function step() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      currentAngle = startAngle + targetAngle * easeOut(t);
      draw(canvas, currentAngle);
      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        spinning = false;
        const seg = SEGMENTS[resultIdx];
        if (seg.multi > 0) {
          addBalance(bet * seg.multi);
          showResult(true, bet * seg.multi - bet, seg.multi);
        } else {
          showResult(false, bet, 0);
        }
        addLiveBet('Wheel', bet, seg.multi, seg.multi > 0);
        document.getElementById('wheelResult').textContent = seg.multi > 0 ? seg.label : 'Miss!';
        document.getElementById('wheelResult').className = seg.multi > 0 ? 'stat-value green' : 'stat-value red';
        document.getElementById('wheelSpinBtn').disabled = false;
      }
    }
    animId = requestAnimationFrame(step);
  }

  function init() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    canvas.width = 340; canvas.height = 340;
    draw(canvas, 0);

    document.getElementById('wheelSpinBtn').addEventListener('click', () => {
      const bet = getBetAmount();
      if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
      if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
      spin(bet, canvas);
    });
  }

  return { init };
})();
