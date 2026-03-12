// app.js - Dashboard logic for Parking Expense Tracker

// --- Utility Functions ---
function getHistory() {
  return JSON.parse(localStorage.getItem('history') || '[]');
}
function setHistory(history) {
  localStorage.setItem('history', JSON.stringify(history));
}
function getActiveParkingStart() {
  return localStorage.getItem('activeParkingStart');
}
function setActiveParkingStart(ts) {
  if (ts) localStorage.setItem('activeParkingStart', ts);
  else localStorage.removeItem('activeParkingStart');
}
function formatCurrency(val) {
  return '₹' + val;
}
function formatTimer(ms) {
  if (!ms || ms < 0) return '00:00:00';
  let s = Math.floor(ms / 1000);
  let h = Math.floor(s / 3600);
  let m = Math.floor((s % 3600) / 60);
  s = s % 60;
  return (
    (h < 10 ? '0' : '') + h + ':' +
    (m < 10 ? '0' : '') + m + ':' +
    (s < 10 ? '0' : '') + s
  );
}
function calcFee(minutes) {
  const hours = minutes / 60;
  if (hours <= 2) return 10;
  if (hours <= 8) return 20;
  if (hours <= 24) return 30;
  if (hours <= 48) return 60;
  if (hours <= 72) return 110;
  if (hours <= 96) return 170;
  // >96 hrs
  const extraDays = Math.ceil((hours - 96) / 24);
  return 170 + 70 * extraDays;
}
function getTotalExpense() {
  return getHistory().reduce((sum, e) => sum + (e.fee || 0), 0);
}

// --- DOM Elements ---
const totalExpenseEl = document.getElementById('totalExpense');
const liveTimerEl = document.getElementById('liveTimer');
const currentCostEl = document.getElementById('currentCost');
const mainActionBtn = document.getElementById('mainActionBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// --- State ---
let timerInterval = null;

// --- Functions ---
function updateDashboard() {
  // Update total expense
  totalExpenseEl.textContent = formatCurrency(getTotalExpense());
  // Update live timer and cost
  const start = getActiveParkingStart();
  if (start) {
    mainActionBtn.textContent = 'EXIT VEHICLE';
    mainActionBtn.classList.remove('park');
    mainActionBtn.classList.add('exit');
    mainActionBtn.style.background = '';
    updateLiveTimer();
    if (!timerInterval) timerInterval = setInterval(updateLiveTimer, 1000);
  } else {
    mainActionBtn.textContent = 'PARK VEHICLE';
    mainActionBtn.classList.remove('exit');
    mainActionBtn.classList.add('park');
    mainActionBtn.style.background = '';
    liveTimerEl.textContent = 'Not Parked';
    currentCostEl.textContent = formatCurrency(0);
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }
}
function updateLiveTimer() {
  const start = getActiveParkingStart();
  if (!start) return;
  const now = Date.now();
  const ms = now - parseInt(start);
  liveTimerEl.textContent = formatTimer(ms);
  const minutes = Math.ceil(ms / 60000);
  currentCostEl.textContent = formatCurrency(calcFee(minutes));
}
function startParking() {
  if (getActiveParkingStart()) return;
  setActiveParkingStart(Date.now().toString());
  updateDashboard();
}
function stopParking() {
  const start = getActiveParkingStart();
  if (!start) return;
  const end = Date.now();
  const durationMinutes = Math.ceil((end - parseInt(start)) / 60000);
  const fee = calcFee(durationMinutes);
  // Save to history
  const history = getHistory();
  history.unshift({
    start: parseInt(start),
    end: end,
    durationMinutes,
    fee
  });
  setHistory(history);
  setActiveParkingStart(null);
  updateDashboard();
}
function clearAllData() {
  if (!confirm('Are you sure you want to delete all parking data?')) return;
  setHistory([]);
  setActiveParkingStart(null);
  updateDashboard();
}

// --- Event Listeners ---
mainActionBtn.addEventListener('click', function() {
  if (getActiveParkingStart()) stopParking();
  else startParking();
});
clearAllBtn.addEventListener('click', clearAllData);

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js');
  });
}

// --- Init ---
updateDashboard();
