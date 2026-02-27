// ===== BACCARAT GAME =====
const BaccaratGame = (() => {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  let deck = [];
  let playerHand = [], bankerHand = [];
  let selectedBet = null; // 'player' | 'banker' | 'tie'
  let betAmount = 0;
  let gameState = 'idle';

  function createDeck() {
    const d = [];
    for (let i = 0; i < 8; i++) {
      SUITS.forEach(s => RANKS.forEach(r => d.push({ suit: s, rank: r })));
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function drawCard() {
    if (deck.length < 10) deck = createDeck();
    return deck.pop();
  }

  function cardValue(card) {
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
    if (card.rank === 'A') return 1;
    return parseInt(card.rank);
  }

  function handTotal(hand) {
    return hand.reduce((sum, c) => sum + cardValue(c), 0) % 10;
  }

  function renderCardEl(card) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `<div class="playing-card ${isRed ? 'card-red' : 'card-black'} card-deal">
      <div class="pc-rank-top">${card.rank}</div>
      <div class="pc-suit-center">${card.suit}</div>
      <div class="pc-rank-bot">${card.rank}</div>
    </div>`;
  }

  function renderHands(resultMsg = '') {
    const ph = document.getElementById('bacPlayerHand');
    const bh = document.getElementById('bacBankerHand');
    const ps = document.getElementById('bacPlayerScore');
    const bs = document.getElementById('bacBankerScore');
    const res = document.getElementById('bacResult');

    if (ph) ph.innerHTML = playerHand.map(renderCardEl).join('');
    if (bh) bh.innerHTML = bankerHand.map(renderCardEl).join('');
    if (ps) ps.textContent = handTotal(playerHand);
    if (bs) bs.textContent = handTotal(bankerHand);

    if (res) {
      res.textContent = resultMsg;
      res.className = 'bac-result ' + (resultMsg.includes('WIN') ? 'win' : resultMsg.includes('TIE') ? 'push' : resultMsg ? 'lose' : '');
    }
  }

  function shouldPlayerDraw(pTotal) { return pTotal <= 5; }

  function shouldBankerDraw(bTotal, pTotal, playerDrewCard) {
    if (!playerDrewCard) return bTotal <= 5;
    const pThird = playerDrewCard;
    if (bTotal <= 2) return true;
    if (bTotal === 3) return pThird !== 8;
    if (bTotal === 4) return [2, 3, 4, 5, 6, 7].includes(pThird);
    if (bTotal === 5) return [4, 5, 6, 7].includes(pThird);
    if (bTotal === 6) return [6, 7].includes(pThird);
    return false;
  }

  function dealGame() {
    if (!selectedBet) { showToast('Choose Player, Banker, or Tie', 'lose'); return; }
    const bet = getBetAmount();
    if (!bet || bet <= 0) { showToast('Enter a valid bet', 'lose'); return; }
    if (!deductBalance(bet)) { showToast('Insufficient balance', 'lose'); return; }
    betAmount = bet;
    gameState = 'playing';

    playerHand = [drawCard(), drawCard()];
    bankerHand = [drawCard(), drawCard()];

    let pTotal = handTotal(playerHand);
    let bTotal = handTotal(bankerHand);

    // Natural: 8 or 9 — no more cards
    if (pTotal < 8 && bTotal < 8) {
      let pThirdVal = null;
      if (shouldPlayerDraw(pTotal)) {
        const pThird = drawCard();
        playerHand.push(pThird);
        pThirdVal = cardValue(pThird);
        pTotal = handTotal(playerHand);
      }
      bTotal = handTotal(bankerHand);
      if (shouldBankerDraw(bTotal, pTotal, pThirdVal)) {
        bankerHand.push(drawCard());
        bTotal = handTotal(bankerHand);
      }
    }

    const pFinal = handTotal(playerHand);
    const bFinal = handTotal(bankerHand);

    let winner = pFinal > bFinal ? 'player' : bFinal > pFinal ? 'banker' : 'tie';
    let win = 0;
    let resultMsg = '';

    if (winner === 'tie') {
      if (selectedBet === 'tie') { win = betAmount * 9; resultMsg = '🤝 TIE! 8:1 WIN!'; }
      else { win = betAmount; resultMsg = '🤝 TIE — Bet returned'; }
    } else if (winner === selectedBet) {
      if (selectedBet === 'banker') { win = betAmount + betAmount * 0.95; resultMsg = '🎉 BANKER WINS!'; }
      else { win = betAmount * 2; resultMsg = '🎉 PLAYER WINS!'; }
    } else {
      resultMsg = winner === 'banker' ? '🏦 Banker Wins' : '👤 Player Wins';
    }

    renderHands(resultMsg);

    if (win > 0) {
      addBalance(win);
      if (win !== betAmount) showResult(true, win - betAmount, win / betAmount);
    } else {
      showResult(false, betAmount, 0);
    }
    addLiveBet('Baccarat', betAmount, win > 0 ? win / betAmount : 0, win > betAmount);
    gameState = 'idle';
    document.getElementById('bacDealBtn').disabled = false;
  }

  function selectBet(type) {
    selectedBet = type;
    ['bacBetPlayer', 'bacBetTie', 'bacBetBanker'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const map = { player: 'bacBetPlayer', tie: 'bacBetTie', banker: 'bacBetBanker' };
    const el = document.getElementById(map[type]);
    if (el) el.classList.add('active');
    const statEl = document.getElementById('bacSelectedBet');
    if (statEl) statEl.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  }

  function init() {
    deck = createDeck();
    renderHands();
    document.getElementById('bacDealBtn').addEventListener('click', dealGame);
    document.getElementById('bacBetPlayer').addEventListener('click', () => selectBet('player'));
    document.getElementById('bacBetTie').addEventListener('click', () => selectBet('tie'));
    document.getElementById('bacBetBanker').addEventListener('click', () => selectBet('banker'));
  }

  return { init };
})();
