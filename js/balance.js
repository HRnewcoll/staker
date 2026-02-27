// Balance management using localStorage
const STARTING_BALANCE = 1000;
const BALANCE_KEY = 'staker_balance';

function getBalance() {
  const val = localStorage.getItem(BALANCE_KEY);
  return val !== null ? parseFloat(val) : STARTING_BALANCE;
}

function setBalance(amount) {
  const rounded = Math.round(amount * 100) / 100;
  localStorage.setItem(BALANCE_KEY, rounded);
  updateBalanceDisplay();
  return rounded;
}

function addBalance(amount) {
  return setBalance(getBalance() + amount);
}

function deductBalance(amount) {
  const current = getBalance();
  if (amount > current) return false;
  setBalance(current - amount);
  return true;
}

function updateBalanceDisplay() {
  const el = document.getElementById('balanceAmount');
  if (el) el.textContent = getBalance().toFixed(2);
}

function getBetAmount() {
  const activeView = document.querySelector('.view.active');
  const el = (activeView && activeView.querySelector('.bet-input')) || document.querySelector('.bet-input');
  const val = parseFloat(el ? el.value : 0);
  return isNaN(val) || val <= 0 ? 0 : val;
}

function resetBalance() {
  setBalance(STARTING_BALANCE);
  showToast('Balance reset to $1,000.00', 'info');
}

// Toast notifications
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'win') toast.style.borderColor = '#00e701';
  if (type === 'lose') toast.style.borderColor = '#f04444';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showResult(win, amount, multiplier) {
  if (win) {
    showToast(`🎉 You won $${amount.toFixed(2)} (${multiplier.toFixed(2)}x)`, 'win');
  } else {
    showToast(`💔 You lost $${amount.toFixed(2)}`, 'lose');
  }
}
