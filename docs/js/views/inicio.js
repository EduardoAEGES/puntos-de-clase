/* Inicio: todos los cursos en tarjetas con portada 3D. Al tocar uno se entra a su clase. */

Views.inicio = {
  render() {
    const R = S.resumen;
    if (!R) {
      cargarResumen();
      return '<div class="cargando"><div class="spinner"></div><p>Cargando cursos…</p></div>';
    }
    const ahora = cursoAhora(R.cursos.map(c => c.info));
    const hoy = norm(DIAS[new Date().getDay()]);
    const alumnos = R.cursos.reduce((s, c) => s + c.alumnos.length, 0);
    const proms = R.cursos.filter(c => c.promedio !== null);
    const promGeneral = proms.length ? proms.reduce((s, c) => s + c.promedio * c.alumnos.length, 0) / proms.reduce((s, c) => s + c.alumnos.length, 0) : null;
    const asis = R.cursos.filter(c => c.asistencia !== null);
    const asisGeneral = asis.length ? asis.reduce((s, c) => s + c.asistencia, 0) / asis.length : null;

    let h = `<div class="seccion-head"><div><h2>Mis cursos</h2>
        <p class="muted small">${esc(tc(fmtFecha(R.fecha)))} · ${R.cursos.length} cursos</p></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${R.cursos.length}</div><div class="l">Cursos</div></div>
        <div class="kpi"><div class="v">${alumnos}</div><div class="l">Alumnos</div></div>
        <div class="kpi"><div class="v ${promGeneral !== null && promGeneral < R.aprobatoria ? 'neg' : ''}">${fmtNota(promGeneral)}</div><div class="l">Promedio general</div></div>
        <div class="kpi"><div class="v">${pct(asisGeneral)}</div><div class="l">Asistencia</div></div>
      </div>
      <div class="cursos-grid">`;

    R.cursos.forEach((c, i) => {
      const info = c.info;
      const t = temaCurso(info, i);
      const eqColor = n => (c.equipos.find(e => e.equipo === n) || {}).color || '#E5E7EB';
      const esHoy = norm(info.dias).split(' ').includes(hoy);
      const lider = c.alumnos.slice().sort((x, y) => y.participacion - x.participacion || (y.nota ?? 0) - (x.nota ?? 0))[0];
      const mejor = c.alumnos.filter(a => a.nota !== null).sort((x, y) => y.nota - x.nota)[0];
      h += `<button class="curso-card" style="${t.estilo}" data-act="abrirCurso" data-curso="${esc(info.curso)}">
        <div class="cc-portada">
          ${objeto3D(t.tipo)}
          <span class="cc-num">${String(i + 1).padStart(2, '0')}</span>
          ${ahora === info.curso ? '<span class="cc-estado vivo">● En clase</span>' : esHoy ? '<span class="cc-estado">Hoy</span>' : ''}
        </div>
        <div class="cc-top">
          <div class="cc-tit"><b>${esc(info.nombre)}</b><span>${esc(info.seccion)}</span></div>
        </div>
        <div class="cc-meta">${esc(info.modalidad || '')}${info.dias ? ' · ' + esc(info.dias) : ''} · ${esc(info.hora)}</div>
        <div class="cc-avatares">${c.alumnos.slice(0, 6).map(a => avatarHTML(a, eqColor(a.equipo), 40, R.avatarEstilo)).join('')}
          ${c.alumnos.length > 6 ? `<span class="cc-mas">+${c.alumnos.length - 6}</span>` : ''}
          ${!c.alumnos.length ? '<span class="muted small">Sin alumnos todavía</span>' : ''}</div>
        <div class="cc-stats">
          <div><span class="nota-pill ${UI.notaClase(c.promedio, R.aprobatoria)}">${fmtNota(c.promedio)}</span><small>Promedio</small></div>
          <div><b>${pct(c.asistencia)}</b><small>Asistencia</small></div>
          <div><b>${c.sesiones}</b><small>Sesiones</small></div>
          <div><b>${c.alumnos.length}</b><small>Alumnos</small></div>
        </div>
        ${lider && lider.participacion ? `<div class="cc-lider">${avatarHTML(lider, eqColor(lider.equipo), 28, R.avatarEstilo)}
          <span>🏆 <b>${esc(nombreCorto(lider))}</b> participa más (${lider.participacion})${mejor && mejor.clave !== lider.clave ? ` · ⭐ mejor nota: ${esc(nombreCorto(mejor))} ${fmtNota(mejor.nota)}` : ''}</span></div>` : ''}
      </button>`;
    });
    return h + '</div>';
  }
};

function cargarResumen() {
  if (S.cargandoResumen) return;
  S.cargandoResumen = true;
  Api.call('getResumen')
    .then(r => { S.resumen = r; })
    .catch(e => UI.toast(e.message, { error: true }))
    .finally(() => { S.cargandoResumen = false; render(); });
}

Object.assign(Acciones, {
  abrirCurso(el) {
    const curso = el.dataset.curso;
    S.tab = 'clase';
    store.set('tab', S.tab);
    if (S.st && S.st.curso === curso) { render(); window.scrollTo(0, 0); return; }
    $('#app').innerHTML = '<div class="cargando"><div class="spinner"></div><p>Abriendo curso…</p></div>';
    Api.call('getState', curso).then(st => { aplicar(st, { silencio: true }); window.scrollTo(0, 0); })
      .catch(e => UI.toast(e.message, { error: true }));
  }
});
