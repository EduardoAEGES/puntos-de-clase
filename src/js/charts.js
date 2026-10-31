/* Gráficos SVG simples, sin librerías. */

const Charts = {
  /** Línea con puntos. datos: [{x: etiqueta, y: número|null}] */
  linea(datos, { min = 0, max = 20, ref = null, color = 'var(--accent)', alto = 180 } = {}) {
    const W = 480, H = alto, L = 30, R = 10, T = 12, B = 24;
    if (!datos.length) return '<p class="muted small">Aún no hay sesiones.</p>';
    const n = datos.length;
    const x = i => L + (n === 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1));
    const y = v => T + (H - T - B) * (1 - (v - min) / (max - min || 1));
    const ticks = [min, (min + max) / 2, max];
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
    ticks.forEach(t => {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" />`;
      s += `<text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`;
    });
    if (ref !== null) {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(ref)}" y2="${y(ref)}" stroke="var(--neg)" stroke-dasharray="5 5" opacity=".6" />`;
    }
    const pts = datos.map((d, i) => d.y === null ? null : [x(i), y(d.y)]);
    let path = '';
    pts.forEach(p => { if (p) path += (path ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' '; });
    if (path) s += `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`;
    pts.forEach((p, i) => {
      if (p) s += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="var(--surface)" stroke="${color}" stroke-width="3"><title>${esc(datos[i].x)}: ${fmtNota(datos[i].y)}</title></circle>`;
    });
    const paso = Math.ceil(n / 8);
    datos.forEach((d, i) => { if (i % paso === 0 || i === n - 1) s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(d.x)}</text>`; });
    return s + '</svg>';
  },

  /** Barras apiladas. grupos: [{x, partes: [n, n, n]}], colores: [..] (mismo orden que partes) */
  apiladas(grupos, colores, { alto = 180 } = {}) {
    const W = 480, H = alto, L = 30, R = 10, T = 12, B = 24;
    if (!grupos.length) return '<p class="muted small">Aún no hay datos.</p>';
    const max = Math.max(1, ...grupos.map(g => g.partes.reduce((a, b) => a + b, 0)));
    const n = grupos.length;
    const ancho = (W - L - R) / n;
    const bw = Math.min(36, ancho * 0.7);
    const y = v => T + (H - T - B) * (1 - v / max);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
    [0, Math.round(max / 2), max].forEach(t => {
      s += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" />`;
      s += `<text x="${L - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`;
    });
    grupos.forEach((g, i) => {
      const cx = L + ancho * i + ancho / 2;
      let acc = 0;
      g.partes.forEach((v, k) => {
        if (!v) return;
        const y1 = y(acc + v), y0 = y(acc);
        s += `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - 1.5)}" rx="4" fill="${colores[k]}"><title>${esc(g.x)}: ${v}</title></rect>`;
        acc += v;
      });
    });
    const paso = Math.ceil(n / 10);
    grupos.forEach((g, i) => { if (i % paso === 0 || i === n - 1) s += `<text x="${L + ancho * i + ancho / 2}" y="${H - 6}" text-anchor="middle">${esc(g.x)}</text>`; });
    return s + '</svg>';
  },

  /** Histograma de notas por tramos. */
  histograma(valores, escala, aprobatoria) {
    const tramos = [];
    const paso = escala / 5;
    for (let i = 0; i < 5; i++) tramos.push({ x: Math.round(i * paso) + '–' + Math.round((i + 1) * paso), n: 0, desde: i * paso });
    valores.forEach(v => { tramos[Math.min(4, Math.floor(v / paso))].n++; });
    // Tramos bajo la nota aprobatoria en rojo, el resto en verde
    return Charts.apiladas(tramos.map(t => ({ x: t.x, partes: t.desde + paso <= aprobatoria ? [t.n, 0] : [0, t.n] })),
      ['var(--neg-line)', 'var(--pos-line)'], { alto: 150 });
  }
};
