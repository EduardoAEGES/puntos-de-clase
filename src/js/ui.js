/* Piezas de interfaz compartidas: íconos, hojas, avisos. */

/** Cada pantalla se registra aquí: Views.x = { render() → html }. */
const Views = {};
/** Acciones por clic: <button data-act="nombre">. Cambios por input: <input data-chg="nombre">. */
const Acciones = {};
const Cambios = {};

const ICON = (() => {
  const p = {
    clase: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    panel: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    equipos: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    asistencia: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M9 15l2 2 4-4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
    sesiones: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    deshacer: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    pegar: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    lista: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    usuarios: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/>',
    lapiz: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    estrella: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/>',
    candado: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    birrete: '<path d="M22 9L12 4 2 9l10 5 10-5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    atras: '<path d="M15 18l-6-6 6-6"/>',
    salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
  };
  const o = {};
  Object.keys(p).forEach(k => { o[k] = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[k]}</svg>`; });
  return o;
})();

const UI = {
  toast(msg, { accion, fn, error, ms = 3500 } = {}) {
    const t = document.createElement('div');
    t.className = 'toast' + (error ? ' error' : '');
    t.innerHTML = `<span>${esc(msg)}</span>` + (accion ? `<button>${esc(accion)}</button>` : '');
    if (accion) t.querySelector('button').onclick = () => { t.remove(); fn(); };
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), accion ? ms + 1500 : ms);
  },

  hoja(html, { ancha = false, alCerrar } = {}) {
    UI.cerrar();
    const capa = $('#capa');
    capa.innerHTML = `<div class="fondo"></div><div class="hoja${ancha ? ' ancha' : ''}" role="dialog"><div class="asa"></div>${html}</div>`;
    capa._alCerrar = alCerrar;
    $('.fondo', capa).onclick = UI.cerrar;
    document.body.style.overflow = 'hidden';
    return $('.hoja', capa);
  },

  cerrar() {
    const capa = $('#capa');
    if (!capa.innerHTML) return;
    const f = capa._alCerrar;
    capa.innerHTML = '';
    capa._alCerrar = null;
    document.body.style.overflow = '';
    if (f) f();
  },

  /** Número que sube y se desvanece sobre un elemento (al dar puntos). */
  flotar(el, texto, positivo) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'flota ' + (positivo ? 'pos' : 'neg');
    f.textContent = texto;
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top + 10) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 950);
  },

  notaClase(n, aprob) { return n === null || n === undefined ? 'na' : (n < aprob ? 'neg' : ''); }
};

document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.cerrar(); });
