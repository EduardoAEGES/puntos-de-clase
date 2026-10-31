/* Asistencia: lee la captura de la lista de CERTUS (OCR), un texto pegado o se marca a mano.
   Siempre pasa por una tabla de revisión antes de guardar. */

const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const ESTADO_CAT = { P: 'Puntualidad', T: 'Tardanza', F: 'Falta' };

Views.asistencia = {
  render() {
    const st = S.st;
    const c = st.cursoInfo;
    const lim = deMin(toMin(c.hora) + c.tolerancia);
    if (!S.asis) S.asis = { fecha: st.fecha, filas: null, extras: [], leyendo: false, progreso: 0 };
    const A = S.asis;
    const yaHay = st.movs.some(m => m.fecha === A.fecha && m.origen === 'asistencia');

    let h = `<div class="seccion-head"><div><h2>Asistencia</h2>
      <p class="muted small">Inicio ${esc(c.hora)} · ${c.tolerancia} min de tolerancia · puntual hasta las <b>${lim}</b></p></div>
      <label class="campo" style="width:170px">Sesión del<input type="date" value="${A.fecha}" data-chg="asisFecha" max="${st.fecha}"></label></div>`;
    if (yaHay) h += `<p class="badge warn" style="margin:0 0 12px">Ya registraste asistencia del ${esc(fmtFecha(A.fecha))}. Si guardas otra vez se suma.</p>`;

    if (A.leyendo) {
      return h + `<div class="card"><h3>Leyendo la captura…</h3><p class="muted small">La primera vez tarda un poco más porque descarga el lector.</p>
        <div class="progreso"><i style="width:${Math.round(A.progreso * 100)}%"></i></div>
        ${A.img ? `<img class="thumb" src="${A.img}" alt="Captura">` : ''}</div>`;
    }

    if (!A.filas) {
      return h + `<div class="fuentes">
          <label class="fuente" role="button">${ICON.camara}Subir captura<small>Foto o pantallazo de la lista</small>
            <input type="file" accept="image/*" hidden data-chg="asisImagen"></label>
          <button class="fuente" data-act="asisPegar">${ICON.pegar}Pegar texto<small>Si puedes copiar la lista</small></button>
          <button class="fuente" data-act="asisManual">${ICON.lista}Marcar a mano<small>Todos puntuales y corriges</small></button>
        </div>
        <div class="card ${A.pegar ? '' : 'hidden'}" style="margin-top:12px">
          <textarea id="asis-texto" placeholder="Pega aquí la lista: ID, APELLIDOS,NOMBRES y hora de inicio"></textarea>
          <button class="btn primary" style="margin-top:10px" data-act="asisLeerTexto">Leer lista</button>
        </div>`;
    }

    // Revisión
    const cuenta = { P: 0, T: 0, F: 0, N: 0 };
    Object.values(A.filas).forEach(f => cuenta[f.estado]++);
    const lista = st.alumnos.slice().sort((x, y) => norm(x.apellidos).localeCompare(norm(y.apellidos)));
    h += `<div class="card revision"><div class="fila" style="justify-content:space-between;flex-wrap:wrap;gap:8px">
        <h3>Revisa y corrige</h3>
        <div class="chips"><span class="badge pos">P ${cuenta.P}</span><span class="badge warn">T ${cuenta.T}</span><span class="badge neg">F ${cuenta.F}</span></div></div>
      <p class="muted small" style="margin:4px 0 8px">P puntual · T tardanza · F falta · — no registrar. El punto verde indica que lo encontré seguro; el ámbar, que conviene revisar.</p>
      ${A.img ? `<details><summary class="small muted">Ver captura</summary><img class="thumb" src="${A.img}" alt="Captura"></details>` : ''}
      <div class="lista">`;
    lista.forEach(a => {
      const f = A.filas[a.clave];
      h += `<div class="item">
        <span class="conf ${f.fuente || 'ninguna'}" title="${esc(f.fuente || 'no aparece')}"></span>
        ${avatarHTML(a, colorEq(a.equipo), 34)}
        <div class="grow"><div class="t">${esc(tc(a.apellidos))}, ${esc(tc(primero(a.nombres)))}</div>
          ${f.leido ? `<div class="s">Leído: ${esc(f.leido)}</div>` : ''}</div>
        <input type="time" class="hora-in" value="${esc(f.hora)}" data-chg="asisHora" data-clave="${esc(a.clave)}">
        <div class="estado-seg">${['P', 'T', 'F', 'N'].map(e =>
          `<button class="${e} ${f.estado === e ? 'on' : ''}" data-act="asisEstado" data-clave="${esc(a.clave)}" data-v="${e}">${e === 'N' ? '—' : e}</button>`).join('')}</div>
      </div>`;
    });
    h += '</div></div>';

    if (A.extras.length) {
      h += `<div class="card"><h3>No están en tu lista</h3><p class="muted small">Asígnalos si son alumnos tuyos con el nombre mal leído; si no, ignóralos.</p><div class="lista">`;
      A.extras.forEach((x, i) => {
        h += `<div class="item"><div class="grow"><div class="t">${esc(x.nombre || x.raw)}</div><div class="s">${esc([x.id, x.hora].filter(Boolean).join(' · '))}</div></div>
          <select style="max-width:190px" data-chg="asisAsignar" data-i="${i}"><option value="">Ignorar</option>
          ${lista.map(a => `<option value="${esc(a.clave)}">${esc(tc(a.apellidos))}, ${esc(tc(primero(a.nombres)))}</option>`).join('')}</select></div>`;
      });
      h += '</div></div>';
    }

    h += `<div class="confirmar-bar"><div class="grow">${cuenta.P + cuenta.T + cuenta.F} registros para el ${esc(fmtFecha(A.fecha))}</div>
      <button class="btn" data-act="asisCancelar">Cancelar</button>
      <button class="btn primary" data-act="asisGuardar">${ICON.check}Guardar</button></div>`;
    return h;
  }
};

function limiteMin() { const c = S.st.cursoInfo; return toMin(c.hora) + c.tolerancia; }
function estadoPorHora(hora) {
  const m = toMin(hora);
  if (m === null) return 'F';
  return m <= limiteMin() ? 'P' : 'T';
}

/** Una línea de la lista: "123456 PEREZ LOPEZ,JUAN CARLOS 07:03:12 a. m." */
function parseLineaAsis(linea) {
  let s = ' ' + linea + ' ';
  s = s.replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g, ' ');
  let hora = '';
  const tm = s.match(/(\d{1,2})\s?[:.]\s?(\d{2})(?:\s?[:.]\s?(\d{2}))?(?:\s*([apAP])\.?\s?[mM]\b\.?)?/);
  if (tm) {
    let hh = +tm[1];
    const mm = +tm[2];
    if (tm[4]) { const pm = tm[4].toLowerCase() === 'p'; if (pm && hh < 12) hh += 12; if (!pm && hh === 12) hh = 0; }
    else {
      // Sin a.m./p.m.: si el curso es de noche y la hora leída es de mañana, se asume p.m.
      const ini = toMin(S.st.cursoInfo.hora);
      if (hh < 12 && ini >= 12 * 60 && Math.abs((hh + 12) * 60 + mm - ini) < Math.abs(hh * 60 + mm - ini)) hh += 12;
    }
    if (hh < 24 && mm < 60) hora = deMin(hh * 60 + mm);
    s = s.replace(tm[0], ' ');
  }
  const idm = s.match(/\b[A-Za-z]{0,2}\d{5,}\b/);
  const id = idm ? idm[0] : '';
  if (idm) s = s.replace(idm[0], ' ');
  const nombre = s.replace(/[^A-Za-zÀ-ÿÑñ,\s]/g, ' ').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim().replace(/^,|,$/g, '').trim();
  const letras = nombre.replace(/[^A-Za-zÀ-ÿÑñ]/g, '');
  if (letras.length < 6) return null;
  if (!id && !hora && /NOMBRE|APELLIDO|HORA|INICIO|ASISTENCIA|ESTADO|FECHA|PARTICIPANTE/.test(norm(nombre))) return null;
  return { id, hora, nombre, raw: linea.trim() };
}

function procesarAsistencia(texto) {
  const st = S.st;
  const A = S.asis;
  A.filas = {};
  st.alumnos.forEach(a => { A.filas[a.clave] = { hora: '', estado: 'F', fuente: '', leido: '' }; });
  A.extras = [];
  texto.split(/\r?\n/).forEach(l => {
    const p = parseLineaAsis(l);
    if (!p) return;
    let a = p.id ? st.alumnos.find(x => (x.id && norm(x.id) === norm(p.id)) || (x.dni && x.dni === p.id.replace(/\D/g, ''))) : null;
    let fuente = 'id';
    if (!a) { const m = matchNombre(p.nombre.replace(',', ' '), st.alumnos); if (m) { a = m.alumno; fuente = m.conf; } }
    if (!a) { A.extras.push(p); return; }
    const f = A.filas[a.clave];
    if (p.hora && (!f.hora || p.hora < f.hora)) f.hora = p.hora;
    f.fuente = f.fuente === 'id' ? 'id' : fuente;
    f.leido = [p.nombre, p.hora].filter(Boolean).join(' · ');
  });
  Object.values(A.filas).forEach(f => { f.estado = estadoPorHora(f.hora); });
  render();
  window.scrollTo(0, 0);
}

/** Agranda y pasa a gris la imagen: el OCR lee mejor. */
function prepararImagen(file) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(3, Math.max(1, 2400 / img.width));
      const c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k;
      const g = c.getContext('2d');
      g.filter = 'grayscale(1) contrast(1.3)';
      g.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/png'));
    };
    img.onerror = () => fail(new Error('No pude abrir la imagen'));
    img.src = URL.createObjectURL(file);
  });
}

Object.assign(Cambios, {
  asisFecha(el) { S.asis.fecha = el.value || S.st.fecha; render(); },
  async asisImagen(el) {
    const file = el.files[0];
    if (!file) return;
    const A = S.asis;
    A.img = URL.createObjectURL(file);
    A.leyendo = true; A.progreso = 0;
    render();
    try {
      await cargarScript(TESSERACT);
      const dataUrl = await prepararImagen(file);
      const r = await Tesseract.recognize(dataUrl, 'spa', {
        logger: m => { if (m.status === 'recognizing text') { A.progreso = m.progress; const b = $('.progreso i'); if (b) b.style.width = Math.round(m.progress * 100) + '%'; } }
      });
      A.leyendo = false;
      procesarAsistencia(r.data.text);
    } catch (e) {
      A.leyendo = false;
      render();
      UI.toast('No pude leer la captura: ' + e.message, { error: true });
    }
  },
  asisHora(el) {
    const f = S.asis.filas[el.dataset.clave];
    f.hora = el.value;
    f.estado = estadoPorHora(el.value);
    render();
  },
  asisAsignar(el) {
    const x = S.asis.extras[+el.dataset.i];
    const k = el.value;
    if (!k) return;
    const f = S.asis.filas[k];
    if (x.hora) { f.hora = x.hora; f.estado = estadoPorHora(x.hora); }
    else f.estado = 'F';
    f.fuente = 'alta';
    f.leido = x.nombre;
    S.asis.extras.splice(+el.dataset.i, 1);
    render();
  }
});

Object.assign(Acciones, {
  asisPegar() { S.asis.pegar = !S.asis.pegar; render(); setTimeout(() => { const t = $('#asis-texto'); if (t) t.focus(); }, 50); },
  asisLeerTexto() { const t = $('#asis-texto').value; if (!t.trim()) return UI.toast('Pega primero la lista'); procesarAsistencia(t); },
  asisManual() {
    const A = S.asis;
    A.filas = {};
    S.st.alumnos.forEach(a => { A.filas[a.clave] = { hora: '', estado: 'P', fuente: '', leido: '' }; });
    A.extras = [];
    render();
  },
  asisEstado(el) { S.asis.filas[el.dataset.clave].estado = el.dataset.v; render(); },
  asisCancelar() { S.asis = null; render(); },
  asisGuardar() {
    const st = S.st;
    const A = S.asis;
    const items = [];
    Object.entries(A.filas).forEach(([clave, f]) => {
      if (f.estado === 'N') return;
      const nombre = ESTADO_CAT[f.estado];
      const cat = st.categorias.find(c => norm(c.categoria) === norm(nombre));
      items.push({ clave, categoria: nombre, puntos: cat ? cat.puntos : (f.estado === 'P' ? 1 : -1), nota: f.hora ? 'Ingresó ' + f.hora : 'Sin hora de ingreso' });
    });
    if (!items.length) return UI.toast('No hay nada que guardar');
    const fecha = A.fecha !== st.fecha ? A.fecha : null;
    enviar('addMovs', [st.curso, 'asistencia', items, fecha]).then(() => { S.asis = null; render(); });
  }
});
