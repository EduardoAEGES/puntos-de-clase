/* Ajustes: calificación (pesos), avatares, página de notas e importación de alumnos. */

Views.ajustes = {
  render() {
    const st = S.st;
    const c = st.cursoInfo;
    if (!S.cal || S.cal.curso !== st.curso) S.cal = nuevoBorradorCal();
    const K = S.cal;
    const sumaPesos = K.comps.reduce((s, x) => s + (+x.peso || 0), 0);
    const urlNotas = st.urlApp ? st.urlApp + '?v=notas' : '';

    let h = `<div class="seccion-head"><div><h2>Ajustes</h2><p class="muted small">${esc(c.nombre)} · ${esc(c.seccion)}</p></div></div><div class="stack">`;

    // Curso
    h += `<div class="card"><h3>Curso</h3>
      <p class="small" style="line-height:1.7;margin:8px 0 0">
        <b>Días:</b> ${esc(c.dias || '—')} · <b>Inicio:</b> ${esc(c.hora)} · <b>Tolerancia:</b> ${c.tolerancia} min<br>
        <b>Tope de participación:</b> ${c.tope} por clase · <b>Modalidad:</b> ${esc(c.modalidad || '—')}${c.plataforma ? ' (' + esc(c.plataforma) + ')' : ''}${c.nrc ? ' · <b>NRC</b> ' + esc(c.nrc) : ''}</p>
      <p class="muted small">Para cambiar estos datos o agregar cursos, edita la hoja <b>Cursos</b> del Sheets.</p></div>`;

    // Calificación
    h += `<div class="card"><h3>Calificación</h3>
      <p class="muted small" style="margin:6px 0 0">Cada componente vale su peso. Su logro es: puntos obtenidos ÷ (máximo por sesión × sesiones que cuentan).</p>
      <div class="comp-edit head"><span>Componente</span><span>Peso %</span><span>Máx/ses.</span><span class="ses">Cuenta en</span><span class="del"></span></div>`;
    K.comps.forEach((x, i) => {
      h += `<div class="comp-edit">
        <input type="text" value="${esc(x.componente)}" data-chg="calComp" data-i="${i}" data-f="componente">
        <input type="number" min="0" value="${x.peso}" data-chg="calComp" data-i="${i}" data-f="peso">
        <input type="number" min="0" step="0.5" value="${x.max}" data-chg="calComp" data-i="${i}" data-f="max">
        <select class="ses" data-chg="calComp" data-i="${i}" data-f="sesiones">
          <option ${x.sesiones === 'Todas' ? 'selected' : ''}>Todas</option><option ${x.sesiones === 'Con tarea' ? 'selected' : ''}>Con tarea</option></select>
        <button class="icon-btn del" data-act="calQuitar" data-i="${i}" aria-label="Quitar">${ICON.x}</button></div>`;
    });
    h += `<button class="btn ghost" style="margin-top:6px" data-act="calAgregar">${ICON.mas}Agregar componente</button>
      <div class="formula">Nota = ${st.config.escala} × (${K.comps.map(x => `${+x.peso || 0}% × ${esc(x.componente)}`).join(' + ') || '…'}) ÷ ${sumaPesos}%
        ${sumaPesos !== 100 ? `<br><span class="neg small">Los pesos suman ${sumaPesos}%. Se reparten en proporción, pero conviene que sumen 100.</span>` : ''}</div>
      <h3 style="margin-top:16px">Cada categoría suma en…</h3><div class="lista">`;
    st.categorias.forEach(cat => {
      h += `<div class="item"><span class="badge ${cat.puntos < 0 ? 'neg' : 'pos'}">${signo(cat.puntos)}</span><div class="grow t">${esc(cat.categoria)}</div>
        <select style="max-width:170px" data-chg="calCat" data-cat="${esc(cat.categoria)}">
          <option value="">No cuenta en la nota</option>
          ${K.comps.map(x => `<option ${K.cats[cat.categoria] === x.componente ? 'selected' : ''}>${esc(x.componente)}</option>`).join('')}
        </select></div>`;
    });
    h += `</div><label class="fila small" style="margin-top:12px;font-weight:800">
        <input type="checkbox" ${K.solo ? 'checked' : ''} data-chg="calSolo" style="width:20px;height:20px">
        Usar estos pesos solo en este curso (si no, cambian los de todos los cursos sin pesos propios)</label>
      <div class="grid2" style="margin-top:12px">
        <label class="campo">Nota máxima<input type="number" value="${st.config.escala}" data-chg="cfg" data-k="escala_nota"></label>
        <label class="campo">Nota aprobatoria<input type="number" value="${st.config.aprobatoria}" data-chg="cfg" data-k="nota_aprobatoria"></label>
      </div>
      <button class="btn primary block" style="margin-top:12px" data-act="calGuardar">Guardar calificación</button></div>`;

    // Avatares
    h += `<div class="card"><h3>Avatares</h3><p class="muted small" style="margin:6px 0 10px">Estilo para los alumnos sin avatar elegido. Cada uno se cambia desde su perfil.</p>
      <div class="chips">${ESTILOS.concat([{ id: 'iniciales', nombre: 'Iniciales' }]).map(e =>
        `<button class="chip ${st.config.avatarEstilo === e.id ? 'on' : ''}" data-act="estiloDef" data-v="${e.id}">${e.nombre}</button>`).join('')}</div>
      <div class="fila" style="margin-top:12px;gap:6px;flex-wrap:wrap">${st.alumnos.slice(0, 8).map(a => avatarHTML(a, colorEq(a.equipo), 40)).join('')}</div></div>`;

    // Página de notas
    h += `<div class="card"><h3>Página de notas para alumnos</h3>
      <p class="muted small" style="margin:6px 0 10px">Cada alumno entra con su DNI y ve su nota, su avance y su línea de tiempo. Solo ve lo suyo.
        ${st.alumnos.filter(a => !a.dni).length ? `<br><b>${st.alumnos.filter(a => !a.dni).length} alumnos aún no tienen DNI</b>: cárgalo al importar o desde su perfil.` : ''}</p>
      ${urlNotas ? `<input type="text" readonly value="${esc(urlNotas)}" onclick="this.select()">
      <div class="chips" style="margin-top:8px"><button class="btn" data-act="copiar" data-v="${esc(urlNotas)}">${ICON.enlace}Copiar enlace</button>
        <a class="btn ghost" href="${esc(urlNotas)}" target="_blank" rel="noopener">Abrir</a></div>` : '<p class="small">El enlace aparece cuando publicas la app.</p>'}</div>`;

    // Importar
    h += `<div class="card"><h3>Importar alumnos a este curso</h3>
      <p class="muted small" style="margin:6px 0 10px">Copia desde Excel las filas con cabecera (ID, DNI, Apellidos, Nombres, Correo) y pégalas. Si el alumno ya existe, se actualizan su ID, DNI y correo.</p>`;
    if (!S.imp) {
      h += `<textarea id="imp-texto" placeholder="ID&#9;DNI&#9;Apellidos&#9;Nombres&#9;Correo"></textarea>
        <button class="btn primary" style="margin-top:10px" data-act="impRevisar">Revisar</button>`;
    } else {
      const n = S.imp.filter(r => r.incluir).length;
      h += `<div class="lista">${S.imp.map((r, i) => `<label class="item">
          <input type="checkbox" ${r.incluir ? 'checked' : ''} data-chg="impIncluir" data-i="${i}" style="width:20px;height:20px">
          <div class="grow"><div class="t">${esc(tc(r.apellidos))}, ${esc(tc(r.nombres))}</div>
          <div class="s">${esc([r.id && 'ID ' + r.id, r.dni && 'DNI ' + r.dni, r.correo, r.rol].filter(Boolean).join(' · ') || 'Sin datos extra')}</div></div></label>`).join('')}</div>
        <div class="chips" style="margin-top:10px"><button class="btn" data-act="impCancelar">Cancelar</button>
        <button class="btn primary" data-act="impGuardar" ${n ? '' : 'disabled'}>Importar ${n}</button></div>`;
    }
    h += '</div>';

    // Cuenta
    h += `<div class="card"><h3>Sesión</h3><div class="chips" style="margin-top:10px">
      <button class="btn" data-act="recargar">Recargar datos</button>
      <button class="btn neg" data-act="salir">${ICON.salir}Salir de este equipo</button>
      ${window.devDemo ? `<button class="btn" data-act="devDemo">Cargar datos de prueba</button><button class="btn" data-act="devReset">Borrar datos de prueba</button>` : ''}
    </div><p class="muted small">Salir borra el PIN guardado en este navegador.</p></div>`;

    return h + '</div>';
  }
};

function nuevoBorradorCal() {
  const st = S.st;
  const cats = {};
  st.categorias.forEach(c => { cats[c.categoria] = c.componente; });
  return { curso: st.curso, comps: st.componentes.map(c => ({ ...c })), cats, solo: st.componentesPropios };
}

/** Lee filas pegadas desde Excel. Usa la cabecera si la hay; si no, adivina por el contenido. */
function parseImport(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  const sep = lineas.some(l => l.includes('\t')) ? '\t' : lineas.some(l => l.includes(';')) ? ';' : null;
  const celdas = l => sep ? l.split(sep).map(x => x.trim()) : [l.trim()];
  let cols = null;
  const out = [];
  const partir = (s, r) => {
    if (s.includes(',')) { const [a, ...b] = s.split(','); r.apellidos = a.trim(); r.nombres = b.join(' ').trim(); }
    else { const t = s.trim().split(/\s+/); r.apellidos = t.slice(0, 2).join(' '); r.nombres = t.slice(2).join(' '); }
  };
  lineas.forEach(l => {
    const c = celdas(l);
    const nc = c.map(norm);
    if (!cols && !c.some(x => x.includes('@')) && nc.some(x => /APELLIDO|NOMBRE|CORREO|EMAIL|DNI/.test(x))) {
      const comp = nc.findIndex(x => /APELLIDOS? Y NOMBRES?|NOMBRE COMPLETO|APELLIDOS NOMBRES|PARTICIPANTE/.test(x));
      cols = {
        comp,
        ape: nc.findIndex((x, i) => i !== comp && /APELLIDO/.test(x)),
        nom: nc.findIndex((x, i) => i !== comp && /NOMBRE/.test(x) && !/APELLIDO/.test(x)),
        correo: nc.findIndex(x => /CORREO|EMAIL|MAIL/.test(x)),
        dni: nc.findIndex(x => /DNI|DOCUMENTO/.test(x)),
        id: nc.findIndex(x => /^ID\b|CODIGO|^ID /.test(x)),
        rol: nc.findIndex(x => /ROL/.test(x))
      };
      return;
    }
    const r = { id: '', dni: '', apellidos: '', nombres: '', correo: '', rol: '' };
    const v = i => (i >= 0 && c[i]) ? c[i] : '';
    if (cols) {
      r.id = v(cols.id); r.dni = v(cols.dni).replace(/\D/g, ''); r.correo = v(cols.correo); r.rol = v(cols.rol);
      if (cols.comp >= 0) partir(v(cols.comp), r);
      else { r.apellidos = v(cols.ape); r.nombres = v(cols.nom); }
    } else {
      r.correo = c.find(x => x.includes('@')) || '';
      r.dni = c.find(x => /^\d{8}$/.test(x)) || '';
      r.id = c.find(x => x !== r.dni && /^[A-Za-z]{0,2}\d{4,}$/.test(x)) || '';
      const txt = c.filter(x => x && !x.includes('@') && x !== r.id && x !== r.dni && /[A-Za-zÀ-ÿ]{2}/.test(x));
      if (txt.length >= 2 && !txt[0].includes(',')) { r.apellidos = txt[0]; r.nombres = txt[1]; }
      else if (txt.length) partir(txt[0], r);
    }
    if (!r.apellidos && !r.nombres) return;
    r.incluir = !/DOCENTE|PROFESOR|INSTRUCTOR|TEACHER|EDITINGTEACHER/.test(norm(r.rol + ' ' + l));
    out.push(r);
  });
  return out;
}

Object.assign(Cambios, {
  calComp(el) {
    const x = S.cal.comps[+el.dataset.i];
    const f = el.dataset.f;
    const viejo = x.componente;
    x[f] = (f === 'peso' || f === 'max') ? (+el.value || 0) : el.value;
    if (f === 'componente') Object.keys(S.cal.cats).forEach(k => { if (S.cal.cats[k] === viejo) S.cal.cats[k] = el.value; });
    render();
  },
  calCat(el) { S.cal.cats[el.dataset.cat] = el.value; },
  calSolo(el) { S.cal.solo = el.checked; },
  cfg(el) { enviar('saveConfig', [S.st.curso, el.dataset.k, +el.value]); },
  impIncluir(el) { S.imp[+el.dataset.i].incluir = el.checked; render(); }
});

Object.assign(Acciones, {
  calAgregar() { S.cal.comps.push({ componente: 'Nuevo', peso: 0, max: 1, sesiones: 'Todas' }); render(); },
  calQuitar(el) { S.cal.comps.splice(+el.dataset.i, 1); render(); },
  calGuardar() {
    const K = S.cal;
    if (!K.comps.length) return UI.toast('Agrega al menos un componente', { error: true });
    if (K.comps.some(x => !x.componente.trim())) return UI.toast('Cada componente necesita nombre', { error: true });
    enviar('saveCalificacion', [S.st.curso, K.comps, K.cats, K.solo]).then(() => { S.cal = null; render(); });
  },
  estiloDef(el) { S.st.config.avatarEstilo = el.dataset.v; render(); enviar('saveConfig', [S.st.curso, 'avatar_estilo', el.dataset.v]); },
  copiar(el) {
    const v = el.dataset.v;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
      .then(() => UI.toast('Enlace copiado'), () => UI.toast('Mantén presionado el enlace para copiarlo'));
  },
  impRevisar() {
    const t = $('#imp-texto').value;
    const filas = parseImport(t);
    if (!filas.length) return UI.toast('No encontré alumnos en lo pegado', { error: true });
    S.imp = filas;
    render();
  },
  impCancelar() { S.imp = null; render(); },
  impGuardar() {
    const items = S.imp.filter(r => r.incluir).map(({ id, dni, apellidos, nombres, correo }) => ({ id, dni, apellidos, nombres, correo }));
    enviar('importAlumnos', [S.st.curso, items]).then(() => { S.imp = null; render(); });
  },
  recargar: () => recargar(),
  salir() { if (confirm('¿Salir? Tendrás que escribir tu PIN otra vez.')) { Api.olvidarPin(); location.reload(); } },
  devDemo() { if (confirm('Crea 8 sesiones pasadas con datos al azar en Pensamiento Lógico 105M.')) window.devDemo(); },
  devReset() { if (confirm('¿Borrar todos los datos de prueba?')) window.devReset(); }
});
