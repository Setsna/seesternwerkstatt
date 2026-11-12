/* Seesternwerkstatt: kleine Code-Grafiken für die Stationskarten.
   Exakte Formen, deshalb Code statt Canva. Die Spiegel- und Musterbilder werden
   mit SW.geometrie berechnet, nicht von Hand gezeichnet. Alle Motive sind Schmuck (aria-hidden),
   der Name der Station steht als Text daneben. */
(() => {
  'use strict';
  const G = SW.geometrie;
  const pts = poly => poly.map(p => `${p.x},${p.y}`).join(' ');

  /* Muster, damit Formen nicht nur über Farbe unterscheidbar sind */
  const MUSTER = v => `<defs>
    <pattern id="${v}-streifen" width="0.6" height="0.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="0.6" height="0.6" fill="none"/><line x1="0" y1="0" x2="0" y2="0.6" stroke="#0b3155" stroke-opacity=".35" stroke-width=".18"/></pattern>
    <pattern id="${v}-punkte" width="0.8" height="0.8" patternUnits="userSpaceOnUse"><circle cx="0.4" cy="0.4" r="0.12" fill="#0b3155" fill-opacity=".38"/></pattern>
  </defs>`;

  /* Tangram: das Quadrat aus sieben Teilen (Seitenlänge 8) */
  const P = (x, y) => ({ x, y });
  const TANGRAM = [
    { poly: [P(0, 0), P(8, 0), P(4, 4)], farbe: 1 },               /* großes Dreieck */
    { poly: [P(0, 0), P(4, 4), P(0, 8)], farbe: 2, muster: 'streifen' }, /* großes Dreieck */
    { poly: [P(4, 8), P(8, 8), P(8, 4)], farbe: 3 },               /* mittleres Dreieck */
    { poly: [P(8, 0), P(8, 4), P(6, 6), P(6, 2)], farbe: 4, muster: 'punkte' }, /* Parallelogramm */
    { poly: [P(4, 4), P(6, 2), P(6, 6)], farbe: 5 },               /* kleines Dreieck */
    { poly: [P(4, 4), P(6, 6), P(4, 8), P(2, 6)], farbe: 6, muster: 'streifen' }, /* Quadrat */
    { poly: [P(2, 6), P(4, 8), P(0, 8)], farbe: 7, muster: 'punkte' } /* kleines Dreieck */
  ];
  function tangram() {
    const teile = TANGRAM.map(t => {
      const p = pts(t.poly);
      return `<polygon points="${p}" style="fill:var(--form-${t.farbe})"/>` +
        (t.muster ? `<polygon points="${p}" fill="url(#t-${t.muster})"/>` : '') +
        `<polygon points="${p}" fill="none" style="stroke:var(--form-rand)" stroke-width=".12" stroke-linejoin="round"/>`;
    }).join('');
    return `<svg viewBox="-0.3 -0.3 8.6 8.6" aria-hidden="true" focusable="false">${MUSTER('t')}${teile}</svg>`;
  }

  /* Raster mit n × m Feldern */
  function raster(b, h) {
    let l = '';
    for (let x = 0; x <= b; x++) l += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
    for (let y = 0; y <= h; y++) l += `<line x1="0" y1="${y}" x2="${b}" y2="${y}"/>`;
    return `<g style="stroke:var(--raster)" stroke-width=".05">${l}</g>`;
  }
  const feld = (f, stil) => `<rect x="${f.s}" y="${f.z}" width="1" height="1" ${stil}/>`;

  /* Spiegeln: Figur links, Spiegelachse, Spiegelbild rechts (berechnet) */
  function spiegeln() {
    const figur = [{ s: 1, z: 1 }, { s: 2, z: 1 }, { s: 2, z: 2 }, { s: 1, z: 3 }, { s: 2, z: 3 }, { s: 2, z: 4 }];
    const bild = G.felderSpiegeln(figur, G.achseSenkrecht(3));
    return `<svg viewBox="-0.2 -0.2 6.4 6.4" aria-hidden="true" focusable="false">${MUSTER('s')}${raster(6, 6)}
      ${figur.map(f => feld(f, 'style="fill:var(--form-2)"')).join('')}
      ${bild.map(f => feld(f, 'style="fill:var(--form-2)" fill-opacity=".45"')).join('')}
      ${bild.map(f => feld(f, 'fill="url(#s-punkte)"')).join('')}
      <line x1="3" y1="-0.1" x2="3" y2="6.1" style="stroke:var(--achse)" stroke-width=".12" stroke-dasharray=".35 .2" stroke-linecap="round"/>
    </svg>`;
  }

  /* Bandornament: ein Baustein, dreimal verschoben, der vierte nur angedeutet */
  function band() {
    const baustein = [{ s: 0, z: 2 }, { s: 1, z: 1 }, { s: 1, z: 2 }, { s: 0, z: 0 }];
    const breite = 2, wdh = 4;
    let felder = '';
    for (let i = 0; i < wdh; i++) {
      const teil = baustein.map(f => G.feldVerschieben(f, i * breite, 0));
      const offen = i === wdh - 1;
      felder += teil.map(f => feld(f, offen
        ? 'fill="none" style="stroke:var(--form-3)" stroke-width=".1" stroke-dasharray=".25 .15"'
        : 'style="fill:var(--form-3)"')).join('');
    }
    return `<svg viewBox="-0.2 -2.7 8.4 8.4" aria-hidden="true" focusable="false">${raster(8, 3)}${felder}</svg>`;
  }

  SW.motive = { tangram, spiegeln, band };
})();
