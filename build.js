/**
 * Junta src/ (HTML + CSS + JS separados) en apps-script/Index.html,
 * porque Apps Script solo sirve archivos .html y .gs.
 * Uso: node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'apps-script', 'Index.html');

let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

// Lo que va solo en desarrollo (simulador del Sheets)
html = html.replace(/<!-- dev:start -->[\s\S]*?<!-- dev:end -->\s*/g, '');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(SRC, href), 'utf8')}\n</style>`);

html = html.replace(/<script src="(?!https?:)([^"]+)"><\/script>/g, (_, src) =>
  `<script>\n/* ${src} */\n${fs.readFileSync(path.join(SRC, src), 'utf8')}\n</script>`);

fs.writeFileSync(OUT, html);
console.log('Listo: ' + path.relative(__dirname, OUT) + ' (' + Math.round(html.length / 1024) + ' KB)');
