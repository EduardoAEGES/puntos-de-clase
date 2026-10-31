/* Sesiones: histórico de cada clase, con sus movimientos, corrección y deshacer. */

const ORIGEN_TXT = { manual: 'Puntos a mano', asistencia: 'Asistencia', chat: 'Chat' };

Views.sesiones = {
  render() {
    return S.sesSel ? detalleSesion(S.sesSel) : listaSesiones();
  }
};

function listaSesiones() {
  const st = S.st;
  const hayHoy = st.sesiones.some(s => s.fecha === st.fecha);
  let h = `<div class="seccion-head"><div><h2>Sesiones</h2><p class="muted small">${st.sesiones.length} clases registradas</p></div>
    ${hayHoy ? '' : `<button class="btn primary" data-act="iniciarSesion">${ICON.mas}Iniciar sesión de hoy</button>`}</div>`;
  if (!st.sesiones.length) return h + `<div class="card vacio">${ICON.sesiones}<p>Aún no hay sesiones. Se crean solas al dar el primer punto del día.</p></div>`;
  h += '<div class="stack">';
  st.sesiones.slice().reverse().forEach(s => {
    const ms = st.movs.filter(m => m.fecha === s.fecha);
    const mas = ms.filter(m => m.puntos > 0).reduce((t, m) => t + m.puntos, 0);
    const menos = ms.filter(m => m.puntos < 0).reduce((t, m) => t + m.puntos, 0);
    h += `<button class="card sesion-card" data-act="verSesion" data-fecha="${s.fecha}">
      <div class="sesion-num"><b>${s.n}</b>sesión</div>
      <div class="grow" style="flex:1;min-width:0"><div class="t" style="font-weight:800">${esc(fmtFecha(s.fecha))}${s.fecha === st.fecha ? ' · hoy' : ''}</div>
        <div class="muted small">${esc(s.tema || 'Sin tema')}</div>
        <div class="chips" style="margin-top:6px"><span class="badge pos">+${mas}</span><span class="badge neg">${menos}</span>
          ${s.tarea ? '<span class="badge accent">Tarea</span>' : ''}<span class="badge">${ms.length} mov.</span></div></div>
    </button>`;
  });
  return h + '</div>';
}

function detalleSesion(fecha) {
  const st = S.st;
  const s = st.sesiones.find(x => x.fecha === fecha) || { n: '—', fecha, tema: '', tarea: false, comentario: '' };
  const ms = st.movs.filter(m => m.fecha === fecha);
  const asis = { P: 0, T: 0, F: 0 };
  ms.forEach(m => { const e = estadoAsis(m); if (e) asis[e]++; });

  let h = `<div class="seccion-head"><div><button class="btn ghost" style="padding-left:0" data-act="volverSesiones">← Sesiones</button>
      <h2>Sesión ${s.n} · ${esc(fmtFecha(fecha))}</h2></div>
    <div class="chips">
      ${fecha === st.fecha ? `<button class="btn" data-act="deshacer">${ICON.deshacer}Deshacer último</button>` : ''}
      <button class="btn primary" data-act="agregarEnSesion" data-fecha="${fecha}">${ICON.mas}Agregar puntos</button>
    </div></div>
    <div class="card"><div class="grid2">
      <label class="campo">Tema<input type="text" id="ses-tema" value="${esc(s.tema)}" placeholder="Ej. Proposiciones lógicas"></label>
      <label class="campo">Comentario<input type="text" id="ses-com" value="${esc(s.comentario)}" placeholder="Opcional"></label></div>
      <label class="fila small" style="margin-top:12px;font-weight:800"><input type="checkbox" id="ses-tarea" ${s.tarea ? 'checked' : ''} style="width:20px;height:20px">
        Hubo tarea en esta sesión (cuenta para la nota de Tareas)</label>
      <div class="fila" style="margin-top:12px;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div class="chips"><span class="badge pos">Puntual ${asis.P}</span><span class="badge warn">Tardanza ${asis.T}</span><span class="badge neg">Falta ${asis.F}</span></div>
        <button class="btn" data-act="guardarSesion" data-fecha="${fecha}">Guardar</button></div></div>`;

  // Movimientos agrupados por lote (cada toque o cada confirmación)
  const lotes = [];
  const idx = {};
  ms.forEach(m => {
    if (!(m.lote in idx)) { idx[m.lote] = lotes.length; lotes.push({ lote: m.lote, origen: m.origen, hora: m.hora, movs: [] }); }
    lotes[idx[m.lote]].movs.push(m);
  });
  h += `<div class="card"><h3>Movimientos (${ms.length})</h3>`;
  if (!lotes.length) h += '<p class="muted small">Sin movimientos en esta sesión.</p>';
  lotes.reverse().forEach(l => {
    const sum = l.movs.reduce((t, m) => t + m.puntos, 0);
    h += `<div class="lote"><div class="lote-head"><span class="grow">${esc(ORIGEN_TXT[l.origen] || l.origen)} · ${esc(l.hora.slice(0, 5))}</span>
      <span>${l.movs.length}</span><span class="badge ${sum < 0 ? 'neg' : 'pos'}">${signo(sum)}</span></div>`;
    l.movs.forEach(m => {
      const a = alumnoDe(m.clave);
      h += `<div class="mov">${a ? avatarHTML(a, colorEq(a.equipo), 28) : ''}
        <div class="grow"><b>${esc(a ? nombreCorto(a) : m.alumno)}</b> · ${esc(m.categoria)}${m.nota ? ` <span class="muted small">· ${esc(m.nota)}</span>` : ''}</div>
        <span class="badge ${m.puntos < 0 ? 'neg' : 'pos'}">${signo(m.puntos)}</span>
        ${m.regId !== 'tmp' ? `<button class="x" data-act="borrarMov" data-reg="${esc(m.regId)}" aria-label="Borrar">${ICON.x}</button>` : ''}</div>`;
    });
    h += '</div>';
  });
  return h + '</div>';
}

Object.assign(Acciones, {
  verSesion(el) { S.sesSel = el.dataset.fecha; render(); window.scrollTo(0, 0); },
  volverSesiones() { S.sesSel = null; render(); },
  iniciarSesion() { enviar('saveSesion', [S.st.curso, S.st.fecha, {}]); },
  guardarSesion(el) {
    enviar('saveSesion', [S.st.curso, el.dataset.fecha, { tema: $('#ses-tema').value.trim(), comentario: $('#ses-com').value.trim(), tarea: $('#ses-tarea').checked }]);
  },
  agregarEnSesion(el) {
    const fecha = el.dataset.fecha;
    const lista = S.st.alumnos.slice().sort((x, y) => norm(x.nombres).localeCompare(norm(y.nombres)));
    UI.hoja(`<div class="hoja-head"><div class="grow"><h3>¿A quién?</h3><p class="muted small">Sesión del ${esc(fmtFecha(fecha))}</p></div>
      <button class="icon-btn" data-act="cerrar">${ICON.x}</button></div>
      <button class="btn block" data-act="puntosSesionTodos" data-fecha="${fecha}">Toda la clase</button>
      <div class="lista" style="margin-top:8px">${lista.map(a => `<button class="item" data-act="corregir" data-clave="${esc(a.clave)}" data-fecha="${fecha}">
        ${avatarHTML(a, colorEq(a.equipo), 36)}<div class="grow"><div class="t">${esc(nombreCompleto(a))}</div></div></button>`).join('')}</div>`);
  },
  puntosSesionTodos(el) { abrirPuntos(S.st.alumnos.map(a => a.clave), { fecha: el.dataset.fecha }); }
});
