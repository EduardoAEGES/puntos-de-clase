/**
 * Puntos de clase — backend en Apps Script sobre el Google Sheets.
 * Pegar este archivo como Code.gs y la página como Index.html en
 * Extensiones > Apps Script del Sheets. Luego correr setup() una vez.
 */

const HOJAS = {
  Cursos: ['Curso', 'Nombre', 'Sección', 'NRC', 'Modalidad', 'Días', 'Hora inicio', 'Tolerancia (min)', 'Tope participación', 'Plataforma'],
  Alumnos: ['Clave', 'ID', 'DNI', 'Apellidos', 'Nombres', 'Correo', 'Curso', 'Equipo', 'Avatar', 'Apodos', 'Total'],
  Equipos: ['Curso', 'Equipo', 'Nombre', 'Color', 'Total'],
  Categorias: ['Categoria', 'Puntos', 'Tipo', 'Componente'],
  Componentes: ['Curso', 'Componente', 'Peso (%)', 'Máx por sesión', 'Sesiones'],
  Sesiones: ['Curso', 'Fecha', 'Tema', 'Tarea', 'Comentario'],
  Registro: ['Fecha', 'Hora', 'Curso', 'ID alumno', 'Alumno', 'Categoria', 'Puntos', 'Origen', 'Nota', 'Lote', 'RegID'],
  Notas: ['Curso', 'Clave', 'DNI', 'Apellidos', 'Nombres', 'Puntualidad', 'Participación', 'Tareas', 'Nota', 'Actualizado'],
  Config: ['Clave', 'Valor', 'Descripción']
};

const COLORES = ['#F9C5C5', '#FFDDB0', '#FFF0A8', '#C8EBC4', '#BFE3F2', '#D9CCF5', '#F7C8E6', '#CDEDE6'];

const SEED_CATEGORIAS = [
  ['Puntualidad', 1, 'Positivo', 'Puntualidad'],
  ['Participación', 1, 'Positivo', 'Participación'],
  ['Tarea completa', 1, 'Positivo', 'Tareas'],
  ['Ayuda a un compañero', 1, 'Positivo', 'Participación'],
  ['Buena respuesta', 2, 'Positivo', 'Participación'],
  ['Cámara encendida', 1, 'Positivo', 'Participación'],
  ['Tardanza', -1, 'Negativo', 'Puntualidad'],
  ['Falta', -1, 'Negativo', 'Puntualidad'],
  ['No entregó tarea', -1, 'Negativo', 'Tareas']
];

// Curso '*' = pesos por defecto para todos los cursos que no tengan los suyos
const SEED_COMPONENTES = [
  ['*', 'Puntualidad', 30, 1, 'Todas'],
  ['*', 'Participación', 40, 1, 'Todas'],
  ['*', 'Tareas', 30, 1, 'Con tarea']
];

const SEED_CONFIG = [
  ['tolerancia_default', 15, 'Minutos de tolerancia si el curso no tiene uno'],
  ['tope_participacion_default', 1, 'Puntos máximos de participación por clase si el curso no tiene uno'],
  ['tamano_equipo', 5, 'Alumnos por equipo al importar'],
  ['escala_nota', 20, 'Nota máxima'],
  ['nota_aprobatoria', 13, 'Nota mínima para aprobar'],
  ['avatar_estilo', 'adventurer', 'Estilo de avatar por defecto (DiceBear) o "iniciales"'],
  ['chat_ignorar', '', 'Nombres del chat que no son alumnos, separados por |']
];

/**
 * Cursos y alumnos iniciales. Vienen de Datos.gs (privado, fuera de GitHub);
 * sin ese archivo, setup() crea las hojas vacías y los cursos se agregan a mano.
 */
function semilla_() {
  return {
    cursos: typeof SEED_CURSOS === 'undefined' ? [] : SEED_CURSOS,
    alumnos: typeof SEED_ALUMNOS === 'undefined' ? null : SEED_ALUMNOS
  };
}

/* ---------- Entrada ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Puntos')
    .addItem('Preparar hojas', 'setup')
    .addItem('Actualizar hoja Notas', 'actualizarNotasHoja')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Puntos de clase')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function setup() {
  const ss = ss_();
  ss.setSpreadsheetTimeZone('America/Lima');
  Object.keys(HOJAS).forEach(function (n) {
    const s = ss.getSheetByName(n) || ss.insertSheet(n);
    const h = HOJAS[n];
    if (!s.getRange(1, 1).getValue()) s.getRange(1, 1, 1, h.length).setValues([h]);
    s.getRange(1, 1, 1, h.length).setFontWeight('bold').setBackground('#EEF2F7');
    s.setFrozenRows(1);
  });
  sh_('Registro').getRange('A:B').setNumberFormat('@');
  sh_('Sesiones').getRange('B:B').setNumberFormat('@');
  sh_('Cursos').getRange('G:G').setNumberFormat('@');
  sh_('Alumnos').getRange('A:C').setNumberFormat('@');
  sh_('Notas').getRange('C:C').setNumberFormat('@');

  if (lastRow_(sh_('Cursos')) < 2) append_('Cursos', semilla_().cursos);
  if (lastRow_(sh_('Categorias')) < 2) append_('Categorias', SEED_CATEGORIAS);
  if (lastRow_(sh_('Componentes')) < 2) append_('Componentes', SEED_COMPONENTES);
  if (lastRow_(sh_('Config')) < 2) append_('Config', SEED_CONFIG);
  if (lastRow_(sh_('Alumnos')) < 2) seedAlumnos_();

  // Totales de puntos calculados con fórmulas sobre Registro
  sh_('Alumnos').getRange('K1').setFormula('={"Total";ARRAYFORMULA(IF(A2:A="","",SUMIFS(Registro!G:G,Registro!D:D,A2:A)))}');
  sh_('Equipos').getRange('E1').setFormula('={"Total";ARRAYFORMULA(IF(A2:A="","",SUMIFS(Alumnos!K:K,Alumnos!G:G,A2:A,Alumnos!H:H,B2:B)))}');

  ['Hoja 1', 'Sheet1'].forEach(function (n) {
    const s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
}

/** SEED_ALUMNOS puede ser un curso {curso, nombresEquipo, equipos} o una lista de ellos. */
function seedAlumnos_() {
  const seed = semilla_().alumnos;
  if (!seed) return;
  const alumnos = [];
  const equipos = [];
  let n = 1;
  [].concat(seed).forEach(function (s) {
    s.equipos.forEach(function (lista, i) {
      equipos.push([s.curso, i + 1, (s.nombresEquipo || [])[i] || ('Equipo ' + (i + 1)), COLORES[i % COLORES.length]]);
      lista.forEach(function (x) {
        const p = x.split('|');
        alumnos.push([clave_(n++), '', '', p[0], p[1], '', s.curso, i + 1, '', '']);
      });
    });
  });
  append_('Alumnos', alumnos);
  append_('Equipos', equipos);
}

/* ---------- Acceso ---------- */

/** El docente entra con un PIN. Se crea la primera vez que se abre la app. */
function estadoPin() {
  return { configurado: !!PropertiesService.getScriptProperties().getProperty('PIN') };
}

function crearPin(pin) {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('PIN')) throw new Error('El PIN ya existe.');
  if (!/^\d{4,8}$/.test(String(pin))) throw new Error('El PIN debe tener de 4 a 8 dígitos.');
  p.setProperty('PIN', String(pin));
  return true;
}

/** Para cambiar el PIN: correr esta función desde el editor y volver a crearlo en la app. */
function resetPin() {
  PropertiesService.getScriptProperties().deleteProperty('PIN');
}

const API = {
  getState: getState_, getResumen: getResumen_, addMovs: addMovs_, undoLast: undoLast_, deleteMov: deleteMov_,
  updateAlumno: updateAlumno_, saveEquipo: saveEquipo_, saveApodo: saveApodo_, ignorarChat: ignorarChat_,
  importAlumnos: importAlumnos_, saveSesion: saveSesion_, saveCalificacion: saveCalificacion_, saveConfig: saveConfig_,
  actualizarNotas: function (curso) { actualizarNotasHoja(); const st = getState_(curso); st.msg = 'Hoja Notas actualizada'; return st; }
};

/** Única puerta de entrada de la app del docente. */
function api(pin, fn, args) {
  const ok = PropertiesService.getScriptProperties().getProperty('PIN');
  if (!ok || String(pin) !== ok) throw new Error('PIN incorrecto');
  if (!API[fn]) throw new Error('Acción desconocida: ' + fn);
  return API[fn].apply(null, args || []);
}

/* ---------- Página de notas para alumnos ---------- */

function consultarNotas(dni) {
  dni = String(dni || '').replace(/\D/g, '');
  if (dni.length < 8) throw new Error('Escribe tu DNI de 8 dígitos.');
  const db = load_();
  const filas = db.alumnos.filter(function (a) { return a.dni.replace(/\D/g, '') === dni; });
  return filas.map(function (a) {
    const st = calcCurso_(db, a.curso);
    const yo = st.alumnos.filter(function (x) { return x.clave === a.clave; })[0];
    const eq = st.equipos.filter(function (e) { return e.equipo === yo.equipo; })[0];
    return {
      curso: st.cursoInfo, escala: st.config.escala, aprobatoria: st.config.aprobatoria,
      componentes: st.componentes, sesiones: st.sesiones, equipo: eq || null,
      alumno: { clave: yo.clave, nombres: yo.nombres, apellidos: yo.apellidos, avatar: yo.avatar, equipo: yo.equipo, total: yo.total, nota: yo.nota, comps: yo.comps, serie: yo.serie },
      movs: st.movs.filter(function (m) { return m.clave === a.clave; }),
      avatarEstilo: st.config.avatarEstilo
    };
  });
}

/* ---------- Lectura ---------- */

function getState_(curso) {
  const db = load_();
  if (!db.cursos.length) throw new Error('No hay cursos en la hoja Cursos.');
  if (!db.cursos.some(function (c) { return c.curso === curso; })) curso = db.cursos[0].curso;
  const st = calcCurso_(db, curso);
  st.cursos = db.cursos;
  st.categorias = db.categorias;
  try { st.urlApp = ScriptApp.getService().getUrl(); } catch (e) { st.urlApp = ''; }
  return st;
}

/** Resumen de todos los cursos para la pantalla de inicio. */
function getResumen_() {
  const db = load_();
  const compDe = {};
  db.categorias.forEach(function (c) { compDe[norm_(c.categoria)] = norm_(c.componente); });
  return {
    fecha: db.hoy,
    escala: num_(db.cfg.escala_nota, 20),
    aprobatoria: num_(db.cfg.nota_aprobatoria, 13),
    avatarEstilo: str_(db.cfg.avatar_estilo) || 'adventurer',
    cursos: db.cursos.map(function (c) {
      const st = calcCurso_(db, c.curso);
      const part = {};
      let p = 0, t = 0, f = 0;
      st.movs.forEach(function (m) {
        const k = norm_(m.categoria);
        if (k === 'PUNTUALIDAD') p++; else if (k === 'TARDANZA') t++; else if (k === 'FALTA') f++;
        if (compDe[k] === 'PARTICIPACION' && m.puntos > 0) part[m.clave] = (part[m.clave] || 0) + m.puntos;
      });
      const notas = st.alumnos.filter(function (a) { return a.nota !== null; }).map(function (a) { return a.nota; });
      return {
        info: c, sesiones: st.sesiones.length,
        promedio: notas.length ? Math.round(notas.reduce(function (s, x) { return s + x; }, 0) / notas.length * 10) / 10 : null,
        asistencia: (p + t + f) ? (p + t) / (p + t + f) : null,
        equipos: st.equipos,
        alumnos: st.alumnos.map(function (a) {
          return { clave: a.clave, nombres: a.nombres, apellidos: a.apellidos, avatar: a.avatar, equipo: a.equipo, nota: a.nota, total: a.total, participacion: part[a.clave] || 0 };
        })
      };
    })
  };
}

function load_() {
  const cfg = config_();
  const db = { cfg: cfg, hoy: fecha_(new Date()) };
  db.cursos = read_('Cursos').map(function (r) {
    return {
      curso: str_(r[0]), nombre: str_(r[1]), seccion: str_(r[2]), nrc: str_(r[3]),
      modalidad: str_(r[4]), dias: str_(r[5]), hora: hhmm_(r[6]),
      tolerancia: num_(r[7], num_(cfg.tolerancia_default, 15)),
      tope: num_(r[8], num_(cfg.tope_participacion_default, 1)),
      plataforma: str_(r[9])
    };
  }).filter(function (c) { return c.curso; });
  db.alumnos = read_('Alumnos').filter(function (r) { return str_(r[0]); }).map(function (r) {
    return {
      clave: str_(r[0]), id: str_(r[1]), dni: str_(r[2]), apellidos: str_(r[3]), nombres: str_(r[4]), correo: str_(r[5]),
      curso: str_(r[6]), equipo: num_(r[7], 0), avatar: str_(r[8]), apodos: lista_(r[9])
    };
  });
  db.equipos = read_('Equipos').map(function (r) {
    return { curso: str_(r[0]), equipo: num_(r[1], 0), nombre: str_(r[2]), color: str_(r[3]) };
  });
  db.categorias = read_('Categorias').filter(function (r) { return str_(r[0]); }).map(function (r) {
    return { categoria: str_(r[0]), puntos: Number(r[1] || 0), tipo: str_(r[2]) || (Number(r[1]) < 0 ? 'Negativo' : 'Positivo'), componente: str_(r[3]) };
  });
  db.componentes = read_('Componentes').filter(function (r) { return str_(r[1]); }).map(function (r) {
    return { curso: str_(r[0]) || '*', componente: str_(r[1]), peso: num_(r[2], 0), max: num_(r[3], 1), sesiones: str_(r[4]) || 'Todas' };
  });
  db.sesiones = read_('Sesiones').map(function (r) {
    return { curso: str_(r[0]), fecha: fechaStr_(r[1]), tema: str_(r[2]), tarea: /^s/i.test(str_(r[3])), comentario: str_(r[4]) };
  });
  db.movs = read_('Registro').map(mov_);
  return db;
}

/** Arma todo lo de un curso: alumnos con total, nota, componentes y serie por sesión. */
function calcCurso_(db, curso) {
  const cfg = db.cfg;
  const escala = num_(cfg.escala_nota, 20);
  const cursoInfo = db.cursos.filter(function (c) { return c.curso === curso; })[0];
  const movs = db.movs.filter(function (m) { return m.curso === curso; });
  let comps = db.componentes.filter(function (c) { return c.curso === curso; });
  const propios = comps.length > 0;
  if (!propios) comps = db.componentes.filter(function (c) { return c.curso === '*'; });
  const compDe = {};
  db.categorias.forEach(function (c) { compDe[norm_(c.categoria)] = c.componente; });

  // Sesiones: las de la hoja más cualquier fecha con movimientos
  const sesMap = {};
  db.sesiones.filter(function (s) { return s.curso === curso; }).forEach(function (s) { sesMap[s.fecha] = s; });
  movs.forEach(function (m) {
    if (!sesMap[m.fecha]) sesMap[m.fecha] = { curso: curso, fecha: m.fecha, tema: '', tarea: false, comentario: '' };
    if (norm_(compDe[norm_(m.categoria)]) === 'TAREAS') sesMap[m.fecha].tareaAuto = true;
  });
  const sesiones = Object.keys(sesMap).sort().map(function (f, i) {
    const s = sesMap[f];
    return { n: i + 1, fecha: f, tema: s.tema, tarea: !!(s.tarea || s.tareaAuto), comentario: s.comentario };
  });

  const alumnos = db.alumnos.filter(function (a) { return a.curso === curso; }).map(function (a) {
    const mios = movs.filter(function (m) { return m.clave === a.clave; });
    const porSes = {};
    let total = 0;
    mios.forEach(function (m) {
      total += m.puntos;
      const c = compDe[norm_(m.categoria)];
      if (!c) return;
      porSes[m.fecha] = porSes[m.fecha] || {};
      porSes[m.fecha][c] = (porSes[m.fecha][c] || 0) + m.puntos;
    });
    const acum = {};
    comps.forEach(function (c) { acum[c.componente] = 0; });
    let nS = 0, nT = 0;
    const serie = [];
    let ult = { nota: null, comps: [] };
    sesiones.forEach(function (s) {
      nS++;
      if (s.tarea) nT++;
      const ps = porSes[s.fecha] || {};
      comps.forEach(function (c) { acum[c.componente] += ps[c.componente] || 0; });
      ult = nota_(comps, acum, nS, nT, escala);
      serie.push({ fecha: s.fecha, n: s.n, nota: ult.nota });
    });
    if (!sesiones.length) ult = nota_(comps, acum, 0, 0, escala);
    return {
      clave: a.clave, id: a.id, dni: a.dni, apellidos: a.apellidos, nombres: a.nombres, correo: a.correo,
      equipo: a.equipo, avatar: a.avatar, apodos: a.apodos, total: total, nota: ult.nota, comps: ult.comps, serie: serie
    };
  });

  const equipos = db.equipos.filter(function (e) { return e.curso === curso; }).map(function (e, i) {
    return {
      equipo: e.equipo, nombre: e.nombre || ('Equipo ' + e.equipo), color: e.color || COLORES[i % COLORES.length],
      total: alumnos.filter(function (a) { return a.equipo === e.equipo; }).reduce(function (s, a) { return s + a.total; }, 0)
    };
  });

  return {
    curso: curso, fecha: db.hoy, cursoInfo: cursoInfo, alumnos: alumnos, equipos: equipos, sesiones: sesiones, movs: movs,
    componentes: comps, componentesPropios: propios,
    config: {
      tamanoEquipo: num_(cfg.tamano_equipo, 5), escala: escala, aprobatoria: num_(cfg.nota_aprobatoria, 13),
      avatarEstilo: str_(cfg.avatar_estilo) || 'adventurer', chatIgnorar: lista_(cfg.chat_ignorar)
    }
  };
}

/**
 * Nota = escala × Σ(peso × logro) / Σ pesos.
 * Logro de un componente = puntos del componente / (máx por sesión × sesiones que cuentan), entre 0 y 1.
 * Un componente sin sesiones que cuenten (p. ej. aún no hubo tareas) no entra en la nota.
 */
function nota_(comps, acum, nS, nT, escala) {
  let sp = 0, sw = 0;
  const out = comps.map(function (c) {
    const ses = norm_(c.sesiones) === 'CON TAREA' ? nT : nS;
    const posible = c.max * ses;
    const logro = posible > 0 ? Math.max(0, Math.min(1, acum[c.componente] / posible)) : null;
    if (logro !== null && c.peso > 0) { sp += c.peso * logro; sw += c.peso; }
    return { componente: c.componente, peso: c.peso, puntos: acum[c.componente], posible: posible, logro: logro };
  });
  return { nota: sw > 0 ? Math.round(escala * sp / sw * 10) / 10 : null, comps: out };
}

/* ---------- Escritura ---------- */

function addMovs_(curso, origen, items, fecha) {
  return conLock_(function () {
    const nombres = {};
    read_('Alumnos').forEach(function (r) { nombres[str_(r[0])] = str_(r[4]).split(' ')[0] + ' ' + str_(r[3]).split(' ')[0]; });
    const now = new Date();
    const f = fecha || fecha_(now);
    const h = Utilities.formatDate(now, tz_(), 'HH:mm:ss');
    const lote = Utilities.formatDate(now, tz_(), 'HHmmss') + '-' + uid_();
    const rows = (items || []).filter(function (i) { return i.clave && Number(i.puntos) !== 0; }).map(function (i) {
      return [f, h, curso, i.clave, nombres[i.clave] || '', i.categoria, Number(i.puntos), origen || 'manual', i.nota || '', lote, uid_()];
    });
    asegurarSesion_(curso, f);
    append_('Registro', rows);
    const st = getState_(curso);
    st.msg = rows.length + (rows.length === 1 ? ' movimiento guardado' : ' movimientos guardados');
    return st;
  });
}

/** Deshace el último lote (un toque o una confirmación de asistencia/chat) del curso, hoy. */
function undoLast_(curso) {
  return conLock_(function () {
    const sh = sh_('Registro');
    const data = readRows_('Registro');
    const hoy = fecha_(new Date());
    let lote = '';
    for (let i = data.length - 1; i >= 0; i--) {
      if (str_(data[i].v[2]) === curso && fechaStr_(data[i].v[0]) === hoy) { lote = str_(data[i].v[9]); break; }
    }
    let texto = '';
    if (lote) {
      const filas = data.filter(function (d) { return str_(d.v[9]) === lote; });
      texto = filas.length === 1 ? (str_(filas[0].v[4]) + ' · ' + str_(filas[0].v[5])) : (filas.length + ' movimientos');
      filas.map(function (d) { return d.row; }).sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
    }
    const st = getState_(curso);
    st.msg = lote ? 'Deshecho: ' + texto : 'No hay nada que deshacer hoy';
    return st;
  });
}

function deleteMov_(curso, regId) {
  return conLock_(function () {
    const d = readRows_('Registro').filter(function (x) { return str_(x.v[10]) === regId; })[0];
    if (d) sh_('Registro').deleteRow(d.row);
    const st = getState_(curso);
    st.msg = d ? 'Movimiento borrado' : 'Ese movimiento ya no existe';
    return st;
  });
}

/** cambios: {dni, equipo, avatar, id, correo} — solo se tocan los que vienen. */
function updateAlumno_(curso, clave, cambios) {
  return conLock_(function () {
    const d = readRows_('Alumnos').filter(function (x) { return str_(x.v[0]) === clave; })[0];
    if (!d) throw new Error('No encontré a ese alumno.');
    const sh = sh_('Alumnos');
    const col = { id: 2, dni: 3, correo: 6, equipo: 8, avatar: 9 };
    Object.keys(col).forEach(function (k) {
      if (cambios[k] !== undefined) sh.getRange(d.row, col[k]).setValue(k === 'equipo' ? Number(cambios[k]) : String(cambios[k]));
    });
    if (cambios.equipo) asegurarEquipos_(curso, [Number(cambios.equipo)]);
    const st = getState_(curso);
    st.msg = 'Cambios guardados';
    return st;
  });
}

function saveEquipo_(curso, equipo, nombre) {
  return conLock_(function () {
    asegurarEquipos_(curso, [Number(equipo)]);
    const d = readRows_('Equipos').filter(function (x) { return str_(x.v[0]) === curso && num_(x.v[1], 0) === Number(equipo); })[0];
    if (d) sh_('Equipos').getRange(d.row, 3).setValue(nombre);
    const st = getState_(curso);
    st.msg = 'Nombre guardado';
    return st;
  });
}

function saveApodo_(curso, clave, apodo) {
  return conLock_(function () {
    const d = readRows_('Alumnos').filter(function (x) { return str_(x.v[0]) === clave; })[0];
    if (d) {
      const l = lista_(d.v[9]);
      if (l.indexOf(apodo) < 0) l.push(apodo);
      sh_('Alumnos').getRange(d.row, 10).setValue(l.join(' | '));
    }
    return getState_(curso);
  });
}

function ignorarChat_(curso, nombre) {
  return conLock_(function () {
    const d = readRows_('Config').filter(function (x) { return str_(x.v[0]) === 'chat_ignorar'; })[0];
    const l = d ? lista_(d.v[1]) : [];
    if (l.indexOf(nombre) < 0) l.push(nombre);
    if (d) sh_('Config').getRange(d.row, 2).setValue(l.join(' | '));
    else append_('Config', [['chat_ignorar', l.join(' | '), 'Nombres del chat que no son alumnos']]);
    return getState_(curso);
  });
}

function saveSesion_(curso, fecha, datos) {
  return conLock_(function () {
    asegurarSesion_(curso, fecha);
    const d = readRows_('Sesiones').filter(function (x) { return str_(x.v[0]) === curso && fechaStr_(x.v[1]) === fecha; })[0];
    const sh = sh_('Sesiones');
    if (datos.tema !== undefined) sh.getRange(d.row, 3).setValue(datos.tema);
    if (datos.tarea !== undefined) sh.getRange(d.row, 4).setValue(datos.tarea ? 'Sí' : 'No');
    if (datos.comentario !== undefined) sh.getRange(d.row, 5).setValue(datos.comentario);
    const st = getState_(curso);
    st.msg = 'Sesión guardada';
    return st;
  });
}

/**
 * comps: [{componente, peso, max, sesiones}], categorias: {Categoria: Componente},
 * soloEsteCurso: true guarda pesos propios del curso; false cambia los pesos por defecto ('*').
 */
function saveCalificacion_(curso, comps, categorias, soloEsteCurso) {
  return conLock_(function () {
    const destino = soloEsteCurso ? curso : '*';
    const sh = sh_('Componentes');
    readRows_('Componentes').filter(function (d) { return (str_(d.v[0]) || '*') === destino; })
      .map(function (d) { return d.row; }).sort(function (a, b) { return b - a; })
      .forEach(function (r) { sh.deleteRow(r); });
    append_('Componentes', comps.map(function (c) { return [destino, c.componente, Number(c.peso), Number(c.max), c.sesiones]; }));
    if (categorias) {
      const shc = sh_('Categorias');
      readRows_('Categorias').forEach(function (d) {
        const k = str_(d.v[0]);
        if (categorias[k] !== undefined) shc.getRange(d.row, 4).setValue(categorias[k]);
      });
    }
    const st = getState_(curso);
    st.msg = 'Calificación guardada';
    return st;
  });
}

const CONFIG_EDITABLE = ['tolerancia_default', 'tope_participacion_default', 'tamano_equipo', 'escala_nota', 'nota_aprobatoria', 'avatar_estilo'];

function saveConfig_(curso, clave, valor) {
  if (CONFIG_EDITABLE.indexOf(clave) < 0) throw new Error('Ese ajuste no se puede cambiar desde la app.');
  return conLock_(function () {
    const d = readRows_('Config').filter(function (x) { return str_(x.v[0]) === clave; })[0];
    if (d) sh_('Config').getRange(d.row, 2).setValue(valor);
    else append_('Config', [[clave, valor, '']]);
    const st = getState_(curso);
    st.msg = 'Ajuste guardado';
    return st;
  });
}

/** items: [{id, dni, apellidos, nombres, correo}]. Actualiza si ya existe (por ID, DNI o nombre), si no lo agrega a un equipo. */
function importAlumnos_(curso, items) {
  return conLock_(function () {
    const tam = num_(config_().tamano_equipo, 5);
    const sh = sh_('Alumnos');
    const filas = readRows_('Alumnos');
    const delCurso = filas.filter(function (d) { return str_(d.v[6]) === curso; });
    let maxClave = 0;
    filas.forEach(function (d) { const m = str_(d.v[0]).match(/(\d+)/); if (m) maxClave = Math.max(maxClave, Number(m[1])); });

    const porEquipo = {};
    delCurso.forEach(function (d) { const e = num_(d.v[7], 0); if (e) porEquipo[e] = (porEquipo[e] || 0) + 1; });
    function equipoLibre() {
      let e = 1;
      while ((porEquipo[e] || 0) >= tam) e++;
      porEquipo[e] = (porEquipo[e] || 0) + 1;
      return e;
    }

    let nuevos = 0, actualizados = 0;
    const agregar = [];
    const usados = [];
    (items || []).forEach(function (it) {
      const nom = norm_(it.apellidos + ' ' + it.nombres);
      const d = delCurso.filter(function (x) {
        return (it.id && str_(x.v[1]) === String(it.id)) || (it.dni && str_(x.v[2]) === String(it.dni)) ||
          norm_(str_(x.v[3]) + ' ' + str_(x.v[4])) === nom;
      })[0];
      if (d) {
        if (it.id) sh.getRange(d.row, 2).setValue(String(it.id));
        if (it.dni) sh.getRange(d.row, 3).setValue(String(it.dni));
        if (it.correo) sh.getRange(d.row, 6).setValue(it.correo);
        actualizados++;
      } else {
        const e = Number(it.equipo) || equipoLibre();
        usados.push(e);
        agregar.push([clave_(++maxClave), String(it.id || ''), String(it.dni || ''), it.apellidos, it.nombres, it.correo || '', curso, e, '', '']);
        nuevos++;
      }
    });
    append_('Alumnos', agregar);
    asegurarEquipos_(curso, usados);
    const st = getState_(curso);
    st.msg = nuevos + ' nuevos, ' + actualizados + ' actualizados';
    return st;
  });
}

/** Escribe la hoja Notas con la nota de cada alumno de todos los cursos. */
function actualizarNotasHoja() {
  const db = load_();
  const ahora = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm');
  const rows = [];
  db.cursos.forEach(function (c) {
    calcCurso_(db, c.curso).alumnos.forEach(function (a) {
      function logro(nombre) {
        const x = a.comps.filter(function (k) { return norm_(k.componente) === norm_(nombre); })[0];
        return x && x.logro !== null ? Math.round(x.logro * 100) + '%' : '';
      }
      rows.push([c.curso, a.clave, a.dni, a.apellidos, a.nombres, logro('Puntualidad'), logro('Participación'), logro('Tareas'), a.nota === null ? '' : a.nota, ahora]);
    });
  });
  const sh = sh_('Notas');
  const last = lastRow_(sh);
  if (last > 1) sh.getRange(2, 1, last - 1, HOJAS.Notas.length).clearContent();
  append_('Notas', rows);
}

/* ---------- Utilidades ---------- */

function asegurarSesion_(curso, fecha) {
  const hay = read_('Sesiones').some(function (r) { return str_(r[0]) === curso && fechaStr_(r[1]) === fecha; });
  if (!hay) append_('Sesiones', [[curso, fecha, '', 'No', '']]);
}

function asegurarEquipos_(curso, nums) {
  const existentes = read_('Equipos').filter(function (r) { return str_(r[0]) === curso; }).map(function (r) { return num_(r[1], 0); });
  const faltan = [];
  nums.forEach(function (n) { if (n && existentes.indexOf(n) < 0 && faltan.indexOf(n) < 0) faltan.push(n); });
  append_('Equipos', faltan.sort(function (a, b) { return a - b; }).map(function (n) {
    return [curso, n, 'Equipo ' + n, COLORES[(n - 1) % COLORES.length]];
  }));
}

function mov_(r) {
  return {
    fecha: fechaStr_(r[0]), hora: hhmmss_(r[1]), curso: str_(r[2]), clave: str_(r[3]), alumno: str_(r[4]),
    categoria: str_(r[5]), puntos: Number(r[6] || 0), origen: str_(r[7]), nota: str_(r[8]), lote: str_(r[9]), regId: str_(r[10])
  };
}

function conLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function tz_() { return ss_().getSpreadsheetTimeZone() || 'America/Lima'; }

function sh_(n) {
  const s = ss_().getSheetByName(n);
  if (!s) throw new Error('Falta la hoja ' + n + '. Corre setup() en Apps Script.');
  return s;
}

/** Última fila con dato en la columna A (las fórmulas ARRAYFORMULA llenan otras columnas). */
function lastRow_(sh) {
  const n = sh.getLastRow();
  if (n < 1) return 0;
  const v = sh.getRange(1, 1, n, 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (v[i][0] !== '') return i + 1;
  return 0;
}

function readRows_(name) {
  const sh = sh_(name);
  const last = lastRow_(sh);
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HOJAS[name].length).getValues().map(function (v, i) { return { row: i + 2, v: v }; });
}

function read_(name) { return readRows_(name).map(function (d) { return d.v; }); }

function append_(name, rows) {
  if (!rows || !rows.length) return;
  const sh = sh_(name);
  const start = lastRow_(sh) + 1;
  const need = start + rows.length - 1;
  if (need > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows() + 200);
  sh.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
}

function config_() {
  const o = {};
  read_('Config').forEach(function (r) { if (str_(r[0])) o[str_(r[0])] = r[1]; });
  return o;
}

function clave_(n) { return 'A' + ('000' + n).slice(-3); }
function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 8); }
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v, d) { const n = Number(v); return v === '' || v === null || v === undefined || isNaN(n) ? d : n; }
function lista_(v) { return str_(v).split('|').map(function (s) { return s.trim(); }).filter(String); }
function fecha_(d) { return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd'); }
function fechaStr_(v) { return v instanceof Date ? fecha_(v) : str_(v); }
function hhmm_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_(), 'HH:mm');
  const m = str_(v).match(/(\d{1,2}):(\d{2})/);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '07:00';
}
function hhmmss_(v) { return v instanceof Date ? Utilities.formatDate(v, tz_(), 'HH:mm:ss') : str_(v); }
function norm_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
