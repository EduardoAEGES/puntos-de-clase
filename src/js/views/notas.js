/* Página pública de notas: el alumno escribe su DNI y ve solo su información. (?v=notas) */

Views.notas = {
  iniciar() { Views.entrada.iniciar(); },

  mostrar(lista, dni) {
    this.lista = lista; this.dni = dni;
    const yo = lista[0].alumno;
    const color = lista[0].equipo ? lista[0].equipo.color : '#E5E7EB';
    let h = `<div class="notas-wrap"><div class="fila" style="justify-content:space-between;margin-bottom:14px">
      <h2>Mis notas</h2><button class="btn" id="otra">Salir</button></div>
      <div class="card mi-avatar"><div>${avatarHTML(yo, color, 96, lista[0].avatarEstilo)}</div>
        <div class="grow"><h3>Hola, ${esc(nombreCorto(yo))}</h3>
        <p class="muted small" style="margin:4px 0 10px">Este es tu avatar. Ponle ropa, peinado y colores a tu estilo.</p>
        <button class="btn primary" data-act="miAvatar">Personalizar mi avatar</button></div></div>`;
    if (lista.length > 1) {
      h += `<div class="chips" style="margin-bottom:14px">${lista.map((d, i) => `<a class="chip" href="#c${i}">${esc(d.curso.nombre)} · ${esc(d.curso.seccion)}</a>`).join('')}</div>`;
    }
    lista.forEach((d, i) => { h += `<section id="c${i}" class="card" style="margin-bottom:16px">${Perfil.html(d, { publico: true })}</section>`; });
    h += '<p class="muted small" style="text-align:center">Si ves algo que no corresponde, coméntalo con tu docente.</p></div>';
    $('#app').innerHTML = h;
    $('#otra').onclick = () => Views.entrada.iniciar();
  }
};

Object.assign(Acciones, {
  miAvatar() {
    const d = Views.notas.lista[0];
    abrirEditorAvatar(d.alumno, {
      color: d.equipo ? d.equipo.color : '#E5E7EB',
      guardar: valor => Api.run('guardarAvatar', Views.notas.dni, valor)
        .then(() => Api.run('consultarNotas', Views.notas.dni))
        .then(r => { Views.notas.mostrar(r, Views.notas.dni); UI.toast('Avatar guardado'); })
        .catch(e => UI.toast(e.message || 'No se pudo guardar', { error: true }))
    });
  }
});
