/**
 * Simulador local de Apps Script para desarrollo.
 * Carga apps-script/Code.gs tal cual y le da un SpreadsheetApp falso guardado en localStorage.
 * El build (build.js) quita este archivo; en Apps Script no existe.
 */
(function () {
  const KEY = window.MOCK_DEMO ? 'puntos-demo-db' : 'mock-gas-db';
  const PROPS = window.MOCK_DEMO ? 'puntos-demo-props' : 'mock-gas-props';

  function cargar() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { tz: 'America/Lima', hojas: {}, orden: [] }; }
    catch (e) { return { tz: 'America/Lima', hojas: {}, orden: [] }; }
  }
  let db = cargar();
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento */ } }

  function col(letras) { let n = 0; for (const ch of letras) n = n * 26 + ch.charCodeAt(0) - 64; return n; }

  function Range(hoja, r, c, nr, nc) {
    const h = () => db.hojas[hoja];
    function fila(i) { const v = h().v; while (v.length < i) v.push([]); return v[i - 1]; }
    return {
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const f = h().v[r - 1 + i] || [];
          const row = [];
          for (let j = 0; j < nc; j++) { const x = f[c - 1 + j]; row.push(x === undefined || x === null ? '' : x); }
          out.push(row);
        }
        return out;
      },
      setValues(vals) {
        if (r + nr - 1 > h().max) throw new Error('Rango fuera de la hoja ' + hoja);
        vals.forEach((rowV, i) => { const f = fila(r + i); rowV.forEach((x, j) => { f[c - 1 + j] = x; }); });
        return this;
      },
      getValue() { return this.getValues()[0][0]; },
      setValue(x) { fila(r)[c - 1] = x; return this; },
      setFormula() { return this; },
      setNumberFormat() { return this; },
      setFontWeight() { return this; },
      setBackground() { return this; },
      clearContent() { for (let i = 0; i < nr; i++) { const f = fila(r + i); for (let j = 0; j < nc; j++) f[c - 1 + j] = ''; } return this; }
    };
  }

  function Sheet(nombre) {
    const h = () => db.hojas[nombre];
    return {
      getName: () => nombre,
      getRange(a, b, c, d) {
        if (typeof a === 'number') return Range(nombre, a, b, c || 1, d || 1);
        const m = String(a).match(/^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/);
        const c1 = col(m[1]), r1 = m[2] ? +m[2] : 1;
        const c2 = m[3] ? col(m[3]) : c1, r2 = m[4] ? +m[4] : (m[2] && !m[3] ? r1 : h().max);
        return Range(nombre, r1, c1, r2 - r1 + 1, c2 - c1 + 1);
      },
      getLastRow() {
        const v = h().v;
        for (let i = v.length - 1; i >= 0; i--) if ((v[i] || []).some(x => x !== '' && x !== undefined && x !== null)) return i + 1;
        return 0;
      },
      getMaxRows: () => h().max,
      insertRowsAfter(_, n) { h().max += n; },
      deleteRow(r) { h().v.splice(r - 1, 1); },
      setFrozenRows() {}
    };
  }

  const ss = {
    getSheetByName: n => (db.hojas[n] ? Sheet(n) : null),
    insertSheet(n) { db.hojas[n] = { v: [], max: 1000 }; db.orden.push(n); return Sheet(n); },
    deleteSheet(s) { delete db.hojas[s.getName()]; db.orden = db.orden.filter(x => x !== s.getName()); },
    getSheets: () => db.orden.map(Sheet),
    setSpreadsheetTimeZone(tz) { db.tz = tz; },
    getSpreadsheetTimeZone: () => db.tz
  };

  window.SpreadsheetApp = { getActiveSpreadsheet: () => ss, getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }) }) };
  window.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  window.ScriptApp = { getService: () => ({ getUrl: () => location.origin + location.pathname }) };
  window.PropertiesService = {
    getScriptProperties: () => {
      const p = () => { try { return JSON.parse(localStorage.getItem(PROPS)) || {}; } catch (e) { return {}; } };
      const w = o => { try { localStorage.setItem(PROPS, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
      return {
        getProperty: k => p()[k] || null,
        setProperty: (k, v) => { const o = p(); o[k] = v; w(o); },
        deleteProperty: k => { const o = p(); delete o[k]; w(o); }
      };
    }
  };
  window.Utilities = {
    getUuid: () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()),
    formatDate(d, tz, fmt) {
      const p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(d).forEach(x => { p[x.type] = x.value; });
      return fmt.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
    }
  };

  // Carga los datos iniciales y el backend real, como hace Apps Script con Datos.gs + Code.gs.
  // En local usa privado/Datos.gs si existe; si no (o en la demo pública), los datos inventados.
  function leer(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send();
    return xhr.status === 200 ? xhr.responseText : null;
  }
  if (typeof window.setup === 'function') {
    // La demo ya cargó datos y backend con <script>: así abre también con doble clic (file://)
    window.__gas = { setup, estadoPin, crearPin, api, consultarNotas, addMovs_, getState_, updateAlumno_ };
  } else {
    const archivos = [['../privado/Datos.gs', '../demo/seed-demo.js'], '../apps-script/Code.gs'];
    const codigo = archivos.map(a => {
      const opciones = Array.isArray(a) ? a : [a];
      for (const url of opciones) { const t = leer(url); if (t !== null) return t; }
      throw new Error('No pude cargar ' + opciones.join(' ni '));
    }).join('\n;\n');
    (0, eval)(codigo + '\n;window.__gas = {setup, estadoPin, crearPin, api, consultarNotas, addMovs_, getState_, updateAlumno_};');
  }
  const nueva = !db.orden.length;
  if (nueva) { window.__gas.setup(); guardar(); }

  // Demo pública: entra sin pedir PIN y arranca con historial
  if (window.MOCK_DEMO) {
    const PIN_DEMO = '0000';
    PropertiesService.getScriptProperties().setProperty('PIN', PIN_DEMO);
    try { localStorage.setItem('pin', JSON.stringify(PIN_DEMO)); } catch (e) { /* sin almacenamiento */ }
    document.addEventListener('DOMContentLoaded', () => {
      const b = document.createElement('div');
      b.className = 'demo-aviso';
      b.innerHTML = 'Demo con datos inventados · se guarda solo en este navegador';
      document.body.prepend(b);
    });
  }

  function runner(ok, fail) {
    return new Proxy({}, {
      get(_, fn) {
        if (fn === 'withSuccessHandler') return f => runner(f, fail);
        if (fn === 'withFailureHandler') return f => runner(ok, f);
        return (...args) => setTimeout(() => {
          try {
            const r = JSON.parse(JSON.stringify(window.__gas[fn](...JSON.parse(JSON.stringify(args))) ?? null));
            guardar();
            ok && ok(r);
          } catch (e) { console.error(e); fail && fail(e); }
        }, 250);
      }
    });
  }

  window.google = {
    script: {
      run: runner(null, null),
      url: { getLocation: cb => cb({ parameter: Object.fromEntries(new URLSearchParams(location.search)) }) }
    }
  };

  /** Consola: devReset() borra todo; devDemo() crea 8 sesiones pasadas con datos al azar en el primer curso con alumnos. */
  window.devReset = () => { localStorage.removeItem(KEY); localStorage.removeItem(PROPS); location.reload(); };
  window.devDemo = (recargar = true) => {
    const cursos = window.__gas.getState_('').cursos;
    const st = cursos.map(c => window.__gas.getState_(c.curso)).find(x => x.alumnos.length);
    if (!st) return;
    const curso = st.curso;
    const hoy = new Date(st.fecha + 'T12:00:00');
    const fechas = [];
    for (let d = new Date(hoy); fechas.length < 8; d.setDate(d.getDate() - 1)) {
      if ([1, 3].includes(d.getDay()) && d < hoy) fechas.unshift(d.toISOString().slice(0, 10));
    }
    fechas.forEach((f, i) => {
      const asis = st.alumnos.map(a => {
        const r = Math.random();
        return r < 0.75 ? { clave: a.clave, categoria: 'Puntualidad', puntos: 1, nota: 'Ingresó 07:0' + Math.floor(Math.random() * 9) }
          : r < 0.9 ? { clave: a.clave, categoria: 'Tardanza', puntos: -1, nota: 'Ingresó 07:2' + Math.floor(Math.random() * 9) }
            : { clave: a.clave, categoria: 'Falta', puntos: -1, nota: 'Sin hora de ingreso' };
      });
      window.__gas.addMovs_(curso, 'asistencia', asis, f);
      const chat = st.alumnos.filter(() => Math.random() < 0.6).map(a => ({ clave: a.clave, categoria: 'Participación', puntos: 1, nota: (1 + Math.floor(Math.random() * 6)) + ' mensajes' }));
      window.__gas.addMovs_(curso, 'chat', chat, f);
      if (i % 2 === 1) {
        const tareas = st.alumnos.map(a => Math.random() < 0.8
          ? { clave: a.clave, categoria: 'Tarea completa', puntos: 1 } : { clave: a.clave, categoria: 'No entregó tarea', puntos: -1 });
        window.__gas.addMovs_(curso, 'manual', tareas, f);
      }
      const extra = st.alumnos.filter(() => Math.random() < 0.15).map(a => ({ clave: a.clave, categoria: 'Buena respuesta', puntos: 2 }));
      window.__gas.addMovs_(curso, 'manual', extra, f);
    });
    // DNIs de prueba: 70000001, 70000002, ...
    st.alumnos.forEach((a, i) => window.__gas.updateAlumno_(curso, a.clave, { dni: String(70000001 + i) }));
    guardar();
    if (recargar) location.reload();
  };
  if (window.MOCK_DEMO && nueva) { window.devDemo(false); guardar(); }
})();
