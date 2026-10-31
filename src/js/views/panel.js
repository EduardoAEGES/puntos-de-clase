/* Panel de la clase: indicadores, podio, gráficos y alumnos que necesitan atención. */

Views.panel = {
  render() {
    const st = S.st;
    const { escala, aprobatoria } = st.config;
    const al = st.alumnos;
    const conNota = al.filter(a => a.nota !== null);
    const prom = conNota.length ? conNota.reduce((s, a) => s + a.nota, 0) / conNota.length : null;
    const aprobados = conNota.filter(a => a.nota >= aprobatoria).length;

    // Asistencia por sesión
    const porSes = {};
    st.sesiones.forEach(s => { porSes[s.fecha] = { P: 0, T: 0, F: 0 }; });
    const faltas = {};
    st.movs.forEach(m => {
      const e = estadoAsis(m);
      if (!e || !porSes[m.fecha]) return;
      porSes[m.fecha][e]++;
      if (e === 'F') faltas[m.clave] = (faltas[m.clave] || 0) + 1;
    });
    const tot = { P: 0, T: 0, F: 0 };
    Object.values(porSes).forEach(x => { tot.P += x.P; tot.T += x.T; tot.F += x.F; });
    const nAsis = tot.P + tot.T + tot.F;

    let h = `<div class="seccion-head"><div><h2>Panel de la clase</h2>
      <p class="muted small">${esc(st.cursoInfo.nombre)} · ${esc(st.cursoInfo.seccion)}</p></div>
      <button class="btn" data-act="actualizarNotas">Actualizar hoja Notas</button></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${st.sesiones.length}</div><div class="l">Sesiones</div></div>
        <div class="kpi"><div class="v">${nAsis ? pct((tot.P + tot.T) / nAsis) : '—'}</div><div class="l">Asistencia</div></div>
        <div class="kpi"><div class="v">${nAsis ? pct(tot.P / nAsis) : '—'}</div><div class="l">Puntualidad</div></div>
        <div class="kpi"><div class="v ${prom !== null && prom < aprobatoria ? 'neg' : ''}">${fmtNota(prom)}</div><div class="l">Nota promedio</div></div>
        <div class="kpi"><div class="v">${conNota.length ? aprobados + '/' + conNota.length : '—'}</div><div class="l">Aprobando</div></div>
      </div><div class="panel-grid">`;

    // Podio
    const modo = S.podio || 'nota';
    let top = [];
    if (modo === 'equipos') {
      top = st.equipos.slice().sort((x, y) => y.total - x.total).slice(0, 3)
        .map(e => ({ html: `<div class="av" style="width:56px;height:56px;--av-bg:${e.color};--av-ink:${shade(e.color, .55)};font-size:20px"><span>${e.equipo}</span></div>`, n: e.nombre, v: e.total + ' pts' }));
    } else {
      const campo = modo === 'nota' ? 'nota' : 'total';
      top = al.filter(a => a[campo] !== null).sort((x, y) => y[campo] - x[campo] || y.total - x.total).slice(0, 3)
        .map(a => ({ html: avatarHTML(a, colorEq(a.equipo), 56), n: nombreCorto(a), v: modo === 'nota' ? fmtNota(a.nota) : a.total + ' pts', clave: a.clave }));
    }
    const lugar = (i, cls) => {
      const t = top[i];
      if (!t) return `<div class="p ${cls}"></div>`;
      return `<div class="p ${cls}" ${t.clave ? `data-act="perfil" data-clave="${esc(t.clave)}" role="button"` : ''}>
        ${i === 0 ? '<span class="corona">👑</span>' : ''}${t.html}<span class="n">${esc(t.n)}</span><span class="val">${esc(t.v)}</span>
        <div class="base">${i + 1}</div></div>`;
    };
    h += `<div class="card"><div class="fila" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><h3>Podio</h3>
      <div class="seg">${[['nota', 'Nota'], ['puntos', 'Puntos'], ['equipos', 'Equipos']].map(([k, l]) =>
        `<button class="${modo === k ? 'on' : ''}" data-act="podio" data-v="${k}">${l}</button>`).join('')}</div></div>
      ${top.length ? `<div class="podio">${lugar(1, 'p2')}${lugar(0, 'p1')}${lugar(2, 'p3')}</div>` : '<p class="muted">Todavía no hay datos.</p>'}</div>`;

    // Asistencia por sesión
    const grupos = st.sesiones.map(s => ({ x: 'S' + s.n, partes: [porSes[s.fecha].P, porSes[s.fecha].T, porSes[s.fecha].F] }));
    h += `<div class="card"><h3>Asistencia por sesión</h3>
      ${Charts.apiladas(grupos, ['var(--pos-line)', '#FCD34D', 'var(--neg-line)'])}
      <div class="leyenda"><span><i style="background:var(--pos-line)"></i>Puntual</span><span><i style="background:#FCD34D"></i>Tardanza</span><span><i style="background:var(--neg-line)"></i>Falta</span></div></div>`;

    // Nota promedio por sesión
    const serieProm = st.sesiones.map((s, i) => {
      const v = al.map(a => a.serie[i] && a.serie[i].nota).filter(x => x !== null && x !== undefined);
      return { x: 'S' + s.n, y: v.length ? v.reduce((p, q) => p + q, 0) / v.length : null };
    });
    h += `<div class="card"><h3>Nota promedio de la clase</h3>${Charts.linea(serieProm, { max: escala, ref: aprobatoria })}</div>`;

    h += `<div class="card"><h3>Distribución de notas</h3>${conNota.length ? Charts.histograma(conNota.map(a => a.nota), escala, aprobatoria) : '<p class="muted small">Aún no hay notas.</p>'}</div>`;

    // Atención
    const alerta = al.filter(a => (a.nota !== null && a.nota < aprobatoria) || (faltas[a.clave] || 0) >= 2)
      .sort((x, y) => (x.nota ?? 99) - (y.nota ?? 99));
    h += `<div class="card full"><h3>Necesitan atención</h3>${alerta.length ? `<div class="lista">${alerta.map(a => itemAlumno(a, {
      extra: [a.nota !== null && a.nota < aprobatoria ? 'Nota baja' : '', faltas[a.clave] ? faltas[a.clave] + ' faltas' : ''].filter(Boolean).join(' · ')
    })).join('')}</div>` : '<p class="muted small">Nadie por ahora. 🎉</p>'}</div>`;

    // Tabla de notas
    const orden = al.slice().sort((x, y) => (y.nota ?? -1) - (x.nota ?? -1) || y.total - x.total);
    h += `<div class="card full"><h3>Notas de todos</h3>
      <p class="muted small" style="margin:4px 0 6px">${st.componentes.map(c => esc(c.componente) + ' ' + c.peso + '%').join(' · ')}</p>
      <div class="lista">${orden.map(a => itemAlumno(a, { barras: true })).join('')}</div></div>`;

    return h + '</div>';
  }
};

function itemAlumno(a, { extra = '', barras = false } = {}) {
  const ap = S.st.config.aprobatoria;
  return `<button class="item" data-act="perfil" data-clave="${esc(a.clave)}">
    ${avatarHTML(a, colorEq(a.equipo), 42)}
    <div class="grow"><div class="t">${esc(nombreCompleto(a))}</div>
      <div class="s">${esc(equipoDe(a.equipo).nombre)} · ${a.total} pts${extra ? ' · ' + esc(extra) : ''}</div>
      ${barras ? `<div class="minibarras">${a.comps.map(c => `<div class="barra" title="${esc(c.componente)}: ${pct(c.logro)}"><i style="width:${c.logro === null ? 0 : Math.round(c.logro * 100)}%"></i></div>`).join('')}</div>` : ''}
    </div>
    <span class="nota-pill ${UI.notaClase(a.nota, ap)}">${fmtNota(a.nota)}</span></button>`;
}

Object.assign(Acciones, {
  podio(el) { S.podio = el.dataset.v; render(); },
  actualizarNotas() { enviar('actualizarNotas', [S.st.curso]); }
});
