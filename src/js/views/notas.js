/* Página pública de notas: el alumno escribe su DNI y ve solo su información. (?v=notas) */

Views.notas = {
  iniciar() {
    document.title = 'Mis notas';
    this.form();
  },

  form(error = '') {
    $('#app').innerHTML = `<div class="centro"><form class="caja card" id="f-dni" style="padding:28px 20px">
      <div class="logo">${ICON.birrete}</div>
      <h2>Mis notas</h2>
      <p class="muted">Escribe tu DNI para ver tu avance.</p>
      <input type="tel" inputmode="numeric" maxlength="8" id="dni" class="pin-in" placeholder="DNI" autocomplete="off" required>
      ${error ? `<p class="neg small" style="margin:10px 0 0">${esc(error)}</p>` : ''}
      <button class="btn primary block" style="margin-top:14px">Ver mis notas</button>
    </form></div>`;
    const f = $('#f-dni');
    $('#dni').focus();
    f.onsubmit = e => {
      e.preventDefault();
      const dni = $('#dni').value.replace(/\D/g, '');
      if (dni.length !== 8) return this.form('El DNI tiene 8 dígitos.');
      f.querySelector('button').disabled = true;
      f.querySelector('button').textContent = 'Buscando…';
      Api.run('consultarNotas', dni)
        .then(r => r.length ? this.mostrar(r) : this.form('No encontré ese DNI. Consulta con tu docente.'))
        .catch(err => this.form(err.message));
    };
  },

  mostrar(lista) {
    let h = `<div class="notas-wrap"><div class="fila" style="justify-content:space-between;margin-bottom:14px">
      <h2>Mis notas</h2><button class="btn" id="otra">Salir</button></div>`;
    if (lista.length > 1) {
      h += `<div class="chips" style="margin-bottom:14px">${lista.map((d, i) => `<a class="chip" href="#c${i}">${esc(d.curso.nombre)} · ${esc(d.curso.seccion)}</a>`).join('')}</div>`;
    }
    lista.forEach((d, i) => { h += `<section id="c${i}" class="card" style="margin-bottom:16px">${Perfil.html(d, { publico: true })}</section>`; });
    h += '<p class="muted small" style="text-align:center">Si ves algo que no corresponde, coméntalo con tu docente.</p></div>';
    $('#app').innerHTML = h;
    $('#otra').onclick = () => this.form();
  }
};
