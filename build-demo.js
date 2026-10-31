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

// Página: el bloque de desarrollo se cambia por el simulador en modo demo
const html = fs.readFileSync(path.join(R, 'src', 'index.html'), 'utf8')
  .replace('<title>Puntos de clase</title>', '<title>Puntos de clase · demo</title>')
  .replace(/<!-- dev:start -->[\s\S]*?<!-- dev:end -->/,
    `<script>window.MOCK_DEMO = true;</script>\n  <script src="demo/datos.js"></script>\n  <script src="demo/backend.js"></script>\n  <script src="demo/mock-gas.js"></script>`);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

fs.copyFileSync(path.join(R, 'demo', 'seed-demo.js'), path.join(OUT, 'demo', 'datos.js'));
fs.copyFileSync(path.join(R, 'apps-script', 'Code.js'), path.join(OUT, 'demo', 'backend.js'));
fs.copyFileSync(path.join(R, 'dev', 'mock-gas.js'), path.join(OUT, 'demo', 'mock-gas.js'));
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

console.log('Listo: docs/ (súbelo a GitHub Pages o ábrelo con un servidor local)');
