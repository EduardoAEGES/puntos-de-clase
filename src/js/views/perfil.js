/* Perfil del alumno: nota, componentes, evolución y línea de tiempo por sesión.
   Lo usan el docente (con acciones) y la página pública de notas (solo lectura). */

const ASIS = { PUNTUALIDAD: 'P', TARDANZA: 'T', FALTA: 'F' };
const ASIS_TXT = { P: 'Puntual', T: 'Tardanza', F: 'Falta' };
const ASIS_COLOR = { P: 'var(--pos)', T: '#F59E0B', F: 'var(--neg)' };
const estadoAsis = mov => ASIS[norm(mov.categoria)] || null;

const Perfil = {
  /**
   * d: { alumno, equipo, curso, sesiones, movs (del alumno), componentes, escala, aprobatoria, avatarEstilo }
   */
  html(d, { publico = false } = {}) {
    const a = d.alumno;
    const color = d.equipo ? d.equipo.color : '#E5E7EB';
    const cls = UI.notaClase(a.nota, d.aprobatoria);
    const cuenta = { P: 0, T: 0, F: 0 };
    d.movs.forEach(m => { const e = estadoAsis(m); if (e) cuenta[e]++; });

    let h = `<div class="perfil-top">
      ${avatarHTML(a, color, 84, d.avatarEstilo)}
      <div class="grow">
        <h2>${esc(nombreCompleto(a))}</h2>
        <p class="muted small" style="margin:4px 0 8px">${esc(d.curso.nombre)} · ${esc(d.curso.seccion)}</p>
        <div class="chips">
          ${d.equipo ? `<span class="badge" style="background:${color};color:${shade(color, .6)}">${esc(d.equipo.nombre)}</span>` : ''}
          <span class="badge ${a.total < 0 ? 'neg' : 'pos'}">${a.total} puntos</span>
          <span class="badge">${d.sesiones.length} sesiones</span>
        </div>
      </div>
      <div class="nota-grande ${cls}"><div class="v">${fmtNota(a.nota)}</div><div class="l">de ${d.escala}</div></div>
    </div>`;

    if (!publico) {
      h += `<div class="chips" style="margin-top:14px">
        <button class="btn primary" data-act="puntosPerfil" data-clave="${esc(a.clave)}">${ICON.estrella}Dar puntos</button>
        <button class="btn" data-act="editarAlumno" data-clave="${esc(a.clave)}">${ICON.lapiz}Editar</button>
        <button class="btn" data-act="elegirAvatar" data-clave="${esc(a.clave)}">Avatar</button>
      </div>`;
    }

    // Componentes de la nota
    h += `<div class="card" style="margin-top:14px"><h3>Cómo va su nota</h3>`;
    (a.comps || []).forEach(c => {
      const w = c.logro === null ? 0 : Math.round(c.logro * 100);
      h += `<div class="comp"><div class="fila"><span>${esc(c.componente)} <span class="muted small">· ${c.peso}%</span></span>
        <span>${c.logro === null ? '<span class="muted small">Aún no cuenta</span>' : w + '%'}</span></div>
        <div class="barra"><i style="width:${w}%;background:${w < (d.aprobatoria / d.escala) * 100 ? 'var(--neg-line)' : 'var(--pos-line)'}"></i></div>
        <div class="muted small" style="margin-top:4px">${c.puntos} de ${c.posible} puntos posibles</div></div>`;
    });
    h += `<div class="asis-resumen">
        <div style="background:var(--pos-bg);color:var(--pos)"><b>${cuenta.P}</b>Puntual</div>
        <div style="background:var(--warn-bg);color:var(--warn)"><b>${cuenta.T}</b>Tardanza</div>
        <div style="background:var(--neg-bg);color:var(--neg)"><b>${cuenta.F}</b>Falta</div>
      </div></div>`;

    // Evolución
    h += `<div class="card"><h3>Evolución de la nota</h3>
      ${Charts.linea((a.serie || []).map(s => ({ x: 'S' + s.n, y: s.nota })), { max: d.escala, ref: d.aprobatoria })}
      <div class="leyenda"><span><i style="background:var(--accent)"></i>Nota acumulada</span><span><i style="background:var(--neg)"></i>Aprobatoria (${d.aprobatoria})</span></div></div>`;

    // Línea de tiempo
    h += `<div class="card"><h3>Línea de tiempo</h3><div class="timeline">`;
    const porFecha = {};
    d.movs.forEach(m => { (porFecha[m.fecha] = porFecha[m.fecha] || []).push(m); });
    d.sesiones.slice().reverse().forEach(s => {
      const ms = (porFecha[s.fecha] || []).slice().sort((x, y) => x.hora.localeCompare(y.hora));
      const asis = ms.map(estadoAsis).find(Boolean);
      const sub = ms.reduce((t, m) => t + m.puntos, 0);
      h += `<div class="tl-ses" style="--tl:${asis ? ASIS_COLOR[asis] : 'var(--line)'}">
        <div class="tl-head"><b>Sesión ${s.n}</b><span class="muted small">${esc(fmtFecha(s.fecha))}${s.tema ? ' · ' + esc(s.tema) : ''}</span>
          ${asis ? `<span class="badge ${asis === 'P' ? 'pos' : asis === 'T' ? 'warn' : 'neg'}">${ASIS_TXT[asis]}</span>` : ''}
          ${ms.length ? `<span class="badge ${sub < 0 ? 'neg' : 'pos'}">${signo(sub)}</span>` : ''}
          ${!publico ? `<button class="btn ghost small" style="min-height:32px;padding:4px 8px" data-act="corregir" data-clave="${esc(a.clave)}" data-fecha="${s.fecha}">Corregir</button>` : ''}
        </div>
        <div class="tl-movs">${ms.length ? ms.map(m => `<span class="tl-mov ${m.puntos < 0 ? 'neg' : ''}" ${!publico && m.regId !== 'tmp' ? `data-act="borrarMov" data-reg="${esc(m.regId)}" role="button" title="Tocar para borrar"` : ''}>
            ${signo(m.puntos)} ${esc(m.categoria)} <small>${esc(m.hora.slice(0, 5))}${m.nota ? ' · ' + esc(m.nota) : ''}</small></span>`).join('')
          : '<span class="muted small">Sin registros en esta sesión</span>'}</div>
      </div>`;
    });
    if (!d.sesiones.length) h += '<p class="muted small">Aún no hay sesiones.</p>';
    h += '</div></div>';
    return h;
  },

  /** Datos del perfil a partir del estado del docente. */
  datos(clave) {
    const st = S.st;
    const a = alumnoDe(clave);
    return {
      alumno: a, equipo: equipoDe(a.equipo), curso: st.cursoInfo, sesiones: st.sesiones,
      movs: st.movs.filter(m => m.clave === clave), componentes: st.componentes,
      escala: st.config.escala, aprobatoria: st.config.aprobatoria, avatarEstilo: st.config.avatarEstilo
    };
  }
};

function abrirPerfil(clave) {
  S.perfilAbierto = clave;
  UI.hoja(`<div class="fila" style="justify-content:flex-end"><button class="icon-btn" data-act="cerrar" aria-label="Cerrar">${ICON.x}</button></div>
    ${Perfil.html(Perfil.datos(clave))}`, { ancha: true, alCerrar: () => { S.perfilAbierto = null; } });
}

function abrirEditarAlumno(clave) {
  const a = alumnoDe(clave);
  const st = S.st;
  const nEq = Math.max(st.equipos.length, ...st.alumnos.map(x => x.equipo || 0)) + 1;
  const opts = [];
  for (let i = 1; i <= nEq; i++) {
    const e = equipoDe(i);
    opts.push(`<option value="${i}" ${a.equipo === i ? 'selected' : ''}>${esc(e.nombre)}${i === nEq ? ' (nuevo)' : ''}</option>`);
  }
  UI.hoja(`<div class="hoja-head">${avatarHTML(a, colorEq(a.equipo), 48)}<div class="grow"><h3>${esc(nombreCompleto(a))}</h3></div></div>
    <div class="stack">
      <label class="campo">DNI<input type="tel" inputmode="numeric" maxlength="8" id="ed-dni" value="${esc(a.dni)}" placeholder="8 dígitos"></label>
      <label class="campo">ID CERTUS<input type="text" id="ed-id" value="${esc(a.id)}"></label>
      <label class="campo">Equipo<select id="ed-eq">${opts.join('')}</select></label>
      <button class="btn primary block" data-act="guardarAlumno" data-clave="${esc(clave)}">Guardar</button>
    </div>`);
}

function abrirAvatar(clave, estilo) {
  const a = alumnoDe(clave);
  const actual = avatarDe(a, S.st.config.avatarEstilo);
  estilo = estilo || (actual ? actual.estilo : 'adventurer');
  const semillas = Array.from({ length: 16 }, (_, i) => i === 0 ? a.clave + ' ' + a.nombres : a.nombres + '-' + i);
  const color = colorEq(a.equipo);
  UI.hoja(`<div class="hoja-head"><div class="grow"><h3>Avatar de ${esc(nombreCorto(a))}</h3></div>
      <button class="icon-btn" data-act="cerrar">${ICON.x}</button></div>
    <div class="chips">${ESTILOS.map(e => `<button class="chip ${e.id === estilo ? 'on' : ''}" data-act="avatarEstilo" data-clave="${esc(clave)}" data-estilo="${e.id}">${e.nombre}</button>`).join('')}
      <button class="chip" data-act="ponerAvatar" data-clave="${esc(clave)}" data-v="iniciales">Iniciales</button></div>
    <div class="avatar-grid">${semillas.map(s => {
      const v = estilo + ':' + s;
      const on = actual && actual.estilo === estilo && actual.semilla === s;
      return `<button class="${on ? 'on' : ''}" data-act="ponerAvatar" data-clave="${esc(clave)}" data-v="${esc(v)}">${avatarHTML({ ...a, avatar: v }, color, 60)}</button>`;
    }).join('')}</div>`, { ancha: true });
}

Object.assign(Acciones, {
  perfil(el) { abrirPerfil(el.dataset.clave); },
  cerrar() { UI.cerrar(); },
  puntosPerfil(el) { abrirPuntos([el.dataset.clave]); },
  corregir(el) { abrirPuntos([el.dataset.clave], { fecha: el.dataset.fecha }); },
  editarAlumno(el) { abrirEditarAlumno(el.dataset.clave); },
  guardarAlumno(el) {
    const k = el.dataset.clave;
    const dni = $('#ed-dni').value.replace(/\D/g, '');
    if (dni && dni.length !== 8) return UI.toast('El DNI debe tener 8 dígitos', { error: true });
    const cambios = { dni, id: $('#ed-id').value.trim(), equipo: +$('#ed-eq').value };
    Object.assign(alumnoDe(k), cambios);
    UI.cerrar();
    enviar('updateAlumno', [S.st.curso, k, cambios]).then(() => abrirPerfil(k));
  },
  elegirAvatar(el) { abrirAvatar(el.dataset.clave); },
  avatarEstilo(el) { abrirAvatar(el.dataset.clave, el.dataset.estilo); },
  ponerAvatar(el) {
    const k = el.dataset.clave;
    alumnoDe(k).avatar = el.dataset.v;
    abrirPerfil(k);
    render();
    enviar('updateAlumno', [S.st.curso, k, { avatar: el.dataset.v }], { silencio: true });
  },
  borrarMov(el) {
    const m = S.st.movs.find(x => x.regId === el.dataset.reg);
    if (!m || !confirm(`¿Borrar ${signo(m.puntos)} ${m.categoria} de ${m.alumno} (${fmtFecha(m.fecha)})?`)) return;
    const k = S.perfilAbierto;
    enviar('deleteMov', [S.st.curso, m.regId]).then(() => { if (k) abrirPerfil(k); });
  }
});
