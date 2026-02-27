// ===== BLACKJACK GAME =====
const BlackjackGame = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  let deck = [];
  let playerHand = [], dealerHand = [];
  let gameState = 'idle'; // idle, playing, done
  let currentBet = 0;
  let doubled = false;

  function createDeck() {
    const d = [];
    SUITS.forEach(s => RANKS.forEach(r => d.push({ suit: s, rank: r })));
    // Shuffle 6 decks
    for (let i = 0; i < 6; i++) SUITS.forEach(s => RANKS.forEach(r => d.push({ suit: s, rank: r })));
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function dealCard(hide = false) {
    if (deck.length < 20) deck = createDeck();
    const card = deck.pop();
    card.hidden = hide;
    return card;
  }

  function cardValue(card) {
    if (card.hidden) return 0;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
  }

  function handTotal(hand) {
    let total = 0, aces = 0;
    hand.forEach(c => {
      if (c.hidden) return;
      total += cardValue(c);
      if (c.rank === 'A') aces++;
    });
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  }

  function isBust(hand) { return handTotal(hand) > 21; }
  function isBlackjack(hand) { return hand.length === 2 && handTotal(hand) === 21; }

  function renderCard(card) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    if (card.hidden) return `<div class="bj-card back"></div>`;
    return `<div class="bj-card ${isRed ? 'red-card' : ''}">
      <div class="bj-card-value">${card.rank}${card.suit}</div>
      <div class="bj-card-suit">${card.suit}</div>
    </div>`;
  }

  function render(showResult = '') {
    const ph = document.getElementById('playerHand');
    const dh = document.getElementById('dealerHand');
    const ps = document.getElementById('playerScore');
    const ds = document.getElementById('dealerScore');
    if (ph) ph.innerHTML = playerHand.map(renderCard).join('');
    if (dh) dh.innerHTML = dealerHand.map(renderCard).join('');
    if (ps) ps.textContent = handTotal(playerHand);
    if (ds) ds.textContent = handTotal(dealerHand.filter(c => !c.hidden));

    const actions = document.getElementById('bjActions');
    const startBtn = document.getElementById('bjStartBtn');
    const resultEl = document.getElementById('bjResult');

    if (actions) actions.style.display = gameState === 'playing' ? 'flex' : 'none';
    if (startBtn) startBtn.disabled = gameState === 'playing';

    if (resultEl) {
      if (showResult) {
        resultEl.textContent = showResult;
        resultEl.style.display = 'block';
        const isWin = showResult.includes('WIN') || showResult.includes('BLACKJACK');
        const isPush = showResult.includes('PUSH');
        resultEl.className = 'bj-result-banner ' + (isWin ? 'win' : isPush ? 'push' : 'lose');
      } else {
        resultEl.style.display = 'none';
      }
    }

    // Double button availability
    const doubleBtn = document.getElementById('bjDouble');
    if (doubleBtn) doubleBtn.disabled = playerHand.length !== 2 || doubled || getBalance() < currentBet;
  }

  function startGame() {
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    currentBet = bet; doubled = false;
    if (deck.length < 20) deck = createDeck();
    playerHand = [dealCard(), dealCard()];
    dealerHand = [dealCard(), dealCard(true)];
    gameState = 'playing';
    render();

    if (isBlackjack(playerHand)) {
      setTimeout(() => endGame(), 500);
    }
  }

  function hit() {
    if (gameState !== 'playing') return;
    playerHand.push(dealCard());
    render();
    if (isBust(playerHand)) { endGame(); }
    else if (handTotal(playerHand) === 21) { stand(); }
  }

  function stand() {
    if (gameState !== 'playing') return;
    // Reveal dealer hidden card
    dealerHand.forEach(c => { c.hidden = false; });
    render();
    // Dealer draws to 17
    const drawDealer = () => {
      if (handTotal(dealerHand) < 17) {
        setTimeout(() => { dealerHand.push(dealCard()); render(); drawDealer(); }, 500);
      } else {
        setTimeout(() => endGame(), 500);
      }
    };
    drawDealer();
  }

  function doubleDown() {
    if (gameState !== 'playing' || playerHand.length !== 2) return;
    if (!deductBalance(currentBet)) { showToast('Insufficient balance', 'lose'); return; }
    currentBet *= 2; doubled = true;
    playerHand.push(dealCard());
    render();
    if (isBust(playerHand)) { endGame(); } else { stand(); }
  }

  function endGame() {
    dealerHand.forEach(c => { c.hidden = false; });
    gameState = 'done';
    const pTotal = handTotal(playerHand);
    const dTotal = handTotal(dealerHand);
    const pBJ = isBlackjack(playerHand);
    const dBJ = isBlackjack(dealerHand);

    let result = '';
    let win = 0;

    if (isBust(playerHand)) {
      result = '💔 BUST - You Lose!';
    } else if (isBust(dealerHand)) {
      result = '🎉 Dealer Busts - WIN!';
      win = currentBet * 2;
    } else if (pBJ && !dBJ) {
      result = '🃏 BLACKJACK! 3:2 WIN!';
      win = currentBet * 2.5;
    } else if (dBJ && !pBJ) {
      result = '💔 Dealer Blackjack - Lose!';
    } else if (pTotal > dTotal) {
      result = '🎉 WIN!';
      win = currentBet * 2;
    } else if (pTotal === dTotal) {
      result = '🤝 PUSH - Tie!';
      win = currentBet;
    } else {
      result = '💔 Dealer Wins - Lose!';
    }

    if (win > 0) {
      addBalance(win);
      if (win !== currentBet) showResult(true, win - currentBet, win / currentBet);
    } else {
      showResult(false, currentBet, 0);
    }
    addLiveBet('Blackjack', currentBet, win > 0 ? win / currentBet : 0, win > currentBet);
    render(result);
    gameState = 'idle';
  }

  function init() {
    deck = createDeck();
    render();
    document.getElementById('bjStartBtn').addEventListener('click', startGame);
    document.getElementById('bjHit').addEventListener('click', hit);
    document.getElementById('bjStand').addEventListener('click', stand);
    document.getElementById('bjDouble').addEventListener('click', doubleDown);
  }

  return { init };
})();
