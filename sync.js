/* =====================================================================
   APEX OMS v25 — live sync
   Pushes this browser's changes to the OMS server (server.py) and polls for
   other users' changes, so every open session updates by itself.
   A server session is required; expired or unavailable server sessions are locked out.
   ===================================================================== */
(function () {
'use strict';
const clone = o => JSON.parse(JSON.stringify(o));
const strip = d => { const c = Object.assign({}, d); delete c.session; return c; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const POLL_MS = 2000;
const FORM_ROUTES = ['new-order', 'create-company', 'new-staff', 'import-lead', 'add-return', 'product-tools', 'settings', 'commission-rate', 'announcement'];

let ver = 0, base = null, online = false, dirty = false, pushing = false, pushTimer = null, pendingRender = false;
const origSave = save;

/* ---------------------------------------------------------------- diff (client) */
function idField(arr) {
  for (const f of ['id', 'no', 'orderId', 'tracking']) {
    if (arr.length && arr.every(x => isObj(x) && x[f] !== undefined && x[f] !== null) && new Set(arr.map(x => x[f])).size === arr.length) return f;
  }
  return null;
}
function diff(cur, prev) {
  const out = {};
  for (const k of new Set([...Object.keys(cur), ...Object.keys(prev)])) {
    const a = cur[k], b = prev[k];
    if (a === undefined) { out[k] = { t: 'delete' }; continue; }
    if (same(a, b)) continue;
    if (Array.isArray(a) && Array.isArray(b)) {
      const f = idField(a.length ? a : b);
      if (f && (!a.length || !b.length || idField(b) === f)) {
        const bm = new Map(b.map(x => [x[f], JSON.stringify(x)])), aset = new Set(a.map(x => x[f]));
        out[k] = { t: 'arr', idf: f, up: a.filter(x => bm.get(x[f]) !== JSON.stringify(x)), del: b.filter(x => !aset.has(x[f])).map(x => x[f]) };
        continue;
      }
    } else if (isObj(a) && isObj(b)) {
      const set = {}, del = [];
      for (const c of Object.keys(a)) if (!same(a[c], b[c])) set[c] = a[c];
      for (const c of Object.keys(b)) if (!(c in a)) del.push(c);
      out[k] = { t: 'obj', set, del };
      continue;
    }
    out[k] = { t: 'replace', v: a };
  }
  return out;
}

/* ---------------------------------------------------------------- live badge */
function expireSession() { db.session = null; dirty = false; origSave(); online = false; setLive(); if (typeof loginScreen === 'function') loginScreen(); }

function setLive() {
  let el = document.getElementById('liveDot');
  if (!el) {
    const host = document.querySelector('.top-actions'); if (!host) return;
    el = document.createElement('div'); el.id = 'liveDot'; el.className = 'live-dot';
    host.insertBefore(el, host.firstChild);
  }
  el.className = 'live-dot ' + (online ? 'on' : 'off');
  el.innerHTML = '<i></i><span>' + (online ? 'Live' : 'Offline') + '</span>';
  el.title = online ? 'Connected — changes from other users appear automatically' : 'OMS server not reachable — changes stay in this browser only';
}

/* ---------------------------------------------------------------- push */
function schedulePush() { dirty = true; clearTimeout(pushTimer); pushTimer = setTimeout(push, 300); }
async function push() {
  if (!db.session) { dirty = false; online = false; setLive(); return; }
  if (pushing) { pushTimer = setTimeout(push, 300); return; }
  pushing = true;
  const snapshot = clone(strip(db)), v0 = ver;
  try {
    let body;
    if (base === null) body = { full: snapshot };
    else {
      const changes = diff(snapshot, base);
      if (!Object.keys(changes).length) { dirty = false; return; }
      body = { changes };
    }
    const r = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json(); online = true; setLive();
    if (j.rejected) { dirty = false; base = null; pushing = false; return pull(true); }
    base = snapshot; ver = j.version; dirty = false;
    // Server strips credentials after hashing them. Re-pull the sanitized canonical state.
    setTimeout(() => pull(true), 20);
    if (j.prev !== v0) { pushing = false; return pull(true); }   // somebody else changed data in between
  } catch (e) {
    const message=String(e.message||e);
    if (message.includes('http 401')) expireSession();
    else if (/http 4\d\d/.test(message)) { dirty=false; online=true; setLive(); if(typeof toast==='function')toast('The server rejected this change. Your latest server data will be reloaded.'); setTimeout(()=>pull(true),30); }
    else { online=false; setLive(); if(db.session)pushTimer=setTimeout(push,5000); }
  }
  finally { pushing = false; }
}

/* ---------------------------------------------------------------- pull */
async function pull(force) {
  if (!db.session) { online = false; setLive(); return; }
  if (pushing || dirty) return;
  try {
    const r = await fetch('/api/state?since=' + (force ? -1 : ver), { cache: 'no-store' });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json(); online = true; setLive();
    if (!j.db && j.changed !== false) { if (base === null && db.session !== undefined) { dirty = true; push(); } return; }   // empty server: seed it from this browser
    if (j.changed === false) return;
    apply(j);
  } catch (e) { if (String(e.message||e).includes('http 401') || !online) expireSession(); else { online = false; setLive(); } }
}
function sessionOk() {
  const s = db.session; if (!s || s.role === 'Owner') return true;
  const u = db.staff.find(x => x.id === s.staffId); if (!u) return false;
  const c = db.companies.find(x => x.id === u.companyId); return !!c && c.active !== false;
}
function apply(j) {
  const session = db.session;
  db = Object.assign({}, j.db, { session: session === undefined ? null : session });
  ver = j.version; base = clone(j.db);
  origSave();
  if (!sessionOk()) { db.session = null; origSave(); loginScreen(); toast('Your account was changed or blocked. Please sign in again.'); return; }
  if (db.session) { pendingRender = true; tryRender(); }
}

/* ---------------------------------------------------------------- re-render without losing the user's place */
function canRender() {
  if ([...document.querySelectorAll('.modal-mask,.modal-backdrop')].some(m => getComputedStyle(m).display !== 'none')) return false;
  const a = document.activeElement, c = document.getElementById('content');
  if (a && c && c.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && !/^(checkbox|radio|button|submit)$/.test(a.type)) return false;
  if (c && c.querySelector('.form-grid')) return false;
  if (c && [...c.querySelectorAll('input[type=file]')].some(i => i.files && i.files.length)) return false;
  const route = location.hash.slice(1) || 'dashboard';
  if (FORM_ROUTES.includes(route) || route.startsWith('waybill')) return false;
  return true;
}
function tryRender() {
  if (!pendingRender || !db.session || !canRender()) return;
  pendingRender = false;
  const c = document.getElementById('content');
  const snap = [...document.querySelectorAll('#content [id]')].filter(e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) && !/^(file|password)$/.test(e.type)).map(e => [e.id, e.value, e.checked]);
  const y = window.scrollY, cy = c ? c.scrollTop : 0;
  try { render(); } catch (e) { console.error(e); }
  snap.forEach(([id, v, chk]) => {
    const e = document.getElementById(id); if (!e || !c.contains(e)) return;
    if (e.value !== v || e.checked !== chk) {
      if (e.type === 'checkbox' || e.type === 'radio') e.checked = chk; else e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  window.scrollTo(0, y); if (c) c.scrollTop = cy;
}

/* ---------------------------------------------------------------- wiring */
save = function () { origSave(); schedulePush(); };
window.save = save;

// No server (file:// or server stopped): keep other tabs of this browser in sync
window.addEventListener('storage', e => {
  if (online || e.key !== KEY || !e.newValue) return;
  try { db = JSON.parse(e.newValue); pendingRender = true; tryRender(); } catch (err) { /* ignore */ }
});

setLive();
pull(true);
setInterval(() => { pull(false); tryRender(); }, POLL_MS);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(false); });
window.addEventListener('focus', () => pull(false));
window.apexSyncStatus = () => ({ online, ver, dirty });
window.apexSyncLogin = async () => { await pull(true); };
})();
