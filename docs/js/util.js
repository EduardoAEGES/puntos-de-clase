/* Utilidades generales: texto, fechas, nombres y coincidencias. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Sin tildes ni signos, en mayúsculas: ÑANDÚ → NANDU */
function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const STOP = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'DA', 'DI', 'SAN']);
function tokens(s) { return norm(s).split(' ').filter(t => t && !STOP.has(t)); }

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const MINUS = new Set(['de', 'del', 'la', 'las', 'los', 'y']);
function tc(s) {
  return String(s || '').toLowerCase().split(/\s+/).filter(Boolean)
    .map((w, i) => (i > 0 && MINUS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
const primero = s => String(s || '').trim().split(/\s+/)[0] || '';
const nombreCorto = a => tc(primero(a.nombres) + ' ' + primero(a.apellidos));
const nombreCompleto = a => tc(a.nombres + ' ' + a.apellidos);
const iniciales = a => (primero(a.nombres).charAt(0) + primero(a.apellidos).charAt(0)).toUpperCase();

function toMin(h) { const m = String(h || '').match(/(\d{1,2}):(\d{2})/); return m ? (+m[1]) * 60 + (+m[2]) : null; }
function deMin(n) { n = ((n % 1440) + 1440) % 1440; return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
const signo = n => (n > 0 ? '+' : '') + n;

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
function fmtFecha(f, conDia = true) {
  if (!f) return '';
  const d = new Date(f + 'T12:00:00');
  return (conDia ? DIAS[d.getDay()] + ' ' : '') + d.getDate() + ' ' + MESES[d.getMonth()];
}
function hoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const fmtNota = n => (n === null || n === undefined) ? '—' : (Math.round(n * 10) / 10).toFixed(n % 1 ? 1 : 0);
const pct = x => (x === null || x === undefined) ? '—' : Math.round(x * 100) + '%';

/** Oscurece un color hex (para texto sobre el color del equipo). */
function shade(hex, f) {
  const h = String(hex || '#E5E7EB').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * (1 - f)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
};

/**
 * Busca al alumno que corresponde a un nombre (del chat o de una captura).
 * Devuelve {alumno, conf: 'apodo'|'alta'|'media'} o null si no hay uno claro.
 */
function matchNombre(q, alumnos) {
  const nq = norm(q);
  if (!nq) return null;
  for (const a of alumnos) {
    if ((a.apodos || []).some(p => norm(p) === nq)) return { alumno: a, conf: 'apodo' };
    if (norm(a.apellidos + ' ' + a.nombres) === nq || norm(a.nombres + ' ' + a.apellidos) === nq) return { alumno: a, conf: 'alta' };
  }
  const qt = tokens(q);
  if (!qt.length) return null;
  const res = alumnos.map(a => {
    const at = tokens(a.apellidos + ' ' + a.nombres);
    const usados = new Set();
    let m = 0;
    qt.forEach(t => {
      const i = at.findIndex((x, j) => !usados.has(j) && (x === t ||
        (t.length >= 4 && x.length >= 4 && lev(x, t) <= (Math.min(x.length, t.length) >= 7 ? 2 : 1))));
      if (i >= 0) { usados.add(i); m++; }
    });
    return { a, m, s: m / qt.length, s2: m / at.length };
  }).sort((x, y) => y.m - x.m || y.s2 - x.s2);
  const b = res[0], c = res[1];
  if (!b || b.m === 0) return null;
  const unico = !c || c.m < b.m;
  if (b.m >= 2 && b.s >= 0.6 && unico) return { alumno: b.a, conf: 'alta' };
  // Coincidencia parcial: solo si cubre al menos la mitad de lo leído (evita "PEREZ QUISPE" → "MAMANI QUISPE")
  if (unico && b.s >= 0.5) return { alumno: b.a, conf: 'media' };
  return null;
}

function cargarScript(src) {
  return new Promise((ok, fail) => {
    if ($$('script').some(s => s.src === src)) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = () => fail(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}
