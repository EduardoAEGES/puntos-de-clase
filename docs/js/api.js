/* Comunicación con Apps Script (google.script.run). En desarrollo lo atiende dev/mock-gas.js. */

// El PIN o la clave del docente solo vive en memoria: al recargar se vuelve a pedir en la pantalla de entrada
const Api = {
  pin: '',

  run(fn, ...args) {
    return new Promise((ok, fail) => {
      if (typeof google === 'undefined' || !google.script) return fail(new Error('Abre la app desde el enlace de Apps Script.'));
      google.script.run.withSuccessHandler(ok).withFailureHandler(e => fail(e instanceof Error ? e : new Error(String(e && e.message || e))))[fn](...args);
    });
  },

  /** Acciones del docente: siempre pasan por api(pin, fn, args) en el servidor. */
  call(fn, ...args) { return this.run('api', this.pin, fn, args); },

  setPin(p) { this.pin = p; },
  olvidarPin() { this.pin = ''; },

  location() {
    return new Promise(ok => {
      try { google.script.url.getLocation(l => ok(l.parameter || {})); }
      catch (e) { ok(Object.fromEntries(new URLSearchParams(location.search))); }
    });
  }
};
