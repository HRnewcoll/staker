// ===== MAIN APP =====

// Live bets simulation
const FAKE_USERS = ['CryptoKing', 'LuckyAce', 'DiamondHands', 'MoonShot', 'WhaleBet', 'StackSats', 'NightOwl', 'FastCash', 'BigWinner', 'RollHigh'];
const FAKE_GAMES = ['Dice', 'Crash', 'Mines', 'Plinko', 'Wheel', 'Limbo', 'Slots', 'Roulette', 'Blackjack', 'Keno', 'Hilo', 'Dragon Tower', 'Video Poker', 'Baccarat'];
let liveBets = [];

function addLiveBet(game, amount, multiplier, win) {
  const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
  liveBets.unshift({
    user,
    game,
    amount: parseFloat(amount.toFixed(2)),
    multiplier: parseFloat((multiplier || 0).toFixed(2)),
    win,
    profit: win ? parseFloat((amount * (multiplier || 0) - amount).toFixed(2)) : parseFloat((-amount).toFixed(2))
  });
  if (liveBets.length > 20) liveBets.pop();
  renderLiveBets();
}

function renderLiveBets() {
  const tbody = document.getElementById('liveBetsBody');
  if (!tbody) return;
  tbody.innerHTML = liveBets.slice(0, 12).map(b => `
    <tr>
      <td class="bet-user">${b.user}</td>
      <td class="bet-game">${b.game}</td>
      <td class="bet-amount">$${b.amount.toFixed(2)}</td>
      <td class="bet-multi ${b.win ? 'win' : 'lose'}">${b.multiplier > 0 ? b.multiplier.toFixed(2) + 'x' : '-'}</td>
      <td class="bet-profit ${b.win ? 'win' : 'lose'}">${b.profit > 0 ? '+' : ''}$${b.profit.toFixed(2)}</td>
    </tr>
  `).join('');
}

// Simulate other users betting
function simulateLiveBets() {
  setInterval(() => {
    const game = FAKE_GAMES[Math.floor(Math.random() * FAKE_GAMES.length)];
    const amount = parseFloat((Math.random() * 50 + 0.5).toFixed(2));
    const win = Math.random() > 0.45;
    const multi = win ? parseFloat((1.5 + Math.random() * 8).toFixed(2)) : 0;
    addLiveBet(game, amount, multi, win);
  }, 1500);
}

// Navigation
let currentGame = null;
const gameInitMap = {
  dice: DiceGame,
  crash: CrashGame,
  mines: MinesGame,
  plinko: PlinkoGame,
  wheel: WheelGame,
  limbo: LimboGame,
  slots: SlotsGame,
  roulette: RouletteGame,
  blackjack: BlackjackGame,
  keno: KenoGame,
  hilo: HiloGame,
  dragontower: DragonTowerGame,
  videopoker: VideoPokerGame,
  baccarat: BaccaratGame,
};
const initializedGames = new Set();

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId + 'View');
  if (view) view.classList.add('active');

  // Update sidebar
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewId);
  });

  // Init game on first open
  if (gameInitMap[viewId] && !initializedGames.has(viewId)) {
    initializedGames.add(viewId);
    // Small delay to let DOM render
    setTimeout(() => {
      try { gameInitMap[viewId].init(); } catch(e) { console.error('Game init error:', e); }
    }, 50);
  }

  currentGame = viewId;
}

function setupQuickBtns() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.bet-panel');
      const input = panel ? panel.querySelector('.bet-input') : null;
      if (!input) return;
      const action = btn.dataset.action;
      const current = parseFloat(input.value) || 0;
      if (action === '2x') input.value = (current * 2).toFixed(2);
      else if (action === '½') input.value = Math.max(0.01, current / 2).toFixed(2);
      else if (action === 'max') input.value = getBalance().toFixed(2);
      else if (action === 'min') input.value = '0.10';
      input.dispatchEvent(new Event('input'));
    });
  });
}

function setupSidebar() {
  document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
    item.addEventListener('click', () => showView(item.dataset.view));
  });
}

function setupGameCards() {
  document.querySelectorAll('.game-card[data-view]').forEach(card => {
    card.addEventListener('click', () => showView(card.dataset.view));
  });
}

function updateOnlineCount() {
  const el = document.getElementById('onlineCount');
  if (el) {
    const base = 12847;
    el.textContent = (base + Math.floor(Math.random() * 200 - 100)).toLocaleString();
  }
}

function setupGameSearch() {
  const input = document.getElementById('gameSearch');
  if (!input) return;
  const cards = document.querySelectorAll('.game-card');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    cards.forEach(card => {
      const title = card.querySelector('.game-card-title');
      const match = !q || (title && title.textContent.toLowerCase().includes(q));
      card.style.display = match ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateBalanceDisplay();
  setupSidebar();
  setupGameCards();
  setupQuickBtns();
  setupGameSearch();
  simulateLiveBets();
  showView('lobby');
  setInterval(updateOnlineCount, 5000);

  // Reset balance button
  document.getElementById('resetBalanceBtn')?.addEventListener('click', resetBalance);
});
