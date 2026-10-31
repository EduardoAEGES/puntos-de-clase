/* Núcleo de la app del docente: estado, envío al servidor, estructura y arranque. */

const S = {
  st: null,                     // estado que devuelve el servidor
  resumen: null,                // todos los cursos, para la pantalla de inicio
  tab: 'inicio',
  orden: store.get('orden', 'equipo'),
  multi: false, sel: new Set(),
  pendientes: 0, ultimo: null,
  asis: null, chat: null, sesSel: null, cal: null, imp: null, podio: 'participacion',
  puntosCtx: null, perfilAbierto: null
};

const TABS = [
  ['clase', 'Clase'], ['panel', 'Panel'], ['equipos', 'Equipos'],
  ['asistencia', 'Asistencia'], ['chat', 'Chat'], ['sesiones', 'Sesiones']
];

/* ---------- Ayudas sobre el estado ---------- */

const alumnoDe = k => S.st.alumnos.find(a => a.clave === k);
const equipoDe = n => S.st.equipos.find(e => e.equipo === n) || { equipo: n, nombre: n ? 'Equipo ' + n : 'Sin equipo', color: '#E5E7EB', total: 0 };
const colorEq = n => equipoDe(n).color;

/* ---------- Servidor ---------- */

let cola = Promise.resolve();

/**
 * Envía una acción al servidor en orden. Si hay varias seguidas, solo se pinta
 * la respuesta de la última, para no pisar lo que ya se ve en pantalla.
 */
function enviar(fn, args, { silencio = false } = {}) {
  S.pendientes++;
  pintarSync();
  const p = cola.then(() => Api.call(fn, ...args));
  cola = p.catch(() => {});
  return p.then(st => {
    S.ultimo = st;
    S.resumen = null;           // cambió algo: el inicio se vuelve a calcular al abrirlo
    S.pendientes--;
    if (S.pendientes === 0) aplicar(st, { silencio });
    else pintarSync();
    return st;
  }).catch(e => {
    S.pendientes--;
    pintarSync();
    if (/PIN/.test(e.message)) { Api.olvidarPin(); return pantallaPin('Tu PIN cambió. Vuelve a entrar.'); }
    UI.toast(e.message || 'No se pudo guardar', { error: true });
    recargar();
    throw e;
  });
}

function aplicar(st, { silencio = false } = {}) {
  const cambioCurso = !S.st || S.st.curso !== st.curso;
  S.st = st;
  store.set('curso', st.curso);
  if (cambioCurso) { S.asis = null; S.chat = null; S.sesSel = null; S.cal = null; S.imp = null; S.sel.clear(); S.multi = false; }
  if (st.msg && !silencio) UI.toast(st.msg);
  render();
}

function recargar() {
  return Api.call('getState', S.st ? S.st.curso : store.get('curso', '')).then(st => aplicar(st, { silencio: true }))
    .catch(e => UI.toast(e.message, { error: true }));
}

/** Curso que toca ahora según el horario (desde 45 min antes hasta 4 h después del inicio). */
function cursoAhora(cursos) {
  const d = new Date();
  const dia = norm(DIAS[d.getDay()]);
  const ahora = d.getHours() * 60 + d.getMinutes();
  const hoy = cursos.filter(c => norm(c.dias).split(' ').includes(dia));
  const c = hoy.find(x => { const m = toMin(x.hora); return ahora >= m - 45 && ahora <= m + 240; });
  return c ? c.curso : null;
}

/* ---------- Estructura ---------- */

function pintarSync() {
  const s = $('#sync');
  if (s) { s.classList.toggle('on', S.pendientes > 0); s.title = S.pendientes ? 'Guardando…' : 'Todo guardado'; }
}

function render() {
  if (!S.st) return;
  const st = S.st;
  const y = window.scrollY;
  const vista = Views[S.tab] || Views.clase;
  const enInicio = S.tab === 'inicio';
  const ajustes = `<button class="icon-btn ${S.tab === 'ajustes' ? 'on' : ''}" data-act="tab" data-tab="ajustes" aria-label="Ajustes">${ICON.ajustes}</button>`;
  $('#app').innerHTML = (enInicio ? `
    <header class="top"><div class="top-in">
      <div class="marca">${ICON.birrete}<b>Puntos de clase</b></div>
      <span class="sync" id="sync"></span>${ajustes}
    </div></header>` : `
    <header class="top"><div class="top-in">
      <button class="icon-btn" data-act="tab" data-tab="inicio" title="Mis cursos" aria-label="Volver a mis cursos">${ICON.atras}</button>
      <select class="curso-sel" data-chg="curso" aria-label="Curso">
        ${st.cursos.map(c => `<option value="${esc(c.curso)}" ${c.curso === st.curso ? 'selected' : ''}>${esc(c.nombre)} · ${esc(c.seccion)}</option>`).join('')}
      </select>
      <span class="sync" id="sync"></span>
      <button class="icon-btn" data-act="deshacer" title="Deshacer último" aria-label="Deshacer último">${ICON.deshacer}</button>
      ${ajustes}
    </div></header>`) + `
    <main>${vista.render()}</main>` + (enInicio ? '' : `
    <nav class="nav"><div class="nav-in">
      ${TABS.map(([k, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}">${ICON[k]}<span>${l}</span></button>`).join('')}
    </div></nav>`);
  pintarSync();
  window.scrollTo(0, y);
}

/* ---------- Eventos (delegados) ---------- */

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = Acciones[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-chg]');
  if (el && Cambios[el.dataset.chg]) Cambios[el.dataset.chg](el, e);
});

Object.assign(Acciones, {
  tab(el) {
    S.tab = el.dataset.tab;
    store.set('tab', S.tab);
    if (S.tab !== 'sesiones') S.sesSel = null;
    UI.cerrar();
    render();
    window.scrollTo(0, 0);
  }
});

Cambios.curso = el => {
  $('#app').querySelector('main').innerHTML = '<div class="cargando"><div class="spinner"></div></div>';
  Api.call('getState', el.value).then(st => aplicar(st, { silencio: true })).catch(e => UI.toast(e.message, { error: true }));
};

/* ---------- PIN ---------- */

async function pantallaPin(aviso = '') {
  let configurado = true;
  try { configurado = (await Api.run('estadoPin')).configurado; }
  catch (e) { return pantallaError(e.message); }
  $('#app').innerHTML = `<div class="centro"><form class="caja card" id="f-pin" style="padding:28px 20px">
    <div class="logo">${ICON.candado}</div>
    <h2>${configurado ? 'Hola, profe' : 'Crea tu PIN'}</h2>
    <p class="muted">${configurado ? 'Escribe tu PIN para entrar.' : 'Lo pedirá la app en cada equipo nuevo. De 4 a 8 dígitos.'}</p>
    <input type="password" inputmode="numeric" maxlength="8" id="pin1" class="pin-in" placeholder="••••" autocomplete="current-password" required>
    ${configurado ? '' : '<input type="password" inputmode="numeric" maxlength="8" id="pin2" class="pin-in" placeholder="Repite" style="margin-top:10px" required>'}
    <p class="neg small" id="pin-err" style="margin:10px 0 0">${esc(aviso)}</p>
    <button class="btn primary block" style="margin-top:12px">Entrar</button>
  </form></div>`;
  $('#pin1').focus();
  $('#f-pin').onsubmit = async ev => {
    ev.preventDefault();
    const p1 = $('#pin1').value.trim();
    const err = m => { $('#pin-err').textContent = m; };
    if (!/^\d{4,8}$/.test(p1)) return err('Usa de 4 a 8 dígitos.');
    try {
      if (!configurado) {
        if (p1 !== $('#pin2').value.trim()) return err('Los PIN no coinciden.');
        await Api.run('crearPin', p1);
      }
      Api.setPin(p1);
      await cargar();
    } catch (e) {
      Api.olvidarPin();
      err(/PIN/.test(e.message) ? 'PIN incorrecto.' : e.message);
    }
  };
}

function pantallaError(msg) {
  $('#app').innerHTML = `<div class="centro"><div class="caja card" style="padding:28px 20px"><h2>No pude abrir la app</h2>
    <p class="muted">${esc(msg)}</p><button class="btn primary" onclick="location.reload()">Reintentar</button></div></div>`;
}

/* ---------- Arranque ---------- */

async function cargar() {
  let st = await Api.call('getState', store.get('curso', ''));
  const auto = cursoAhora(st.cursos);
  if (auto && auto !== st.curso) st = await Api.call('getState', auto);
  aplicar(st, { silencio: true });
}

(async function iniciar() {
  const params = await Api.location();
  if (params.v === 'notas') return Views.notas.iniciar();
  if (!Api.pin) return pantallaPin();
  try { await cargar(); }
  catch (e) {
    if (/PIN/.test(e.message)) { Api.olvidarPin(); pantallaPin('Escribe tu PIN otra vez.'); }
    else pantallaError(e.message);
  }
})();
