// ===== VIDEO POKER GAME (Jacks or Better) =====
const VideoPokerGame = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14 };

  const PAYTABLE = [
    { name: 'Royal Flush',    multi: 800, emoji: '👑' },
    { name: 'Straight Flush', multi: 50,  emoji: '🔥' },
    { name: 'Four of a Kind', multi: 25,  emoji: '💎' },
    { name: 'Full House',     multi: 9,   emoji: '🏠' },
    { name: 'Flush',          multi: 6,   emoji: '🌊' },
    { name: 'Straight',       multi: 4,   emoji: '➡️' },
    { name: 'Three of a Kind',multi: 3,   emoji: '3️⃣' },
    { name: 'Two Pair',       multi: 2,   emoji: '2️⃣' },
    { name: 'Jacks or Better',multi: 1,   emoji: '🃏' },
  ];

  let deck = [];
  let hand = [];
  let held = [false, false, false, false, false];
  let gameState = 'idle'; // idle, dealt, drawn
  let betAmount = 0;

  function createDeck() {
    const d = [];
    SUITS.forEach(s => RANKS.forEach(r => d.push({ suit: s, rank: r })));
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function drawCard() {
    if (deck.length < 5) deck = createDeck();
    return deck.pop();
  }

  function rankVal(card) { return RANK_VALUES[card.rank]; }

  function evaluateHand(cards) {
    const ranks = cards.map(c => rankVal(c)).sort((a, b) => a - b);
    const suits = cards.map(c => c.suit);
    const rankCounts = {};
    ranks.forEach(r => { rankCounts[r] = (rankCounts[r] || 0) + 1; });
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = (ranks[4] - ranks[0] === 4 && counts[0] === 1) ||
                       (ranks.join(',') === '2,3,4,5,14'); // A-2-3-4-5
    const isRoyal = isFlush && ranks.join(',') === '10,11,12,13,14';

    if (isRoyal) return 'Royal Flush';
    if (isFlush && isStraight) return 'Straight Flush';
    if (counts[0] === 4) return 'Four of a Kind';
    if (counts[0] === 3 && counts[1] === 2) return 'Full House';
    if (isFlush) return 'Flush';
    if (isStraight) return 'Straight';
    if (counts[0] === 3) return 'Three of a Kind';
    if (counts[0] === 2 && counts[1] === 2) return 'Two Pair';
    // Jacks or Better: one pair of J, Q, K, or A
    if (counts[0] === 2) {
      const pairKey = Object.keys(rankCounts).find(r => rankCounts[r] === 2);
      if (pairKey && parseInt(pairKey) >= 11) return 'Jacks or Better';
    }
    return null;
  }

  function getMultiplier(handName) {
    const entry = PAYTABLE.find(p => p.name === handName);
    return entry ? entry.multi : 0;
  }

  function renderCard(card, index) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const holdClass = held[index] ? 'card-hold' : '';
    return `<div class="vp-card ${isRed ? 'card-red' : 'card-black'} ${holdClass}" data-index="${index}">
      <div class="pc-rank-top">${card.rank}</div>
      <div class="pc-suit-center">${card.suit}</div>
      <div class="pc-rank-bot">${card.rank}</div>
    </div>`;
  }

  function renderHand() {
    const handEl = document.getElementById('vpHand');
    if (!handEl) return;
    if (hand.length === 0) {
      handEl.innerHTML = [0,1,2,3,4].map(i => `<div class="vp-card card-back"></div>`).join('');
    } else {
      handEl.innerHTML = hand.map((c, i) => renderCard(c, i)).join('');
    }
    // Attach hold listeners
    handEl.querySelectorAll('.vp-card:not(.card-back)').forEach(el => {
      el.addEventListener('click', () => {
        if (gameState !== 'dealt') return;
        const idx = parseInt(el.dataset.index);
        held[idx] = !held[idx];
        renderHand();
      });
    });
    // Render hold buttons
    const holdRow = document.getElementById('vpHoldRow');
    if (holdRow) {
      holdRow.innerHTML = [0,1,2,3,4].map(i =>
        `<button class="vp-hold-btn ${held[i] ? 'held' : ''}" data-i="${i}" ${gameState !== 'dealt' ? 'disabled' : ''}>${held[i] ? 'HELD' : 'HOLD'}</button>`
      ).join('');
      holdRow.querySelectorAll('.vp-hold-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (gameState !== 'dealt') return;
          const idx = parseInt(btn.dataset.i);
          held[idx] = !held[idx];
          renderHand();
        });
      });
    }
  }

  function renderPaytable(winName = null) {
    const el = document.getElementById('vpPaytable');
    if (!el) return;
    el.innerHTML = PAYTABLE.map(p => `
      <div class="vp-pay-row ${p.name === winName ? 'highlight' : ''}">
        <span>${p.emoji} ${p.name}</span>
        <span class="vp-pay-multi">${p.multi}x</span>
      </div>
    `).join('');
  }

  function deal() {
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet;
    deck = createDeck();
    hand = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
    held = [false, false, false, false, false];
    gameState = 'dealt';
    document.getElementById('vpDealBtn').textContent = 'Draw';
    document.getElementById('vpResult').textContent = '';
    renderHand();
    renderPaytable();
  }

  function draw() {
    // Replace non-held cards
    for (let i = 0; i < 5; i++) {
      if (!held[i]) hand[i] = drawCard();
    }
    gameState = 'drawn';
    held = [false, false, false, false, false];

    const handName = evaluateHand(hand);
    const multi = getMultiplier(handName);
    const win = betAmount * multi;

    renderHand();
    renderPaytable(handName);

    const resultEl = document.getElementById('vpResult');
    if (win > 0) {
      addBalance(win);
      showResult(true, win - betAmount, multi);
      addLiveBet('Video Poker', betAmount, multi, true);
      if (resultEl) { resultEl.textContent = `🎉 ${handName}! +$${(win - betAmount).toFixed(2)}`; resultEl.className = 'vp-result win'; }
    } else {
      showResult(false, betAmount, 0);
      addLiveBet('Video Poker', betAmount, 0, false);
      if (resultEl) { resultEl.textContent = handName ? `${handName} — No payout` : '💔 No win'; resultEl.className = 'vp-result lose'; }
    }
    document.getElementById('vpDealBtn').textContent = 'Deal';
  }

  function handleDealDraw() {
    if (gameState === 'idle' || gameState === 'drawn') deal();
    else if (gameState === 'dealt') draw();
  }

  function init() {
    deck = createDeck();
    renderHand();
    renderPaytable();
    document.getElementById('vpDealBtn').addEventListener('click', handleDealDraw);
  }

  return { init };
})();
