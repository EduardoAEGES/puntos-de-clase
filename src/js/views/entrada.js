/* Puerta de entrada: DNI para el alumno (ve sus notas y viste su avatar) o clave del docente. */

Views.entrada = {
  // Avatares de adorno: no son alumnos reales, solo muestran que cada uno podrá personalizar el suyo
  adorno: [
    'avataaars:sol|top=bob&clothing=hoodie&clothesColor=ff488e&skinColor=edb98a&hairColor=724133',
    'avataaars:luna|top=shortFlat&clothing=blazerAndShirt&clothesColor=25557c&skinColor=ffdbb4&hairColor=2c1b18&accessories=round&accessoriesProbability=100',
    'micah:mar|hair=full&shirt=crew&shirtColor=9287ff&baseColor=ac6651&hairColor=000000',
    'bottts:rayo|primaryColor=00acc1&eyes=glow&face=round01',
    'avataaars:nube|top=curly&clothing=overall&clothesColor=a7ffc4&skinColor=614335&hairColor=2c1b18',
    'adventurer:monte|hair=long10&hairColor=ab2a18&skinColor=ecad80',
    'avataaars:rio|top=hijab&clothing=graphicShirt&clothesColor=ffafb9&skinColor=d08b5b'
  ],

  async iniciar(aviso = '') {
    document.title = 'Puntos de clase';
    Api.olvidarPin();
    let configurado = true;
    try { configurado = (await Api.run('estadoPin')).configurado; } catch (e) { return pantallaError(e.message); }
    const demo = window.MOCK_DEMO;
    $('#app').innerHTML = `<div class="centro"><form class="caja card entrada" id="f-ent" style="padding:28px 20px">
      <div class="ent-avs">${this.adorno.map((v, i) => avatarHTML({ avatar: v, nombres: '', apellidos: '', clave: '' }, ['#BFE3F2', '#F7C8E6', '#D9CCF5', '#CDEDE6', '#FFF0A8', '#FFDDB0', '#C8EBC4'][i], 54)).join('')}</div>
      <h2>Puntos de clase</h2>
      <p class="muted">Escribe tu DNI para ver tus notas y personalizar tu avatar.</p>
      <input type="password" inputmode="numeric" maxlength="8" id="ent-clave" class="pin-in" placeholder="DNI" autocomplete="off" required>
      <p class="neg small" id="ent-err" style="margin:10px 0 0">${esc(aviso)}</p>
      <button class="btn primary block" style="margin-top:12px">Entrar</button>
      ${demo ? '<p class="muted small" style="margin:14px 0 0">Demo: DNI de prueba 70000001 a 70000045 · docente 0000</p>' : ''}
      ${configurado || window.APPS_SCRIPT_URL ? '' : '<button type="button" class="btn block" id="ent-crear" style="margin-top:10px">Soy docente: crear mi PIN</button>'}
    </form></div>`;
    const campo = $('#ent-clave');
    campo.focus();
    const err = m => { $('#ent-err').textContent = m; };
    if ($('#ent-crear')) $('#ent-crear').onclick = () => pantallaPin();
    $('#f-ent').onsubmit = async ev => {
      ev.preventDefault();
      const v = campo.value.replace(/\D/g, '');
      const btn = ev.target.querySelector('button.primary');
      if (v.length < 4) return err('Escribe tu DNI de 8 dígitos.');
      btn.disabled = true; btn.textContent = 'Entrando…';
      const fin = m => { btn.disabled = false; btn.textContent = 'Entrar'; err(m); };
      try {
        const clave = await Api.run('verificarClave', v);
        if (clave === true) {                           // docente
          Api.setPin(v);
          return await cargar();
        }
        const bloq = 'Demasiados intentos con claves incorrectas. Espera unos minutos.';
        if (v.length !== 8) return fin(clave === 'bloqueado' ? bloq : 'No reconozco esa clave.');
        const r = await Api.run('consultarNotas', v);   // alumno
        if (!r.length) return fin(clave === 'bloqueado' ? bloq : 'No encontré ese DNI. Consulta con tu docente.');
        Views.notas.mostrar(r, v);
      } catch (e) { fin(e.message || 'No se pudo entrar.'); }
    };
  }
};
