/* APEX OMS — whole-system language switch (English / Sinhala / Tamil)
   Translates every screen, placeholder, tooltip, message and confirmation. */
(function () {
'use strict';
const DATA = window.APEX_I18N_DATA || {}, PATTERNS = (window.APEX_I18N_PATTERNS || []).map(p => [new RegExp(p[0]), p[1], p[2]]);
const IDX = { si: 0, ta: 1 };
const lower = {};
Object.keys(DATA).forEach(k => { lower[k.toLowerCase()] = DATA[k]; });
const cur = () => localStorage.getItem('apexOmsLang') || 'en';
const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|CODE|PRE)$/;
const ATTRS = ['placeholder', 'title', 'aria-label'];
const origText = new WeakMap(), outText = new WeakMap();

function tr(str, lang) {
  lang = lang || cur();
  if (lang === 'en' || !(lang in IDX) || str == null) return str;
  const s = String(str), lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.trim().replace(/\s+/g, ' ');
  if (core.length < 2) return s;
  const hit = DATA[core] || lower[core.toLowerCase()];
  if (hit) return lead + hit[IDX[lang]] + trail;
  for (const [re, si, ta] of PATTERNS) {
    const m = core.match(re);
    if (m) return lead + (lang === 'si' ? si : ta).replace(/\{(\d)\}/g, (x, i) => m[+i] ?? '') + trail;
  }
  return s;
}
window.apexTr = tr;

function doText(node, lang) {
  const p = node.parentElement; if (!p || SKIP.test(p.tagName) || p.closest('[data-no-i18n]')) return;
  const v = node.nodeValue;
  if (outText.get(node) === v) {                       // still our own output → keep original
    const o = origText.get(node); node.nodeValue = lang === 'en' ? o : tr(o, lang); outText.set(node, node.nodeValue); return;
  }
  origText.set(node, v);                               // new / changed by the app → new original
  if (lang === 'en') { outText.delete(node); return; }
  const out = tr(v, lang); outText.set(node, out); if (out !== v) node.nodeValue = out;
}
function doAttrs(el, lang) {
  if (!el.getAttribute) return;
  ATTRS.forEach(a => {
    if (!el.hasAttribute(a)) return;
    const k = 'data-i18n-' + a, v = el.getAttribute(a);
    if (el.hasAttribute(k) && el.getAttribute('data-i18n-out-' + a) === v) {
      const o = el.getAttribute(k); const out = lang === 'en' ? o : tr(o, lang); el.setAttribute(a, out); el.setAttribute('data-i18n-out-' + a, out); return;
    }
    if (lang === 'en') return;
    const out = tr(v, lang); if (out !== v) { el.setAttribute(k, v); el.setAttribute(a, out); el.setAttribute('data-i18n-out-' + a, out); }
  });
}
function walk(root, lang) {
  if (!root) return;
  if (root.nodeType === 3) return doText(root, lang);
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(root.tagName)) return;
  doAttrs(root, lang);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n, lang); else doAttrs(n, lang); }
}
let busy = false;
function applyAll() {
  const lang = cur(); document.documentElement.lang = lang === 'en' ? 'en' : lang;
  obs.disconnect();
  try { walk(document.body, lang); } finally { obs.observe(document.body, OPTS); }
}
const OPTS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
const obs = new MutationObserver(muts => {
  const lang = cur();
  obs.disconnect();                                   // our own edits must not trigger us again
  try {
    for (const m of muts) {
      if (m.type === 'characterData') doText(m.target, lang);
      else if (m.type === 'attributes') doAttrs(m.target, lang);
      else m.addedNodes.forEach(n => walk(n, lang));
    }
  } finally { obs.observe(document.body, OPTS); }
});
function start() { applyAll(); obs.observe(document.body, OPTS); }
// messages / confirmations
const _toast = window.toast; if (typeof _toast === 'function') { toast = function (m) { return _toast(tr(m)); }; window.toast = toast; }
const _confirm = window.confirm.bind(window); window.confirm = m => _confirm(tr(m));
const _alert = window.alert.bind(window); window.alert = m => _alert(tr(m));
// language switch hook
const _set = window.setLanguage; if (typeof _set === 'function') { setLanguage = function (l) { _set(l); applyAll(); }; window.setLanguage = setLanguage; }
window.apexApplyLanguage = applyAll;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
