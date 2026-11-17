/* Semana: ruta tipo Duolingo. Eliges la semana y el día de clase, tocas un avatar
   y das punto a favor o en contra en Puntualidad, Participación, Tarea o Proyecto.
   Todo se guarda en el Registro del Google Sheets (mismo flujo que la pestaña Clase). */

const SEM_CATS = [
  { id: 'pun', nombre: 'Puntualidad', emoji: '⏰', pos: 'Puntualidad', neg: 'Tardanza' },
  { id: 'par', nombre: 'Participación', emoji: '🙋', pos: 'Participación', neg: 'Falta de participación' },
  { id: 'tar', nombre: 'Tarea', emoji: '📝', pos: 'Tarea completa', neg: 'No entregó tarea' },
  { id: 'pro', nombre: 'Proyecto', emoji: '🚀', pos: 'Proyecto', neg: 'Proyecto sin avance' }
];
const SEM_N = 16;

const isoLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const sumaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
const lunesDe = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoLocal(d); };

const Sem = {
  n: null, fecha: null, curso: null, claveAbierta: null,

  /** Lunes de la semana 1: el que fijó el docente o el de la primera sesión del curso. */
  inicio() {
    const g = store.get('inicioSem', '');
    if (g) return lunesDe(g);
    const p = S.st.sesiones.length ? S.st.sesiones[0].fecha : hoyISO();
    return lunesDe(p);
  },
  lunesSemana(n) { return sumaDias(this.inicio(), 7 * (n - 1)); },
  semanaDe(iso) { return Math.round((new Date(lunesDe(iso) + 'T12:00:00') - new Date(this.inicio() + 'T12:00:00')) / 6048e5) + 1; },
  totalSemanas() {
    const u = S.st.sesiones.length ? S.st.sesiones[S.st.sesiones.length - 1].fecha : hoyISO();
    return Math.max(SEM_N, this.semanaDe(u));
  },

  /** Fechas de clase de esa semana según los días del curso (ej. "Mar, Jue"). */
  dias(n) {
    const toks = norm(S.st.cursoInfo.dias || '').split(/[\s,]+/).filter(Boolean);
    const lun = this.lunesSemana(n);
    let l = [];
    for (let i = 0; i < 7; i++) if (toks.includes(norm(DIAS[(i + 1) % 7]))) l.push(sumaDias(lun, i));
    if (!l.length) l = [0, 1, 2, 3, 4].map(i => sumaDias(lun, i));
    return l;
  },

  asegurar() {
    if (this.n && this.curso === S.st.curso) return;
    this.curso = S.st.curso;
    const hoy = hoyISO();
    this.n = Math.min(Math.max(this.semanaDe(hoy), 1), this.totalSemanas());
    this.elegirDia(hoy);
  },
  elegirDia(pref) {
    const d = this.dias(this.n);
    this.fecha = d.includes(pref) ? pref : (d.find(x => x >= pref) || d[d.length - 1]);
  },

  movsDe(fecha, clave) { return S.st.movs.filter(m => m.fecha === fecha && (!clave || m.clave === clave)); },
  neto(fecha, clave, cat) { return this.movsDe(fecha, clave).filter(m => m.categoria === cat.pos || m.categoria === cat.neg).reduce((s, m) => s + m.puntos, 0); },
  semanaConDatos(n) { const l = this.lunesSemana(n), f = sumaDias(l, 6); return S.st.movs.some(m => m.fecha >= l && m.fecha <= f); },

  render() {
    this.asegurar();
    const st = S.st, c = st.cursoInfo;
    const t = temaCurso(c, st.cursos.findIndex(x => x.curso === st.curso));
    const N = this.totalSemanas();
    let racha = 0;
    for (let k = this.n; k >= 1 && this.semanaConDatos(k); k--) racha++;
    const hoyMovs = this.movsDe(this.fecha);
    const xp = hoyMovs.reduce((s, m) => s + m.puntos, 0);
    const conDatos = new Set(hoyMovs.map(m => m.clave)).size;
    const pct = st.alumnos.length ? Math.round(conDatos * 100 / st.alumnos.length) : 0;

    let h = `<div class="curso-hero" style="${t.estilo}">${objeto3D(t.tipo, 'chico')}
      <div class="grow"><h2>${esc(c.nombre)}</h2>
      <p class="muted small"><b style="color:${t.c1}">${esc(c.seccion)}</b> · ${esc(c.dias || '')} · ${esc(c.hora || '')}</p></div></div>
      <div class="dl-stats">
        <span class="dl-stat">🔥 <b>${racha}</b> ${racha === 1 ? 'semana' : 'semanas'} seguidas</span>
        <span class="dl-stat">⚡ <b>${signo(xp)}</b> XP del día</span>
        <button class="dl-stat dl-link" data-act="semInicio">📅 Inicio: ${esc(fmtFecha(this.inicio()))}</button>
      </div>
      <div class="dl-titulo"><h3>¿QUÉ SEMANA CONVIENE REVISAR? COMPARA OPCIONES</h3>
        <p>Elige una semana y compárala con las demás: <b>✓</b> con puntos · <b>${this.n}</b> elegida · <b>${N}</b> en total.</p></div>
      <div class="dl-ruta" id="dl-ruta">${Array.from({ length: N }, (_, i) => i + 1).map(k => {
        const est = k === this.n ? 'sel' : this.semanaConDatos(k) ? 'hecha' : '';
        return `<button class="dl-nodo ${est}" data-act="semSemana" data-n="${k}" aria-label="Semana ${k}"><span>${est === 'hecha' ? '✓' : k}</span><small>Sem ${k}</small></button>`;
      }).join('')}</div>
      <p class="dl-sub">Semana ${this.n} · ${esc(fmtFecha(this.lunesSemana(this.n), false))} al ${esc(fmtFecha(sumaDias(this.lunesSemana(this.n), 6), false))}</p>
      <div class="dl-dias">${this.dias(this.n).map(f => `<button class="dl-dia ${f === this.fecha ? 'on' : ''}" data-act="semDia" data-f="${f}">${esc(fmtFecha(f))}${f === hoyISO() ? ' · hoy' : ''}</button>`).join('')}</div>
      <div class="dl-prog"><div class="dl-barra"><i style="width:${pct}%"></i></div><span>${conDatos}/${st.alumnos.length} alumnos con puntos</span></div>`;

    if (!st.alumnos.length) return h + `<div class="card vacio">${ICON.usuarios}<p>Este curso aún no tiene alumnos.</p></div>`;
    h += '<p class="muted small" style="margin:6px 0 10px">Toca un avatar para dar puntos a favor o en contra.</p><div class="grid-alumnos">';
    ordenarAlumnos(st.alumnos).forEach(a => { h += this.tarjeta(a); });
    return h + '</div>';
  },

  tarjeta(a) {
    const color = colorEq(a.equipo);
    const pts = this.movsDe(this.fecha, a.clave).reduce((s, m) => s + m.puntos, 0);
    const pips = SEM_CATS.map(c => {
      const v = this.neto(this.fecha, a.clave, c);
      return `<i class="pip ${v > 0 ? 'p' : v < 0 ? 'n' : ''}" title="${c.nombre}">${c.emoji}</i>`;
    }).join('');
    return `<button class="tarjeta dl-av" data-act="semAlumno" data-clave="${esc(a.clave)}" style="--eq:${color}">
      <span class="total ${pts > 0 ? '' : pts < 0 ? 'neg' : 'cero'}">${pts ? signo(pts) : '·'}</span>
      ${avatarHTML(a, color, 58)}<span class="nombre">${esc(nombreCorto(a))}</span>
      <span class="pips">${pips}</span></button>`;
  }
};

function abrirSemanaAlumno(clave) {
  const a = alumnoDe(clave);
  if (!a) return;
  Sem.claveAbierta = clave;
  const e = equipoDe(a.equipo);
  const fila = (c, i) => {
    const v = Sem.neto(Sem.fecha, clave, c);
    return `<div class="dl-fila"><div class="dl-cat"><span class="dl-emo">${c.emoji}</span><div><b>${c.nombre}</b>
        <small class="${v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted'}">${v ? signo(v) + ' este día' : 'sin puntos'}</small></div></div>
      <button class="dl-btn contra" data-act="semPunto" data-i="${i}" data-s="-1" aria-label="${c.nombre} en contra">👎<span>−1</span></button>
      <button class="dl-btn favor" data-act="semPunto" data-i="${i}" data-s="1" aria-label="${c.nombre} a favor">👍<span>+1</span></button></div>`;
  };
  UI.hoja(`<div class="hoja-head">${avatarHTML(a, e.color, 56)}<div class="grow"><h3>${esc(nombreCompleto(a))}</h3>
      <p class="muted small" style="margin:2px 0 0">${esc(fmtFecha(Sem.fecha))} · semana ${Sem.n}</p></div>
      <button class="icon-btn" data-act="cerrar">${ICON.x}</button></div>
    <div class="dl-filas">${SEM_CATS.map(fila).join('')}</div>`);
}

Object.assign(Acciones, {
  semSemana(el) { Sem.n = +el.dataset.n; Sem.elegirDia(hoyISO()); render(); const n = $('.dl-nodo.sel'); if (n) n.scrollIntoView({ inline: 'center', block: 'nearest' }); },
  semDia(el) { Sem.fecha = el.dataset.f; render(); },
  semAlumno(el) { abrirSemanaAlumno(el.dataset.clave); },
  semPunto(el) {
    const c = SEM_CATS[+el.dataset.i], s = +el.dataset.s, k = Sem.claveAbierta;
    darPuntos([k], { categoria: s > 0 ? c.pos : c.neg, puntos: s }, Sem.fecha);
    abrirSemanaAlumno(k);
  },
  semInicio() {
    const v = prompt('Fecha de la semana 1 (AAAA-MM-DD):', Sem.inicio());
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) { store.set('inicioSem', v); Sem.n = null; render(); }
  }
});

Views.semana = Sem;
