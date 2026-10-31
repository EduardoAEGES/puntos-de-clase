/* Pantalla Clase: tarjetas de alumnos y hoja para dar puntos. */

Views.clase = {
  render() {
    const st = S.st;
    const c = st.cursoInfo;
    const hoy = st.movs.filter(m => m.fecha === st.fecha);
    const mas = hoy.filter(m => m.puntos > 0).reduce((s, m) => s + m.puntos, 0);
    const menos = hoy.filter(m => m.puntos < 0).reduce((s, m) => s + m.puntos, 0);
    const ses = st.sesiones.find(s => s.fecha === st.fecha);

    let h = `<div class="seccion-head"><div>
        <h2>${esc(c.nombre)} · ${esc(c.seccion)}</h2>
        <p class="muted small">${ses ? 'Sesión ' + ses.n + ' · ' : ''}${esc(fmtFecha(st.fecha))} · inicia ${esc(c.hora)}${c.modalidad ? ' · ' + esc(c.modalidad) : ''}</p>
      </div></div>
      <div class="resumen-hoy">
        <span class="badge pos">+${mas} hoy</span><span class="badge neg">${menos} hoy</span>
        <span class="badge">${st.alumnos.length} alumnos</span>
      </div>`;

    if (!st.alumnos.length) {
      return h + `<div class="card vacio">${ICON.usuarios}<p>Este curso aún no tiene alumnos.</p>
        <button class="btn primary" data-act="tab" data-tab="ajustes">Importar alumnos</button></div>`;
    }

    h += `<div class="card" style="margin-bottom:16px">${podioHTML()}</div>
      <p class="muted small" style="margin:0 0 10px">Toca un alumno para ver sus notas · usa <b>Varios</b> o <b>Toda la clase</b> para dar puntos rápido.</p>
      <div class="toolbar">
        <div class="seg">${[['equipo', 'Equipo'], ['nombre', 'Nombre'], ['puntos', 'Puntos']].map(([k, l]) =>
          `<button class="${S.orden === k ? 'on' : ''}" data-act="orden" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="chips">
          <button class="chip ${S.multi ? 'on' : ''}" data-act="multi">Varios</button>
          <button class="chip" data-act="todos">Toda la clase</button>
        </div>
      </div><div class="grid-alumnos">`;

    const lista = ordenarAlumnos(st.alumnos);
    let eqActual = null;
    lista.forEach(a => {
      if (S.orden === 'equipo' && a.equipo !== eqActual) {
        eqActual = a.equipo;
        const e = equipoDe(a.equipo);
        h += `<div class="grupo-equipo" style="--eq:${e.color}"><i></i>${esc(e.nombre)}<span class="badge">${e.total} pts</span></div>`;
      }
      h += tarjetaHTML(a);
    });
    h += '</div>';

    if (S.multi) {
      h += `<div class="barra-multi"><b>${S.sel.size} seleccionados</b>
        <button class="btn ghost" style="color:#fff" data-act="multi">Cancelar</button>
        <button class="btn primary" data-act="darVarios" ${S.sel.size ? '' : 'disabled'}>Dar puntos</button></div>`;
    }
    return h;
  }
};

function tarjetaHTML(a) {
  const color = colorEq(a.equipo);
  const cls = a.total > 0 ? '' : a.total < 0 ? 'neg' : 'cero';
  return `<button class="tarjeta ${S.sel.has(a.clave) ? 'sel' : ''}" data-act="tocar" data-clave="${esc(a.clave)}" style="--eq:${color}">
    ${S.multi ? '<span class="check"></span>' : ''}
    <span class="total ${cls}">${a.total}</span>
    ${avatarHTML(a, color, 58)}
    <span class="nombre">${esc(nombreCorto(a))}</span>
    <span class="mini-nota ${UI.notaClase(a.nota, S.st.config.aprobatoria)}">Nota ${fmtNota(a.nota)}</span></button>`;
}

function ordenarAlumnos(lista) {
  const l = lista.slice();
  const nom = (x, y) => norm(x.nombres).localeCompare(norm(y.nombres));
  if (S.orden === 'nombre') l.sort(nom);
  else if (S.orden === 'puntos') l.sort((x, y) => y.total - x.total || nom(x, y));
  else l.sort((x, y) => (x.equipo || 99) - (y.equipo || 99) || nom(x, y));
  return l;
}

/** Hoja de puntos para uno o varios alumnos. fecha: para corregir una sesión pasada. */
function abrirPuntos(claves, { fecha } = {}) {
  const st = S.st;
  S.puntosCtx = { claves, fecha: fecha && fecha !== st.fecha ? fecha : null };
  const als = claves.map(alumnoDe).filter(Boolean);
  let head;
  if (als.length === 1) {
    const a = als[0];
    const e = equipoDe(a.equipo);
    head = `${avatarHTML(a, e.color, 56)}<div class="grow"><h3>${esc(nombreCompleto(a))}</h3>
      <div class="chips" style="margin-top:6px"><span class="badge" style="background:${e.color};color:${shade(e.color, .6)}">${esc(e.nombre)}</span>
      <span class="badge ${a.total < 0 ? 'neg' : 'pos'}">${a.total} pts</span>
      <span class="badge accent">Nota ${fmtNota(a.nota)}</span></div></div>
      <button class="btn" data-act="perfil" data-clave="${esc(a.clave)}">Ver perfil</button>`;
  } else {
    head = `<div class="fila">${als.slice(0, 4).map((a, i) => `<div style="margin-left:${i ? -14 : 0}px">${avatarHTML(a, colorEq(a.equipo), 40)}</div>`).join('')}</div>
      <div class="grow"><h3>${als.length === st.alumnos.length ? 'Toda la clase' : als.length + ' alumnos'}</h3></div>`;
  }
  const btn = (c, i) => `<button class="cat ${c.puntos < 0 ? 'neg' : ''}" data-act="dar" data-cat="${i}"><b>${signo(c.puntos)}</b><span>${esc(c.categoria)}</span></button>`;
  const pos = st.categorias.map((c, i) => [c, i]).filter(([c]) => c.puntos >= 0);
  const neg = st.categorias.map((c, i) => [c, i]).filter(([c]) => c.puntos < 0);
  UI.hoja(`<div class="hoja-head">${head}</div>
    ${S.puntosCtx.fecha ? `<p class="badge warn">Se registra en la sesión del ${esc(fmtFecha(S.puntosCtx.fecha))}</p>` : ''}
    <div class="cats-titulo">Suma</div><div class="cats">${pos.map(([c, i]) => btn(c, i)).join('')}</div>
    <div class="cats-titulo">Resta</div><div class="cats">${neg.map(([c, i]) => btn(c, i)).join('')}</div>`);
}

/** Registra puntos con respuesta inmediata en pantalla; el servidor confirma después. */
function darPuntos(claves, cat, fecha) {
  const st = S.st;
  const f = fecha || st.fecha;
  const hora = new Date().toTimeString().slice(0, 8);
  claves.forEach(k => {
    const a = alumnoDe(k);
    if (!a) return;
    a.total += cat.puntos;
    st.movs.push({ fecha: f, hora, curso: st.curso, clave: k, alumno: nombreCorto(a), categoria: cat.categoria, puntos: cat.puntos, origen: 'manual', nota: '', lote: 'tmp', regId: 'tmp' });
  });
  const eqs = new Set(claves.map(k => (alumnoDe(k) || {}).equipo));
  st.equipos.forEach(e => { if (eqs.has(e.equipo)) e.total = st.alumnos.filter(a => a.equipo === e.equipo).reduce((s, a) => s + a.total, 0); });
  render();
  claves.forEach(k => UI.flotar($(`.tarjeta[data-clave="${CSS.escape(k)}"]`), signo(cat.puntos), cat.puntos > 0));
  const quien = claves.length === 1 ? nombreCorto(alumnoDe(claves[0])) : claves.length + ' alumnos';
  UI.toast(`${quien} ${signo(cat.puntos)} ${cat.categoria}`, { accion: 'Deshacer', fn: deshacer });
  enviar('addMovs', [st.curso, 'manual', claves.map(k => ({ clave: k, categoria: cat.categoria, puntos: cat.puntos })), fecha || null], { silencio: true });
}

function deshacer() { enviar('undoLast', [S.st.curso]); }

Object.assign(Acciones, {
  tocar(el) {
    const k = el.dataset.clave;
    if (S.multi) { S.sel.has(k) ? S.sel.delete(k) : S.sel.add(k); render(); }
    else abrirPerfil(k);
  },
  orden(el) { S.orden = el.dataset.v; store.set('orden', S.orden); render(); },
  multi() { S.multi = !S.multi; S.sel.clear(); render(); },
  todos() { abrirPuntos(S.st.alumnos.map(a => a.clave)); },
  darVarios() { if (S.sel.size) abrirPuntos([...S.sel]); },
  dar(el) {
    const cat = S.st.categorias[+el.dataset.cat];
    const { claves, fecha } = S.puntosCtx;
    UI.cerrar();
    if (S.multi) { S.multi = false; S.sel.clear(); }
    darPuntos(claves, cat, fecha);
  },
  deshacer
});
