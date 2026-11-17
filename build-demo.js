/**
 * Arma la demo estática en docs/ para GitHub Pages (Settings → Pages → rama main, carpeta /docs).
 * Mantiene HTML, CSS y JS separados. El backend corre en el navegador con el simulador
 * y los datos inventados de demo/seed-demo.js: no se publica ningún alumno real.
 * Uso: node build-demo.js
 */
const fs = require('fs');
const path = require('path');

const R = __dirname;
const OUT = path.join(R, 'docs');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'demo'), { recursive: true });
fs.cpSync(path.join(R, 'src', 'css'), path.join(OUT, 'css'), { recursive: true });
fs.cpSync(path.join(R, 'src', 'js'), path.join(OUT, 'js'), { recursive: true });

// Modo real: si existe url-apps-script.txt (enlace /exec de tu Apps Script), la página usa tus datos reales
// por esa API y no lleva ni el simulador ni la demo. Sin ese archivo, queda la demo con datos inventados.
const urlFile = path.join(R, 'url-apps-script.txt');
const URL_REAL = fs.existsSync(urlFile) ? fs.readFileSync(urlFile, 'utf8').trim() : '';
if (URL_REAL && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(URL_REAL)) {
  throw new Error('url-apps-script.txt debe tener el enlace que termina en /exec de tu implementación de Apps Script.');
}

// Página: el bloque de desarrollo se cambia por el simulador (demo) o por la dirección del Apps Script (real)
const bloque = URL_REAL
  ? `<script>window.APPS_SCRIPT_URL = ${JSON.stringify(URL_REAL)};</script>`
  : `<script>window.MOCK_DEMO = true;</script>\n  <script src="demo/relleno.js"></script>\n  <script src="demo/datos.js"></script>\n  <script src="demo/backend.js"></script>\n  <script src="demo/mock-gas.js"></script>`;
const html = fs.readFileSync(path.join(R, 'src', 'index.html'), 'utf8')
  .replace('<title>Puntos de clase</title>', URL_REAL ? '<title>Puntos de clase</title>' : '<title>Puntos de clase · demo</title>')
  .replace(/<!-- dev:start -->[\s\S]*?<!-- dev:end -->/, bloque);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

if (!URL_REAL) {
  fs.copyFileSync(path.join(R, 'demo', 'relleno.js'), path.join(OUT, 'demo', 'relleno.js'));
  fs.copyFileSync(path.join(R, 'demo', 'seed-demo.js'), path.join(OUT, 'demo', 'datos.js'));
  fs.copyFileSync(path.join(R, 'apps-script', 'Code.js'), path.join(OUT, 'demo', 'backend.js'));
  fs.copyFileSync(path.join(R, 'dev', 'mock-gas.js'), path.join(OUT, 'demo', 'mock-gas.js'));
} else {
  fs.rmSync(path.join(OUT, 'demo'), { recursive: true, force: true });
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// Control: ningún dato de privado/Datos.js puede quedar en docs/ (ver revisar-privacidad.js)
const { revisar, marcas } = require('./revisar-privacidad');
const archivos = [];
(function recorrer(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    e.isDirectory() ? recorrer(p) : archivos.push(p);
  });
})(OUT);
const fugas = revisar(archivos);
if (fugas.length) {
  fs.rmSync(OUT, { recursive: true, force: true });
  throw new Error('La demo contenía datos reales y se borró:\n' + fugas.join('\n'));
}
if (marcas().length) console.log('Revisado: ningún dato de privado/Datos.js aparece en docs/');

console.log((URL_REAL ? 'Modo real (Apps Script). ' : 'Modo demo. ') + 'Listo: docs/ (súbelo a GitHub Pages o ábrelo con un servidor local)');
