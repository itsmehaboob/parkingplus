// history.js - Parking History Page Logic

// --- Utility Functions (same as app.js) ---
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
function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', '');
}
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
function getTotalExpense() {
  return getHistory().reduce((sum, e) => sum + (e.fee || 0), 0);
}

// --- DOM Elements ---
const historyBody = document.getElementById('historyBody');
const addManualEntryBtn = document.getElementById('addManualEntryBtn');
const manualEntryModal = document.getElementById('manualEntryModal');
const modalOverlay = document.getElementById('modalOverlay');
const manualEntryForm = document.getElementById('manualEntryForm');
const manualParkTime = document.getElementById('manualParkTime');
const manualExitTime = document.getElementById('manualExitTime');
const cancelManualEntry = document.getElementById('cancelManualEntry');
const clearAllBtn = document.getElementById('clearAllBtn');

// --- Functions ---
function renderHistory() {
  const history = getHistory();
  historyBody.innerHTML = '';
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateTime(entry.start)}</td>
      <td>${formatDateTime(entry.end)}</td>
      <td>${formatDuration(entry.durationMinutes)}</td>
      <td>${formatCurrency(entry.fee)}</td>
      <td><button class="delete-btn" data-idx="${i}">Delete</button></td>
    `;
    historyBody.appendChild(tr);
  }
  // Add delete listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (confirm('Delete this entry?')) {
        const history = getHistory();
        history.splice(idx, 1);
        setHistory(history);
        renderHistory();
      }
    };
  });
}
function showManualEntryModal(show) {
  if (show) {
    manualEntryModal.classList.add('active');
    modalOverlay.classList.add('active');
    manualParkTime.value = '';
    manualExitTime.value = '';
  } else {
    manualEntryModal.classList.remove('active');
    modalOverlay.classList.remove('active');
  }
}
manualEntryForm.onsubmit = function(e) {
  e.preventDefault();
  const park = new Date(manualParkTime.value).getTime();
  const exit = new Date(manualExitTime.value).getTime();
  if (!park || !exit || exit <= park) {
    alert('Exit time must be after park time.');
    return;
  }
  const durationMinutes = Math.ceil((exit - park) / 60000);
  const fee = calcFee(durationMinutes);
  const history = getHistory();
  history.unshift({ start: park, end: exit, durationMinutes, fee });
  setHistory(history);
  showManualEntryModal(false);
  renderHistory();
};
addManualEntryBtn.onclick = function() { showManualEntryModal(true); };
cancelManualEntry.onclick = function() { showManualEntryModal(false); };
modalOverlay.onclick = function() { showManualEntryModal(false); };
clearAllBtn.onclick = function() {
  if (!confirm('Are you sure you want to delete all parking data?')) return;
  setHistory([]);
  setActiveParkingStart(null);
  renderHistory();
};

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js');
  });
}

// --- Init ---
renderHistory();
