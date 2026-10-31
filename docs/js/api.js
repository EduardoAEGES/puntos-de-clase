/* Comunicación con Apps Script (google.script.run). En desarrollo lo atiende dev/mock-gas.js. */

// La demo guarda su PIN aparte para no pisar el de la app real en el mismo navegador
const PIN_KEY = window.MOCK_DEMO ? 'pin-demo' : 'pin';

const Api = {
  pin: store.get(PIN_KEY, ''),

  run(fn, ...args) {
    return new Promise((ok, fail) => {
      if (typeof google === 'undefined' || !google.script) return fail(new Error('Abre la app desde el enlace de Apps Script.'));
      google.script.run.withSuccessHandler(ok).withFailureHandler(e => fail(e instanceof Error ? e : new Error(String(e && e.message || e))))[fn](...args);
    });
  },

  /** Acciones del docente: siempre pasan por api(pin, fn, args) en el servidor. */
  call(fn, ...args) { return this.run('api', this.pin, fn, args); },

  setPin(p) { this.pin = p; store.set(PIN_KEY, p); },
  olvidarPin() { this.pin = ''; store.del(PIN_KEY); },

  location() {
    return new Promise(ok => {
      try { google.script.url.getLocation(l => ok(l.parameter || {})); }
      catch (e) { ok(Object.fromEntries(new URLSearchParams(location.search))); }
    });
  }
};
