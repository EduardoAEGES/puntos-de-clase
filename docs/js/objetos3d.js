/* Objetos 3D animados (solo CSS) para la portada de cada curso. Estilos en css/objetos3d.css. */

/** Pares de color neón por curso, en el orden de la hoja Cursos. */
const COLOR_CURSO = [
  ['#7C83FF', '#22D3EE'], ['#F472B6', '#A78BFA'], ['#22D3EE', '#34D399'],
  ['#A78BFA', '#F472B6'], ['#FBBF24', '#F97316'], ['#34D399', '#22D3EE'],
  ['#F97316', '#FB7185'], ['#60A5FA', '#A78BFA'], ['#E879F9', '#6366F1']
];

/** Qué objeto lleva cada materia, según palabras de su nombre. */
function tipoObjeto(nombre) {
  const n = norm(nombre);
  if (n.includes('ANALISIS')) return 'barras';
  if (n.includes('CONTAB')) return 'moneda';
  if (n.includes('COSTO') || n.includes('PRESUPUESTO')) return 'pastel';
  if (n.includes('LOGIC')) return 'cubo';
  if (n.includes('INVESTIG')) return 'atomo';
  if (n.includes('MATEM')) return 'piramide';
  if (n.includes('EXPERIENCIA') || n.includes('FORMATIVA')) return 'giro';
  return 'cubo';
}

/** Colores y objeto de un curso. i = posición del curso en la lista. */
function temaCurso(info, i) {
  const [c1, c2] = COLOR_CURSO[i % COLOR_CURSO.length];
  return { c1, c2, tipo: tipoObjeto(info.nombre), estilo: `--c1:${c1};--c2:${c2}` };
}

const capas = (n, cls = '') => Array.from({ length: n }, (_, i) => `<i class="${cls}" style="--z:${i}"></i>`).join('');

const OBJETOS = {
  cubo: () => `<div class="o3d-obj cubo">${['∧', '∨', '¬', '→', '↔', '∴']
    .map((s, i) => `<div class="cara c${i}"><span>${s}</span></div>`).join('')}</div>`,

  moneda: () => `<div class="o3d-obj moneda">${capas(9)}<b class="frente">S/</b><b class="dorso">$</b></div>`,

  barras: () => `<div class="o3d-obj barras">${[34, 56, 44, 76].map((h, i) =>
    `<div class="barra3d" style="--h:${h}px;--x:${i * 26 - 48}px;--d:${-i * 0.6}s">
      <i class="f"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="t"></i></div>`).join('')}</div>`,

  pastel: () => `<div class="o3d-obj pastel">${capas(7)}<b></b></div>`,

  atomo: () => `<div class="o3d-obj atomo"><b class="nucleo"></b>${[0, 60, 120].map((r, i) =>
    `<div class="orbita" style="--r:${r}deg;--t:${2.4 + i * 0.7}s"><i></i></div>`).join('')}</div>`,

  piramide: () => `<div class="o3d-obj piramide">${[0, 90, 180, 270].map(r => `<i style="--r:${r}deg"></i>`).join('')}
    <b class="base"></b><span class="pi">π</span></div>`,

  giro: () => `<div class="o3d-obj giro"><b class="nucleo"></b><div class="anillo a1"></div><div class="anillo a2"></div><div class="anillo a3"></div></div>`
};

/** HTML del objeto con su sombra y su flotación. tam: 'grande' (portada) o 'chico' (cabecera). */
function objeto3D(tipo, tam = 'grande') {
  return `<div class="o3d ${tam}" aria-hidden="true"><div class="o3d-flota">${(OBJETOS[tipo] || OBJETOS.cubo)()}</div><span class="o3d-sombra"></span></div>`;
}
