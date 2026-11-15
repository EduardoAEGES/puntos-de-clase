/* Editor de avatar: el alumno elige estilo, ropa, peinado y colores. Usa el catálogo de avatar.js. */

/* ---------- Editor: el alumno viste y colorea su avatar ---------- */

const AE = { estilo: 'avataaars', semilla: '', opts: {}, color: '#E5E7EB', nombre: '', guardar: null };

const aeValor = () => AE.estilo + ':' + AE.semilla + (Object.keys(AE.opts).length ? '|' + optsATxt(AE.opts) : '');

/**
 * Abre el editor. actual: valor guardado (o vacío), guardar(valor): función que lo envía.
 * Solo los estilos con catálogo se pueden vestir; el resto se elige entre variantes.
 */
function abrirEditorAvatar(a, { color, guardar }) {
  const av = avatarDe(a, 'avataaars');
  AE.estilo = av && AV_CAT[av.estilo] ? av.estilo : 'avataaars';
  AE.semilla = av && av.estilo === AE.estilo ? av.semilla : a.clave + ' ' + a.nombres;
  AE.opts = av && av.estilo === AE.estilo ? { ...av.opts } : {};
  AE.color = color || '#E5E7EB';
  AE.nombre = a.nombres || '';
  AE.guardar = guardar;
  pintarEditorAvatar();
}

function pintarEditorAvatar() {
  const cat = AV_CAT[AE.estilo];
  const campo = f => {
    const act = AE.opts[f.k];
    const apagado = f.prob && AE.opts[f.prob] === '0';
    if (f.col) {
      return `<div class="ae-campo"><b>${f.t}</b><div class="ae-col">${f.col.map(c =>
        `<button class="ae-sw ${act === c ? 'on' : ''}" style="background:#${c}" data-act="avOpc" data-k="${f.k}" data-v="${c}" aria-label="${f.t} ${c}"></button>`).join('')}</div></div>`;
    }
    return `<div class="ae-campo"><b>${f.t}</b><div class="chips">
      ${f.prob ? `<button class="chip ${apagado ? 'on' : ''}" data-act="avOpc" data-k="${f.k}" data-v="">Ninguno</button>` : ''}
      ${f.c.map(([v, t]) => `<button class="chip ${act === v && !apagado ? 'on' : ''}" data-act="avOpc" data-k="${f.k}" data-v="${v}">${t}</button>`).join('')}</div></div>`;
  };
  UI.hoja(`<div class="hoja-head"><div class="grow"><h3>Tu avatar</h3></div>
      <button class="icon-btn" data-act="cerrar">${ICON.x}</button></div>
    <div class="ae-prev">${avatarHTML({ avatar: aeValor(), clave: '', nombres: AE.nombre, apellidos: '' }, AE.color, 132)}</div>
    <div class="chips ae-estilos">${Object.entries(AV_CAT).map(([id, e]) =>
      `<button class="chip ${id === AE.estilo ? 'on' : ''}" data-act="avEstilo" data-v="${id}">${e.nombre}</button>`).join('')}
      <button class="chip" data-act="avAzar">🎲 Sorpréndeme</button></div>
    ${cat.campos.map(campo).join('')}
    <div class="ae-pie"><button class="btn" data-act="avIniciales">Usar mis iniciales</button><button class="btn primary" data-act="avGuardar">Guardar avatar</button></div>`,
  { ancha: true });
}

Object.assign(Acciones, {
  avEstilo(el) {
    if (el.dataset.v !== AE.estilo) { AE.estilo = el.dataset.v; AE.opts = {}; }
    pintarEditorAvatar();
  },
  avOpc(el) {
    const f = AV_CAT[AE.estilo].campos.find(x => x.k === el.dataset.k);
    const v = el.dataset.v;
    if (f.prob) {
      if (v === '') { delete AE.opts[f.k]; AE.opts[f.prob] = '0'; }
      else { AE.opts[f.k] = v; AE.opts[f.prob] = '100'; }
    } else AE.opts[f.k] = v;
    pintarEditorAvatar();
  },
  avAzar() {
    const cat = AV_CAT[AE.estilo];
    const pick = l => l[Math.floor(Math.random() * l.length)];
    AE.semilla = 'v' + Math.random().toString(36).slice(2, 8);
    AE.opts = {};
    cat.campos.forEach(f => {
      if (f.col) AE.opts[f.k] = pick(f.col);
      else if (f.prob) { if (Math.random() < .4) { AE.opts[f.k] = pick(f.c)[0]; AE.opts[f.prob] = '100'; } else AE.opts[f.prob] = '0'; }
      else AE.opts[f.k] = pick(f.c)[0];
    });
    pintarEditorAvatar();
  },
  avIniciales() { UI.cerrar(); AE.guardar && AE.guardar('iniciales'); },
  avGuardar() { const v = aeValor(); UI.cerrar(); AE.guardar && AE.guardar(v); }
});
