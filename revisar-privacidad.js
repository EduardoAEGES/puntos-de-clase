/**
 * Busca datos reales de privado/Datos.gs en archivos que se publican.
 * Revisa apellidos y nombres completos, "Nombre Apellido" en forma corta,
 * códigos de curso y NRC.
 * Uso: node revisar-privacidad.js            (todo lo que Git versionaría)
 *      require('./revisar-privacidad').revisar(['docs/...'])
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const R = __dirname;
const PRIVADO = path.join(R, 'privado', 'Datos.gs');

function marcas() {
  if (!fs.existsSync(PRIVADO)) return [];
  const datos = fs.readFileSync(PRIVADO, 'utf8');
  const m = new Set();
  [...datos.matchAll(/'([^'|]+)\|([^']*)'/g)].forEach(([, ape, nom]) => {
    m.add(ape);
    m.add(nom);
    m.add(nom.split(' ')[0] + ' ' + ape.split(' ')[0]);   // "Ana Quispe"
    m.add(ape.split(' ')[0] + ' ' + nom.split(' ')[0]);   // "Quispe Ana"
  });
  // Filas de cursos: ['CODIGO', 'Nombre', 'Sección', 'NRC', ...]
  datos.split('\n').forEach(l => {
    const q = [...l.matchAll(/'([^']*)'/g)].map(x => x[1]);
    if (/^[A-Z]+-\d+[A-Z]?$/.test(q[0] || '')) {
      m.add(q[0]);
      if ((q[3] || '').length >= 4) m.add(q[3]);
    }
  });
  return [...m].filter(x => x.length >= 4);
}

const plano = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Devuelve la lista de fugas "archivo: dato" en los archivos dados. */
function revisar(archivos) {
  const lista = marcas().map(x => [x, plano(x)]);
  const fugas = [];
  archivos.forEach(f => {
    if (/\.(png|jpe?g|ico|gif|webp)$/i.test(f)) return;
    const t = plano(fs.readFileSync(path.resolve(R, f), 'utf8'));
    lista.forEach(([orig, p]) => { if (t.includes(p)) fugas.push(path.relative(R, path.resolve(R, f)) + ': ' + orig); });
  });
  return fugas;
}

module.exports = { revisar, marcas };

if (require.main === module) {
  const archivos = execSync('git ls-files --cached --others --exclude-standard', { cwd: R, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const fugas = revisar(archivos);
  if (fugas.length) { console.error('Datos reales en archivos versionados:\n' + fugas.join('\n')); process.exit(1); }
  console.log('Sin datos reales: ' + archivos.length + ' archivos y ' + marcas().length + ' datos revisados');
}
