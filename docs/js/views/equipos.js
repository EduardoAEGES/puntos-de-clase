/* Pantalla Equipos: ranking por puntos acumulados. */

Views.equipos = {
  render() {
    const st = S.st;
    const lista = st.equipos.slice().sort((x, y) => y.total - x.total);
    const max = Math.max(1, ...lista.map(e => Math.abs(e.total)));
    let h = `<div class="seccion-head"><div><h2>Equipos</h2><p class="muted small">Suma de los puntos de sus integrantes</p></div></div>`;
    if (!lista.length) return h + '<div class="card vacio"><p>Este curso aún no tiene equipos.</p></div>';
    h += '<div class="stack">';
    lista.forEach((e, i) => {
      const miembros = st.alumnos.filter(a => a.equipo === e.equipo).sort((x, y) => y.total - x.total);
      h += `<div class="card equipo-card" style="--eq:${e.color}">
        <div class="fila-top">
          <div class="puesto ${i < 3 ? 'm' + (i + 1) : ''}">${i + 1}</div>
          <div class="grow" style="flex:1;min-width:0"><h3>${esc(e.nombre)}</h3>
            <div class="barra" style="margin-top:8px"><i style="width:${Math.round(Math.abs(e.total) / max * 100)}%;background:${shade(e.color, .25)}"></i></div></div>
          <div class="pts ${e.total < 0 ? 'neg' : ''}">${e.total}</div>
        </div>
        <div class="miembros">${miembros.map(a => `<button class="miembro" data-act="perfil" data-clave="${esc(a.clave)}">${avatarHTML(a, e.color, 28)}${esc(nombreCorto(a))} <b class="${a.total < 0 ? 'neg' : 'pos'}">${a.total}</b></button>`).join('')}</div>
        <div class="chips" style="margin-top:12px">
          <button class="btn pos" data-act="puntosEquipo" data-eq="${e.equipo}">${ICON.estrella}Dar puntos al equipo</button>
          <button class="btn ghost" data-act="renombrarEquipo" data-eq="${e.equipo}">${ICON.lapiz}Renombrar</button>
        </div></div>`;
    });
    return h + '</div>';
  }
};

Object.assign(Acciones, {
  puntosEquipo(el) {
    const claves = S.st.alumnos.filter(a => a.equipo === +el.dataset.eq).map(a => a.clave);
    if (claves.length) abrirPuntos(claves);
  },
  renombrarEquipo(el) {
    const e = equipoDe(+el.dataset.eq);
    const n = prompt('Nombre del equipo', e.nombre);
    if (n === null || !n.trim() || n.trim() === e.nombre) return;
    e.nombre = n.trim();
    render();
    enviar('saveEquipo', [S.st.curso, e.equipo, e.nombre]);
  }
});
