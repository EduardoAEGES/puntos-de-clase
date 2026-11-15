/* Avatares: ilustrados (DiceBear) o iniciales con el color del equipo.
   Valor guardado en la columna Avatar: "estilo:semilla" o "estilo:semilla|opcion=valor&opcion=valor"
   (las opciones son la ropa, el peinado y los colores que elige el alumno), o "iniciales". */

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

/* ---------- Catálogo del editor (cada valor se comprobó contra la API de DiceBear) ---------- */

const PIEL = ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335', 'fd9841', 'f8d25c'];
const PELO = ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'e8e1e1', 'f59797', '65c9ff'];
const ROPA = ['262e33', '25557c', '5199e4', '65c9ff', 'b1e2ff', 'a7ffc4', 'ffffb1', 'ffdeb5', 'ffafb9', 'ff488e', 'ff5c5c', '929598', 'e6e6e6', 'ffffff'];

// c: lista de opciones [valor, texto] · col: colores hex · prob: opción "Ninguno" que apaga el accesorio
const AV_CAT = {
  avataaars: { nombre: 'Clásico', campos: [
    { k: 'top', t: 'Peinado / gorro', c: [['bob', 'Bob'], ['bun', 'Moño'], ['curly', 'Rizado'], ['curvy', 'Ondulado'], ['dreads', 'Rastas'], ['fro', 'Afro'], ['shortFlat', 'Corto'], ['shortWaved', 'Corto con ondas'], ['shaggy', 'Despeinado'], ['straight01', 'Lacio'], ['sides', 'Laterales'], ['shavedSides', 'Rapado'], ['hat', 'Sombrero'], ['winterHat1', 'Gorro de lana'], ['hijab', 'Hiyab'], ['turban', 'Turbante']] },
    { k: 'hairColor', t: 'Color de pelo', col: PELO },
    { k: 'clothing', t: 'Ropa', c: [['hoodie', 'Casaca con capucha'], ['graphicShirt', 'Polo estampado'], ['shirtCrewNeck', 'Polo'], ['shirtVNeck', 'Polo en V'], ['shirtScoopNeck', 'Polo escote'], ['blazerAndShirt', 'Saco y camisa'], ['blazerAndSweater', 'Saco y suéter'], ['collarAndSweater', 'Suéter con cuello'], ['overall', 'Overol']] },
    { k: 'clothesColor', t: 'Color de la ropa', col: ROPA },
    { k: 'accessories', t: 'Lentes', prob: 'accessoriesProbability', c: [['round', 'Redondos'], ['sunglasses', 'De sol'], ['wayfarers', 'Wayfarer'], ['kurt', 'Kurt'], ['prescription01', 'Medida 1'], ['prescription02', 'Medida 2']] },
    { k: 'facialHair', t: 'Barba', prob: 'facialHairProbability', c: [['beardLight', 'Ligera'], ['beardMedium', 'Media'], ['beardMajestic', 'Majestuosa']] },
    { k: 'eyes', t: 'Ojos', c: [['default', 'Normal'], ['happy', 'Feliz'], ['hearts', 'Corazones'], ['side', 'De lado'], ['squint', 'Entrecerrados'], ['surprised', 'Sorprendidos'], ['wink', 'Guiño']] },
    { k: 'mouth', t: 'Boca', c: [['default', 'Normal'], ['smile', 'Sonrisa'], ['twinkle', 'Alegre'], ['serious', 'Seria'], ['tongue', 'Lengua']] },
    { k: 'skinColor', t: 'Piel', col: PIEL }
  ] },
  micah: { nombre: 'Micah', campos: [
    { k: 'hair', t: 'Peinado', c: [['full', 'Completo'], ['pixie', 'Pixie'], ['fonze', 'Fonzie'], ['mrClean', 'Rapado'], ['dougFunny', 'Doug'], ['dannyPhantom', 'Danny'], ['mrT', 'Mohicano'], ['turban', 'Turbante']] },
    { k: 'hairColor', t: 'Color de pelo', col: ['000000', '6a4e35', 'ac6651', 'f4d150', 'fc909f', '9287ff', '6bd9e9', 'ffffff'] },
    { k: 'shirt', t: 'Ropa', c: [['crew', 'Polo'], ['collared', 'Con cuello'], ['open', 'Abierta']] },
    { k: 'shirtColor', t: 'Color de la ropa', col: ['000000', '6bd9e9', '9287ff', 'd2eff3', 'e0ddff', 'f4d150', 'fc909f', 'ffeba4', 'ffedef', 'ffffff'] },
    { k: 'glasses', t: 'Lentes', prob: 'glassesProbability', c: [['round', 'Redondos'], ['square', 'Cuadrados']] },
    { k: 'earrings', t: 'Aretes', prob: 'earringsProbability', c: [['hoop', 'Aros'], ['stud', 'Pequeños']] },
    { k: 'facialHair', t: 'Barba', prob: 'facialHairProbability', c: [['beard', 'Barba'], ['scruff', 'Sombra']] },
    { k: 'baseColor', t: 'Piel', col: ['f9c9b6', 'ac6651', '77311d'] }
  ] },
  adventurer: { nombre: 'Aventurero', campos: [
    { k: 'hair', t: 'Peinado', c: [['short01', 'Corto 1'], ['short10', 'Corto 2'], ['short19', 'Corto 3'], ['long01', 'Largo 1'], ['long10', 'Largo 2']] },
    { k: 'hairColor', t: 'Color de pelo', col: ['0e0e0e', '562306', '6a4e35', 'ac6651', 'ab2a18', 'cb6820', 'b9a05f', 'afafaf', 'dba3be', '85c2c6', '3eac2c'] },
    { k: 'glasses', t: 'Lentes', prob: 'glassesProbability', c: [['variant01', 'Modelo 1'], ['variant05', 'Modelo 2']] },
    { k: 'earrings', t: 'Aretes', prob: 'earringsProbability', c: [['variant01', 'Modelo 1'], ['variant03', 'Modelo 2']] },
    { k: 'skinColor', t: 'Piel', col: ['f5d0c5', 'ecad80', 'd08b5b', 'ae5d29', '9e5622', '763900'] }
  ] },
  bottts: { nombre: 'Robot', campos: [
    { k: 'primaryColor', t: 'Color', col: ['00acc1', '1e88e5', '5e35b1', '8e24aa', 'd81b60', 'e53935', 'f4511e', 'fb8c00', 'fdd835', '7cb342', '43a047', '00897b', '546e7a'] },
    { k: 'eyes', t: 'Ojos', c: [['bulging', 'Saltones'], ['glow', 'Brillo'], ['happy', 'Felices'], ['hearts', 'Corazones'], ['round', 'Redondos'], ['eva', 'Eva'], ['sensor', 'Sensor']] },
    { k: 'mouth', t: 'Boca', c: [['bite', 'Dientes'], ['diagram', 'Diagrama'], ['grill01', 'Parrilla'], ['smile01', 'Sonrisa 1'], ['smile02', 'Sonrisa 2'], ['square01', 'Cuadrada 1'], ['square02', 'Cuadrada 2']] },
    { k: 'face', t: 'Cara', c: [['round01', 'Redonda 1'], ['round02', 'Redonda 2'], ['square01', 'Cuadrada 1'], ['square02', 'Cuadrada 2'], ['square03', 'Cuadrada 3']] },
    { k: 'top', t: 'Antena', prob: 'topProbability', c: [['antenna', 'Antena'], ['antennaCrooked', 'Torcida'], ['bulb01', 'Foco'], ['glowingBulb01', 'Foco brillante'], ['horns', 'Cuernos'], ['lights', 'Luces'], ['radar', 'Radar']] }
  ] }
};

/* ---------- Lectura y dibujo ---------- */

const optsDe = txt => Object.fromEntries(String(txt || '').split('&').filter(Boolean).map(p => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; }));
const optsATxt = o => Object.entries(o).map(([k, v]) => k + '=' + v).join('&');

/** Lee el valor de la columna Avatar: "estilo:semilla[|opciones]", "iniciales" o vacío (usa el estilo por defecto). */
function avatarDe(a, estiloDef) {
  const v = String(a.avatar || '');
  if (v === 'iniciales') return null;
  if (v.includes(':')) {
    const [cabeza, extra] = v.split('|');
    const [estilo, ...r] = cabeza.split(':');
    return { estilo, semilla: r.join(':'), opts: optsDe(extra) };
  }
  if (!estiloDef || estiloDef === 'iniciales') return null;
  return { estilo: estiloDef, semilla: a.clave + ' ' + a.nombres, opts: {} };
}

const avatarUrl = (estilo, semilla, opts) =>
  `https://api.dicebear.com/9.x/${estilo}/svg?seed=${encodeURIComponent(semilla)}` +
  Object.entries(opts || {}).map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('');

/** a: alumno; color: color del equipo; px: tamaño. */
function avatarHTML(a, color, px = 56, estiloDef) {
  const av = avatarDe(a, estiloDef ?? (typeof S !== 'undefined' && S.st ? S.st.config.avatarEstilo : 'adventurer'));
  const bg = color || '#E5E7EB';
  const img = av ? `<img src="${esc(avatarUrl(av.estilo, av.semilla, av.opts))}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<div class="av" style="width:${px}px;height:${px}px;font-size:${Math.round(px * .38)}px;--av-bg:${bg};--av-ink:${shade(bg, .55)}"><span>${esc(iniciales(a))}</span>${img}</div>`;
}
