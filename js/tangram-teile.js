/* Seesternwerkstatt: die sieben Tangram-Teile als reine Geometrie (ohne Darstellung).
   Getestet in tools/tangram-test.html.

   Einheit: Das kleine Dreieck hat Schenkel der Länge 1. Dann gilt:
     großes Dreieck  Fläche 2 (2×)     mittleres Dreieck  Fläche 1
     kleines Dreieck Fläche 1/2 (2×)   Quadrat            Fläche 1
     Parallelogramm  Fläche 1          zusammen           Fläche 8 = Quadrat mit Seite 2·√2
   Jedes Teil ist um seinen Schwerpunkt zentriert, damit es sich „auf der Stelle“ dreht.

   Lage eines Teils: { x, y, dreh, gewendet }
     x, y      Lage des Schwerpunkts
     dreh      Drehung in 45°-Schritten (ganze Zahl, darf wachsen; nur dreh mod 8 zählt)
     gewendet  true = an der senkrechten Achse durch den Schwerpunkt gespiegelt
   Reihenfolge wie in CSS: erst wenden, dann drehen, dann verschieben. */
(() => {
  'use strict';
  const G = SW.geometrie;
  const P = (x, y) => ({ x, y });

  /* Rohformen mit ganzzahligen Ecken; werden unten auf den Schwerpunkt zentriert */
  const ROH = {
    gross:  [P(0, 0), P(2, 0), P(0, 2)],
    mittel: [P(0, 0), P(2, 0), P(1, 1)],
    klein:  [P(0, 0), P(1, 0), P(0, 1)],
    quadrat: [P(0, 0), P(1, 0), P(1, 1), P(0, 1)],
    parallelogramm: [P(0, 0), P(1, 0), P(2, 1), P(1, 1)]
  };

  /* Schwerpunkt einer Fläche (nicht Mittel der Ecken) */
  function schwerpunkt(poly) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const k = p.x * q.y - q.x * p.y;
      a += k; cx += (p.x + q.x) * k; cy += (p.y + q.y) * k;
    }
    a /= 2;
    return P(cx / (6 * a), cy / (6 * a));
  }
  const zentriert = poly => { const s = schwerpunkt(poly); return poly.map(p => G.punkt(p.x - s.x, p.y - s.y)); };

  /* Die sieben Teile. farbe = Nummer der Formfarbe (--form-N), muster für Farbschwäche. */
  const TEILE = [
    { id: 'g1', art: 'gross',          name: 'Großes Dreieck',    farbe: 1, muster: null },
    { id: 'g2', art: 'gross',          name: 'Großes Dreieck',    farbe: 2, muster: 'streifen' },
    { id: 'm',  art: 'mittel',         name: 'Mittleres Dreieck', farbe: 3, muster: null },
    { id: 'k1', art: 'klein',          name: 'Kleines Dreieck',   farbe: 5, muster: null },
    { id: 'k2', art: 'klein',          name: 'Kleines Dreieck',   farbe: 7, muster: 'punkte' },
    { id: 'q',  art: 'quadrat',        name: 'Quadrat',           farbe: 6, muster: 'streifen' },
    { id: 'p',  art: 'parallelogramm', name: 'Parallelogramm',    farbe: 4, muster: 'punkte' }
  ].map(t => ({ ...t, form: zentriert(ROH[t.art]) }));

  const teil = id => TEILE.find(t => t.id === id);

  /* Ecken eines Teils in seiner Lage (auf der Spielfläche) */
  function ecken(t, lage) {
    const achse = G.achseSenkrecht(0);
    return t.form.map(p => {
      let q = lage.gewendet ? G.spiegeln(p, achse) : p;
      q = G.drehen(q, 45 * lage.dreh);
      return G.verschieben(q, lage.x, lage.y);
    });
  }

  /* Neue Lagen für die Tasten. Wenden spiegelt auf dem Bildschirm an der senkrechten Achse
     durch den Schwerpunkt: aus „drehen nach wenden“ wird dann „Gegendrehung“. */
  const gedreht = (lage, schritte) => ({ ...lage, dreh: lage.dreh + schritte });
  const gewendet = lage => ({ ...lage, gewendet: !lage.gewendet, dreh: -lage.dreh });

  /* Halbe Ausdehnung des Teils in x und y (für Ränder der Spielfläche) */
  function ausdehnung(t, lage) {
    const e = ecken(t, { ...lage, x: 0, y: 0 });
    return { x: Math.max(...e.map(p => Math.abs(p.x))), y: Math.max(...e.map(p => Math.abs(p.y))) };
  }

  SW.tangramTeile = { ROH, TEILE, teil, ecken, gedreht, gewendet, ausdehnung, schwerpunkt };
})();
