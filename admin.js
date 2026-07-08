/* ---------- Supabase config ----------
   Same project as the public site — paste the same anon key you used in script.js. */
const SUPABASE_URL = 'https://pzdvyzkmgzjznwnroztz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_m73VLjPd2aL2IeHhAQJXrg_SEpAea5s';

const sb = (window.supabase && SUPABASE_ANON_KEY !== 'ВАШ_SUPABASE_ANON_KEY')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const leadsBody = document.getElementById('leadsBody');

let leadsCache = [];
let tickTimer = null;

function showLogin() {
  loginScreen.hidden = false;
  dashboard.hidden = true;
  if (tickTimer) clearInterval(tickTimer);
}

function showDashboard() {
  loginScreen.hidden = true;
  dashboard.hidden = false;
  loadLeads();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(renderLeads, 30000); // refresh "elapsed" labels every 30s
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatElapsed(fromIso, toIso) {
  if (!fromIso) return '—';
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  let mins = Math.max(0, Math.round((to - from) / 60000));
  const days = Math.floor(mins / 1440);
  mins -= days * 1440;
  const hours = Math.floor(mins / 60);
  mins -= hours * 60;

  const parts = [];
  if (days) parts.push(days + ' д');
  if (hours) parts.push(hours + ' ч');
  if (!days && mins) parts.push(mins + ' мин');
  if (!parts.length) parts.push('только что');
  return parts.join(' ');
}

function urgencyClass(createdAt, called) {
  if (called) return 'elapsed-ok';
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins > 60) return 'elapsed-urgent';
  if (mins > 15) return 'elapsed-warn';
  return 'elapsed-ok';
}

async function loadLeads() {
  if (!sb) {
    leadsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Supabase не настроен — впишите SUPABASE_ANON_KEY в admin.js</td></tr>';
    return;
  }
  leadsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Загрузка…</td></tr>';

  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    leadsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Ошибка загрузки: ' + error.message + '</td></tr>';
    return;
  }

  leadsCache = data || [];
  renderLeads();
}

function renderLeads() {
  if (!leadsCache.length) {
    leadsBody.innerHTML = '<tr><td colspan="7" class="empty-row">Заявок пока нет</td></tr>';
  } else {
    leadsBody.innerHTML = leadsCache.map(rowHtml).join('');

    leadsBody.querySelectorAll('[data-mark-id]').forEach(btn => {
      btn.addEventListener('click', () => markCalled(btn.getAttribute('data-mark-id')));
    });
  }
  renderStats();
}

function rowHtml(lead) {
  const statusDot = lead.called ? 'status-called' : 'status-pending';
  const statusLabel = lead.called ? 'Обработана' : 'Ждёт звонка';
  const elapsedTo = lead.called ? lead.called_at : null;
  const elapsedText = formatElapsed(lead.created_at, elapsedTo);
  const urgency = urgencyClass(lead.created_at, lead.called);

  const actionCell = lead.called
    ? '<span class="called-time">' + formatDateTime(lead.called_at) + '</span>'
    : '<button class="mark-btn" data-mark-id="' + lead.id + '">Отметить звонок</button>';

  return (
    '<tr>' +
      '<td><span class="status-dot ' + statusDot + '"></span>' + statusLabel + '</td>' +
      '<td>' + escapeHtml(lead.name || '—') + '</td>' +
      '<td>' + (lead.phone ? '<a class="phone-link" href="tel:' + escapeHtml(lead.phone) + '">' + escapeHtml(lead.phone) + '</a>' : '—') + '</td>' +
      '<td>' + formatDateTime(lead.created_at) + '</td>' +
      '<td class="elapsed ' + urgency + '">' + elapsedText + (lead.called ? ' (до звонка)' : '') + '</td>' +
      '<td>' + (lead.called ? 'да' : 'нет') + '</td>' +
      '<td>' + actionCell + '</td>' +
    '</tr>'
  );
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function renderStats() {
  const total = leadsCache.length;
  const called = leadsCache.filter(l => l.called).length;
  const pending = total - called;
  const todayStr = new Date().toDateString();
  const today = leadsCache.filter(l => new Date(l.created_at).toDateString() === todayStr).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statCalled').textContent = called;
  document.getElementById('statToday').textContent = today;
}

async function markCalled(id) {
  if (!sb) return;
  const btn = document.querySelector('[data-mark-id="' + id + '"]');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  const { error } = await sb
    .from('leads')
    .update({ called: true, called_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Не удалось обновить статус: ' + error.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Отметить звонок'; }
    return;
  }
  await loadLeads();
}

/* ---------- Auth ---------- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  if (!sb) {
    loginError.textContent = 'Supabase не настроен в admin.js';
    return;
  }

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'Неверный email или пароль';
    return;
  }
  showDashboard();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (sb) await sb.auth.signOut();
  showLogin();
});

document.getElementById('refreshBtn').addEventListener('click', loadLeads);

/* ---------- Boot: check for existing session ---------- */
(async function init() {
  if (!sb) { showLogin(); return; }
  const { data } = await sb.auth.getSession();
  if (data && data.session) {
    showDashboard();
  } else {
    showLogin();
  }
})();
