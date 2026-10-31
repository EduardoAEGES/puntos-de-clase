/* Avatares: ilustrados (DiceBear) o iniciales con el color del equipo. */

const ESTILOS = [
  { id: 'adventurer', nombre: 'Aventurero' },
  { id: 'avataaars', nombre: 'Clásico' },
  { id: 'big-smile', nombre: 'Sonrisa' },
  { id: 'fun-emoji', nombre: 'Emoji' },
  { id: 'bottts', nombre: 'Robot' },
  { id: 'lorelei', nombre: 'Lorelei' },
  { id: 'micah', nombre: 'Micah' },
  { id: 'thumbs', nombre: 'Pulgar' }
];

/** Lee el valor de la columna Avatar: "estilo:semilla", "iniciales" o vacío (usa el estilo por defecto). */
function avatarDe(a, estiloDef) {
  const v = String(a.avatar || '');
  if (v === 'iniciales') return null;
  if (v.includes(':')) { const [estilo, ...r] = v.split(':'); return { estilo, semilla: r.join(':') }; }
  if (!estiloDef || estiloDef === 'iniciales') return null;
  return { estilo: estiloDef, semilla: a.clave + ' ' + a.nombres };
}

const avatarUrl = (estilo, semilla) => `https://api.dicebear.com/9.x/${estilo}/svg?seed=${encodeURIComponent(semilla)}`;

/** a: alumno; color: color del equipo; px: tamaño. */
function avatarHTML(a, color, px = 56, estiloDef) {
  const av = avatarDe(a, estiloDef ?? (typeof S !== 'undefined' && S.st ? S.st.config.avatarEstilo : 'adventurer'));
  const bg = color || '#E5E7EB';
  const img = av ? `<img src="${esc(avatarUrl(av.estilo, av.semilla))}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<div class="av" style="width:${px}px;height:${px}px;font-size:${Math.round(px * .38)}px;--av-bg:${bg};--av-ink:${shade(bg, .55)}"><span>${esc(iniciales(a))}</span>${img}</div>`;
}
