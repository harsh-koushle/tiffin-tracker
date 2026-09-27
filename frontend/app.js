let token = localStorage.getItem('tiffin_token');
let userEmail = localStorage.getItem('tiffin_email');
let buttons = [];
let entries = [];
let history = [];
let editingSetup = false;

function fmt(n){ return '₹' + Number(n).toFixed(0); }
function todayStr(){ return new Date().toISOString().slice(0, 10); }
function escHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s){ return String(s).replace(/'/g, "\\'"); }

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error((data && data.error) || 'Something went wrong');
  return data;
}

function logout(){
  token = null; userEmail = null;
  localStorage.removeItem('tiffin_token');
  localStorage.removeItem('tiffin_email');
  render();
}

// ---------- Boot ----------
async function boot(){
  if (!token) { renderAuth(); return; }
  try {
    buttons = await api('/buttons');
    entries = await api('/entries');
    history = await api('/history');
    render();
  } catch (e) {
    if (String(e.message).toLowerCase().includes('token')) { logout(); }
    else { renderError(e.message); }
  }
}

function renderError(msg){
  document.getElementById('app').innerHTML = `
    <h1>🍱 Tiffin Tracker</h1>
    <div class="card"><div class="err">${escHtml(msg)}</div>
    <button class="tbtn" style="width:100%" onclick="boot()">Retry</button></div>`;
}

// ---------- Auth screens ----------
function renderAuth(mode = 'login'){
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>🍱 Tiffin Tracker</h1>
    <div class="sub">${mode === 'login' ? 'Log in to your tracker' : 'Create your account'}</div>
    <div class="card">
      <div class="err" id="authErr"></div>
      <input id="authEmail" type="email" placeholder="Email" />
      <input id="authPassword" type="password" placeholder="Password (6+ characters)" />
      <button class="tbtn" style="width:100%" onclick="submitAuth('${mode}')">${mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <div class="sub" style="margin-top:12px;text-align:center;">
        ${mode === 'login'
          ? `New here? <button class="link-btn" onclick="renderAuth('signup')">Create an account</button>`
          : `Already have an account? <button class="link-btn" onclick="renderAuth('login')">Log in</button>`}
      </div>
    </div>
  `;
}

async function submitAuth(mode){
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errBox = document.getElementById('authErr');
  errBox.textContent = '';
  try {
    const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    token = data.token; userEmail = data.email;
    localStorage.setItem('tiffin_token', token);
    localStorage.setItem('tiffin_email', userEmail);
    await boot();
  } catch (e) {
    errBox.textContent = e.message;
  }
}

// ---------- Main tracker ----------
function render(){
  const app = document.getElementById('app');
  if (!token) { renderAuth(); return; }
  if (editingSetup || !buttons || buttons.length === 0) {
    app.innerHTML = setupHTML();
    renderSetupRows(buttons && buttons.length ? buttons.length : undefined);
    return;
  }
  const total = entries.reduce((s, e) => s + Number(e.price), 0);
  app.innerHTML = `
    <div class="header"><h1>🍱 Tiffin Tracker</h1>
      <div>
        <button class="gear" onclick="editingSetup=true; render();">⚙️</button>
        <button class="gear" onclick="logout()">⎋</button>
      </div>
    </div>
    <div class="sub">${escHtml(userEmail || '')}</div>
    <div class="card"><div class="sub">Total due</div><div class="total">${fmt(total)}</div></div>
    <div class="btn-row">
      ${buttons.map(b => `<button class="tbtn" onclick="addEntry('${escAttr(b.label)}', ${b.price})">${escHtml(b.label)}<small>${fmt(b.price)}</small></button>`).join('')}
    </div>
    <button class="tbtn ghost" style="width:100%" onclick="openCustom()">+ Add other</button>
    <div class="card" style="margin-top:16px;">
      <div class="sub">This cycle (${entries.length})</div>
      ${entries.length ? entries.map(e => `<div class="entry"><span>${escHtml(e.label)} · ${e.date}</span><span>${fmt(e.price)} <button onclick="removeEntry(${e.id})">✕</button></span></div>`).join('') : '<div class="sub">No entries yet</div>'}
    </div>
    <div class="actions"><button class="reset" onclick="confirmReset()">Reset &amp; mark paid</button></div>
    ${history.length ? `<div class="card" style="margin-top:16px;"><div class="sub">Past 7 days</div>${history.map(h => `<div class="history-item">${new Date(h.reset_at).toLocaleDateString()} — ${fmt(h.total)} (${h.entries.length} tiffins)</div>`).join('')}</div>` : ''}
  `;
}

function setupHTML(){
  const current = buttons && buttons.length ? buttons.length : 2;
  const cancel = (buttons && buttons.length) ? `<button class="tbtn ghost" style="width:100%;margin-top:8px;" onclick="editingSetup=false; render();">Cancel</button>` : '';
  return `
    <h1>🍱 Tiffin Tracker</h1>
    <div class="sub">Set up your tiffin price options</div>
    <div class="card">
      <label class="sub">How many price options do you want?</label>
      <input id="numOptions" type="number" min="1" max="6" value="${current}" />
      <button class="tbtn" style="width:100%" onclick="renderSetupRows()">Continue</button>
      <div id="setupRows"></div>
      ${cancel}
    </div>
  `;
}

function renderSetupRows(nArg){
  const n = nArg || Math.max(1, Math.min(6, Number(document.getElementById('numOptions').value) || 2));
  let rows = '';
  for (let i = 0; i < n; i++) {
    const existing = (buttons && buttons[i]) || {};
    rows += `<div class="setup-row">
      <input placeholder="Label (e.g. Half)" id="lbl${i}" value="${existing.label ? escAttr(existing.label) : ''}" />
      <input placeholder="Price" type="number" id="price${i}" style="max-width:100px" value="${existing.price != null ? existing.price : ''}" />
    </div>`;
  }
  document.getElementById('setupRows').innerHTML = rows + `<button class="tbtn" style="width:100%;margin-top:8px;" onclick="finishSetup(${n})">Save buttons</button>`;
}

async function finishSetup(n){
  const list = [];
  for (let i = 0; i < n; i++) {
    const lbl = document.getElementById('lbl' + i).value.trim() || ('Option ' + (i + 1));
    const price = Number(document.getElementById('price' + i).value) || 0;
    list.push({ label: lbl, price });
  }
  try {
    buttons = await api('/buttons', { method: 'PUT', body: JSON.stringify({ buttons: list }) });
    editingSetup = false;
    render();
  } catch (e) { alert(e.message); }
}

async function addEntry(label, price){
  try {
    const entry = await api('/entries', { method: 'POST', body: JSON.stringify({ label, price, date: todayStr() }) });
    entries.push(entry);
    render();
  } catch (e) { alert(e.message); }
}

async function removeEntry(id){
  try {
    await api(`/entries/${id}`, { method: 'DELETE' });
    entries = entries.filter(e => e.id !== id);
    render();
  } catch (e) { alert(e.message); }
}

function openCustom(){
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal">
    <div class="sub">Add a tiffin entry</div>
    <input id="cLabel" placeholder="Label (e.g. Half / Full / Special)" />
    <input id="cPrice" type="number" placeholder="Price" />
    <input id="cDate" type="date" value="${todayStr()}" />
    <div class="actions">
      <button onclick="this.closest('.modal-back').remove()">Cancel</button>
      <button class="reset" style="background:var(--accent2)" onclick="submitCustom()">Add</button>
    </div>
  </div>`;
  document.body.appendChild(back);
}

async function submitCustom(){
  const label = document.getElementById('cLabel').value.trim() || 'Tiffin';
  const price = Number(document.getElementById('cPrice').value) || 0;
  const date = document.getElementById('cDate').value || todayStr();
  try {
    const entry = await api('/entries', { method: 'POST', body: JSON.stringify({ label, price, date }) });
    entries.push(entry);
    document.querySelector('.modal-back').remove();
    render();
  } catch (e) { alert(e.message); }
}

function confirmReset(){
  const back = document.createElement('div');
  back.className = 'modal-back';
  const total = entries.reduce((s, e) => s + Number(e.price), 0);
  back.innerHTML = `<div class="modal">
    <div class="sub">Mark ${fmt(total)} as paid and reset this cycle? It'll be kept in history for 7 days.</div>
    <div class="actions">
      <button onclick="this.closest('.modal-back').remove()">Cancel</button>
      <button class="reset" onclick="doReset(); this.closest('.modal-back').remove()">Confirm reset</button>
    </div>
  </div>`;
  document.body.appendChild(back);
}

async function doReset(){
  try {
    await api('/reset', { method: 'POST' });
    entries = [];
    history = await api('/history');
    render();
  } catch (e) { alert(e.message); }
}

boot();
