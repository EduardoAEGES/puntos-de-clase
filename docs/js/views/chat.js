/* Participación desde el chat de BigBlueButton: cuenta mensajes por persona y sugiere puntos. */

Views.chat = {
  render() {
    const st = S.st;
    const c = st.cursoInfo;
    if (!S.chat) S.chat = { fecha: st.fecha, filas: null };
    const C = S.chat;
    let h = `<div class="seccion-head"><div><h2>Participación del chat</h2>
      <p class="muted small">Tope: ${c.tope} ${c.tope === 1 ? 'punto' : 'puntos'} de participación por alumno en cada clase</p></div>
      <label class="campo" style="width:170px">Sesión del<input type="date" value="${C.fecha}" data-chg="chatFecha" max="${st.fecha}"></label></div>`;

    if (!C.filas) {
      return h + `<div class="card">
        <p class="small muted" style="margin-top:0">En BigBlueButton abre el chat público, usa <b>⋮ → Copiar</b> (o <b>Guardar</b> y abre el archivo) y pega todo aquí.</p>
        <textarea id="chat-texto" placeholder="[07:05] Ana Quispe : buenos días profe&#10;[07:06] Diego Núñez : presente"></textarea>
        <button class="btn primary" style="margin-top:10px" data-act="chatContar">Contar mensajes</button></div>`;
    }

    const ok = C.filas.filter(f => f.clave);
    const pend = C.filas.filter(f => !f.clave && !f.ignorado);
    const total = ok.reduce((s, f) => s + (+f.puntos || 0), 0);

    if (pend.length) {
      h += `<div class="card"><h3>¿Quién es quién?</h3><p class="muted small">Los asigno una vez y la próxima vez los reconozco solos.</p><div class="lista">`;
      pend.forEach(f => {
        h += `<div class="item"><div class="grow"><div class="t">${esc(f.nombre)}</div><div class="s">${f.n} mensajes</div></div>
          <select style="max-width:200px" data-chg="chatAsignar" data-nombre="${esc(f.nombre)}">
            <option value="">Elegir…</option><option value="__ignorar">No es alumno (ignorar)</option>
            ${st.alumnos.slice().sort((x, y) => norm(x.nombres).localeCompare(norm(y.nombres))).map(a => `<option value="${esc(a.clave)}">${esc(nombreCompleto(a))}</option>`).join('')}
          </select></div>`;
      });
      h += '</div></div>';
    }

    h += `<div class="card revision"><h3>Escribieron en el chat (${ok.length})</h3>
      <p class="muted small" style="margin:4px 0 8px">Puntos sugeridos según el tope y lo que ya tiene hoy. Puedes cambiarlos.</p><div class="lista">`;
    ok.sort((x, y) => y.n - x.n).forEach(f => {
      const a = alumnoDe(f.clave);
      h += `<div class="item"><span class="conf ${f.conf}"></span>${avatarHTML(a, colorEq(a.equipo), 34)}
        <div class="grow"><div class="t">${esc(nombreCompleto(a))}</div>
          <div class="s">${f.n} mensajes${norm(f.nombre) !== norm(a.nombres + ' ' + a.apellidos) ? ' · como «' + esc(f.nombre) + '»' : ''}${f.ya ? ' · ya tiene ' + f.ya + ' hoy' : ''}</div></div>
        <input type="number" class="pts-in" min="0" step="1" value="${f.puntos}" data-chg="chatPuntos" data-clave="${esc(f.clave)}"></div>`;
    });
    if (!ok.length) h += '<p class="muted small">Nadie identificado todavía.</p>';
    h += '</div></div>';

    const sinEscribir = st.alumnos.filter(a => !ok.some(f => f.clave === a.clave));
    if (sinEscribir.length && ok.length) {
      h += `<div class="card"><h3>No escribieron (${sinEscribir.length})</h3><div class="chips" style="margin-top:8px">
        ${sinEscribir.map(a => `<span class="miembro">${avatarHTML(a, colorEq(a.equipo), 24)}${esc(nombreCorto(a))}</span>`).join('')}</div></div>`;
    }

    h += `<div class="confirmar-bar"><div class="grow">+${total} de participación · ${esc(fmtFecha(C.fecha))}</div>
      <button class="btn" data-act="chatCancelar">Cancelar</button>
      <button class="btn primary" data-act="chatGuardar" ${pend.length ? 'title="Hay nombres sin asignar"' : ''}>${ICON.check}Guardar</button></div>`;
    return h;
  }
};

/** Devuelve Map(nombre → cantidad de mensajes). Acepta varios formatos de copia del chat. */
function parseChat(texto) {
  const lineas = texto.split(/\r?\n/);
  const cuenta = new Map();
  const add = n => {
    n = n.replace(/\s+/g, ' ').trim();
    if (!n || n.length > 60 || !/[a-zÀ-ÿ]/i.test(n)) return;
    cuenta.set(n, (cuenta.get(n) || 0) + 1);
  };
  const HORA = '\\d{1,2}:\\d{2}(?::\\d{2})?\\s*(?:[ap]\\.?\\s?m\\.?)?';
  // [07:05] Nombre : mensaje   |   07:05 Nombre: mensaje
  const reA = new RegExp(`^\\s*[\\[(]?\\s*${HORA}\\s*[\\])]?\\s*[-–]?\\s*([^:\\[\\]]{2,60}?)\\s*:\\s(.*)$`, 'i');
  let hits = 0;
  lineas.forEach(l => { const m = l.match(reA); if (m) { hits++; add(m[1]); } });
  if (hits) return cuenta;
  // Copiado de pantalla: "Nombre 07:05" y debajo los mensajes
  const reB = new RegExp(`^\\s*(.{2,60}?)\\s+${HORA}\\s*$`, 'i');
  let actual = null;
  lineas.forEach(l => {
    const m = l.match(reB);
    if (m) actual = m[1];
    else if (l.trim() && actual) add(actual);
  });
  if (cuenta.size) return cuenta;
  // Nombre: mensaje
  lineas.forEach(l => { const m = l.match(/^\s*([^:]{2,40}?)\s*:\s+(.+)$/); if (m) add(m[1]); });
  return cuenta;
}

function armarFilasChat(cuenta) {
  const st = S.st;
  const C = S.chat;
  const tope = st.cursoInfo.tope;
  const ignorar = new Set(st.config.chatIgnorar.map(norm));
  const ya = {};
  st.movs.filter(m => m.fecha === C.fecha && norm(m.categoria) === 'PARTICIPACION').forEach(m => { ya[m.clave] = (ya[m.clave] || 0) + m.puntos; });
  const porClave = {};
  const filas = [];
  cuenta.forEach((n, nombre) => {
    if (ignorar.has(norm(nombre))) return;
    const m = matchNombre(nombre, st.alumnos);
    if (m) {
      const k = m.alumno.clave;
      if (porClave[k]) { porClave[k].n += n; return; }
      porClave[k] = { nombre, n, clave: k, conf: m.conf };
      filas.push(porClave[k]);
    } else filas.push({ nombre, n, clave: null, conf: 'ninguna' });
  });
  filas.forEach(f => {
    if (!f.clave) return;
    f.ya = ya[f.clave] || 0;
    f.puntos = Math.max(0, Math.min(f.n, tope - f.ya));
  });
  return filas;
}

Object.assign(Cambios, {
  chatFecha(el) { S.chat.fecha = el.value || S.st.fecha; S.chat.filas = null; render(); },
  chatPuntos(el) { const f = S.chat.filas.find(x => x.clave === el.dataset.clave); if (f) f.puntos = Math.max(0, +el.value || 0); render(); },
  chatAsignar(el) {
    const nombre = el.dataset.nombre;
    const f = S.chat.filas.find(x => x.nombre === nombre && !x.clave);
    if (!f || !el.value) return;
    if (el.value === '__ignorar') {
      f.ignorado = true;
      S.st.config.chatIgnorar.push(nombre);
      enviar('ignorarChat', [S.st.curso, nombre], { silencio: true });
    } else {
      const a = alumnoDe(el.value);
      a.apodos.push(nombre);
      enviar('saveApodo', [S.st.curso, a.clave, nombre], { silencio: true });
      // Recalcula para juntar con mensajes que ya tuviera con otro nombre
      const cuenta = new Map(S.chat.filas.filter(x => !x.ignorado).map(x => [x.nombre, x.n]));
      S.chat.filas = armarFilasChat(cuenta);
      UI.toast(`«${nombre}» guardado como ${nombreCorto(a)}`);
    }
    render();
  }
});

Object.assign(Acciones, {
  chatContar() {
    const t = $('#chat-texto').value;
    if (!t.trim()) return UI.toast('Pega primero el chat');
    const cuenta = parseChat(t);
    if (!cuenta.size) return UI.toast('No encontré mensajes con nombre. Revisa el formato.', { error: true });
    S.chat.filas = armarFilasChat(cuenta);
    render();
  },
  chatCancelar() { S.chat = null; render(); },
  chatGuardar() {
    const st = S.st;
    const items = S.chat.filas.filter(f => f.clave && +f.puntos > 0)
      .map(f => ({ clave: f.clave, categoria: 'Participación', puntos: +f.puntos, nota: f.n + (f.n === 1 ? ' mensaje' : ' mensajes') + ' en el chat' }));
    if (!items.length) return UI.toast('No hay puntos que guardar');
    const fecha = S.chat.fecha !== st.fecha ? S.chat.fecha : null;
    enviar('addMovs', [st.curso, 'chat', items, fecha]).then(() => { S.chat = null; render(); });
  }
});
