// ===== HILO GAME =====
const HiloGame = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RANK_VALUES = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

  let deck = [];
  let currentCard = null;
  let history = [];
  let gameActive = false;
  let betAmount = 0;
  let multiplier = 1;

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

  function cardValue(card) { return RANK_VALUES[card.rank]; }

  function calcMultiplier(guessHigher, currentVal) {
    // Probability based multiplier
    const cardsLeft = 52;
    let favorable;
    if (guessHigher) {
      favorable = RANKS.filter(r => RANK_VALUES[r] > currentVal).length * 4;
    } else {
      favorable = RANKS.filter(r => RANK_VALUES[r] < currentVal).length * 4;
    }
    const prob = Math.max(favorable / cardsLeft, 0.05);
    return parseFloat((0.99 / prob).toFixed(4));
  }

  function winChance(guessHigher, currentVal) {
    const cardsLeft = 52;
    let favorable;
    if (guessHigher) {
      favorable = RANKS.filter(r => RANK_VALUES[r] > currentVal).length * 4;
    } else {
      favorable = RANKS.filter(r => RANK_VALUES[r] < currentVal).length * 4;
    }
    return parseFloat(((favorable / cardsLeft) * 100).toFixed(2));
  }

  function renderCard(card, small = false) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const cls = small ? 'playing-card small' : 'playing-card';
    return `<div class="${cls} ${isRed ? 'card-red' : 'card-black'}">
      <div class="pc-rank-top">${card.rank}</div>
      <div class="pc-suit-center">${card.suit}</div>
      <div class="pc-rank-bot">${card.rank}</div>
    </div>`;
  }

  function updateStats() {
    const hiChance = currentCard ? winChance(true, cardValue(currentCard)) : 0;
    const loChance = currentCard ? winChance(false, cardValue(currentCard)) : 0;
    const hiMulti = currentCard ? calcMultiplier(true, cardValue(currentCard)) : 0;
    const loMulti = currentCard ? calcMultiplier(false, cardValue(currentCard)) : 0;

    const wc = document.getElementById('hiloWinChance');
    const mc = document.getElementById('hiloMultiplier');
    const profit = document.getElementById('hiloProfit');
    const totalMulti = document.getElementById('hiloTotalMulti');
    if (wc) wc.textContent = gameActive ? hiChance.toFixed(2) + '%' : '—';
    if (mc) mc.textContent = gameActive ? hiMulti.toFixed(4) + 'x' : '—';
    if (profit) profit.textContent = gameActive ? '$' + ((betAmount * multiplier) - betAmount).toFixed(2) : '—';
    if (totalMulti) totalMulti.textContent = multiplier.toFixed(4) + 'x';

    // Update button labels
    const hiBtn = document.getElementById('hiloHighBtn');
    const loBtn = document.getElementById('hiloLowBtn');
    if (hiBtn) hiBtn.textContent = gameActive ? `Higher (${hiMulti.toFixed(2)}x)` : 'Higher';
    if (loBtn) loBtn.textContent = gameActive ? `Lower (${loMulti.toFixed(2)}x)` : 'Lower';
  }

  function renderDisplay() {
    const cardEl = document.getElementById('hiloCurrentCard');
    if (cardEl && currentCard) {
      cardEl.innerHTML = renderCard(currentCard);
    }
    const histEl = document.getElementById('hiloHistory');
    if (histEl) {
      histEl.innerHTML = history.slice(-8).map(c => renderCard(c, true)).join('');
    }
    updateStats();
  }

  function startGame() {
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet;
    multiplier = 1;
    history = [];
    deck = createDeck();
    currentCard = drawCard();
    gameActive = true;

    document.getElementById('hiloDealBtn').textContent = 'New Game';
    document.getElementById('hiloHighBtn').disabled = false;
    document.getElementById('hiloLowBtn').disabled = false;
    document.getElementById('hiloSkipBtn').disabled = false;
    document.getElementById('hiloCashBtn').disabled = false;
    renderDisplay();
  }

  function guess(higher) {
    if (!gameActive || !currentCard) return;
    const nextCard = drawCard();
    const currVal = cardValue(currentCard);
    const nextVal = cardValue(nextCard);
    const multi = calcMultiplier(higher, currVal);

    history.push(currentCard);
    currentCard = nextCard;

    const correct = higher ? nextVal > currVal : nextVal < currVal;

    if (correct) {
      multiplier *= multi;
      renderDisplay();
      showToast(`✅ Correct! ${multi.toFixed(2)}x`, 'win');
    } else {
      // Lost
      const lost = betAmount;
      gameActive = false;
      renderDisplay();
      showResult(false, lost, 0);
      addLiveBet('Hilo', lost, 0, false);
      endButtons();
    }
  }

  function skip() {
    if (!gameActive || !currentCard) return;
    const nextCard = drawCard();
    history.push(currentCard);
    currentCard = nextCard;
    renderDisplay();
    showToast('Skipped card', 'neutral');
  }

  function cashOut() {
    if (!gameActive) return;
    const win = betAmount * multiplier;
    addBalance(win);
    gameActive = false;
    showResult(true, win - betAmount, multiplier);
    addLiveBet('Hilo', betAmount, multiplier, true);
    endButtons();
    renderDisplay();
  }

  function endButtons() {
    document.getElementById('hiloDealBtn').textContent = 'Deal';
    document.getElementById('hiloHighBtn').disabled = true;
    document.getElementById('hiloLowBtn').disabled = true;
    document.getElementById('hiloSkipBtn').disabled = true;
    document.getElementById('hiloCashBtn').disabled = true;
  }

  function init() {
    deck = createDeck();
    renderDisplay();
    endButtons();
    document.getElementById('hiloDealBtn').addEventListener('click', startGame);
    document.getElementById('hiloHighBtn').addEventListener('click', () => guess(true));
    document.getElementById('hiloLowBtn').addEventListener('click', () => guess(false));
    document.getElementById('hiloSkipBtn').addEventListener('click', skip);
    document.getElementById('hiloCashBtn').addEventListener('click', cashOut);
  }

  return { init };
})();
