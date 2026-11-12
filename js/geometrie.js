/* Seesternwerkstatt: Geometrie-Grundfunktionen.
   Alles hier wird berechnet und in tools/geometrie-test.html automatisch geprüft.
   Darstellung (SVG) kommt erst danach und nutzt nur diese Funktionen.

   Koordinaten wie im SVG: x nach rechts, y nach UNTEN.
   Winkel in Grad. drehen(p, +90) dreht auf dem Bildschirm im Uhrzeigersinn
   (das ist die übliche Drehmatrix, wirkt aber wegen y nach unten so herum).

   Punkt:    { x, y }
   Polygon:  Array von Punkten (Ecken der Reihe nach, ohne Wiederholung des ersten Punkts)
   Achse:    { a: Punkt, b: Punkt }  (Gerade durch a und b, a ≠ b)
   Feld:     { s, z }  Rasterfeld in Spalte s, Zeile z, belegt das Quadrat [s, s+1] × [z, z+1] */
(() => {
  'use strict';
  const EPS = (window.SW && SW.config && SW.config.eps) || 1e-9;

  /* Zahlen glätten: Rechenrauschen unter 1e-12 entfernen, -0 zu 0. */
  const glatt = v => {
    const r = Math.round(v * 1e12) / 1e12;
    return Object.is(r, -0) ? 0 : r;
  };
  const punkt = (x, y) => ({ x: glatt(x), y: glatt(y) });
  const nah = (u, v, eps = EPS) => Math.abs(u - v) <= eps;
  const gleich = (p, q, eps = EPS) => nah(p.x, q.x, eps) && nah(p.y, q.y, eps);
  const abstand = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

  /* ---------- Verschieben ---------- */
  const verschieben = (p, dx, dy) => punkt(p.x + dx, p.y + dy);

  /* ---------- Drehen ---------- */
  /* cos und sin exakt für Vielfache von 45°, sonst normal gerechnet. */
  const R = Math.SQRT1_2;
  const TAB45 = [[1, 0], [R, R], [0, 1], [-R, R], [-1, 0], [-R, -R], [0, -1], [R, -R]];
  function cosSin(grad) {
    const g = ((grad % 360) + 360) % 360;
    if (nah(g / 45, Math.round(g / 45), 1e-12)) return TAB45[Math.round(g / 45) % 8];
    const r = g * Math.PI / 180;
    return [Math.cos(r), Math.sin(r)];
  }
  function drehen(p, grad, zentrum = { x: 0, y: 0 }) {
    const [c, s] = cosSin(grad);
    const dx = p.x - zentrum.x, dy = p.y - zentrum.y;
    return punkt(zentrum.x + c * dx - s * dy, zentrum.y + s * dx + c * dy);
  }

  /* ---------- Spiegeln ---------- */
  const achse = (a, b) => {
    if (gleich(a, b)) throw new Error('Achse braucht zwei verschiedene Punkte');
    return { a, b };
  };
  const achseSenkrecht = x => achse({ x, y: 0 }, { x, y: 1 });   /* Linie x = konstant */
  const achseWaagerecht = y => achse({ x: 0, y }, { x: 1, y });  /* Linie y = konstant */

  function spiegeln(p, ach) {
    const { a, b } = ach;
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const fx = a.x + t * dx, fy = a.y + t * dy;   /* Fußpunkt auf der Achse */
    return punkt(2 * fx - p.x, 2 * fy - p.y);
  }
  /* Abstand eines Punkts von der Achse (ohne Vorzeichen) */
  function abstandZurAchse(p, ach) {
    const { a, b } = ach;
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / Math.hypot(dx, dy);
  }
  /* Schnittpunkt zweier Achsen, null wenn parallel */
  function schnittpunkt(g, h) {
    const d1x = g.b.x - g.a.x, d1y = g.b.y - g.a.y, d2x = h.b.x - h.a.x, d2y = h.b.y - h.a.y;
    const n = d1x * d2y - d1y * d2x;
    if (nah(n, 0)) return null;
    const t = ((h.a.x - g.a.x) * d2y - (h.a.y - g.a.y) * d2x) / n;
    return punkt(g.a.x + t * d1x, g.a.y + t * d1y);
  }
  /* Richtungswinkel einer Achse in Grad (0 bis unter 180) */
  function achsenWinkel(ach) {
    const w = Math.atan2(ach.b.y - ach.a.y, ach.b.x - ach.a.x) * 180 / Math.PI;
    return ((w % 180) + 180) % 180;
  }

  /* ---------- Polygone ---------- */
  const abbilden = (poly, f) => poly.map(f);
  /* Fläche mit Vorzeichen (Gaußsche Trapezformel). Vorzeichen = Umlaufsinn. */
  function flaecheMitVorzeichen(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      s += p.x * q.y - q.x * p.y;
    }
    return s / 2;
  }
  const flaeche = poly => Math.abs(flaecheMitVorzeichen(poly));
  const umlaufsinn = poly => Math.sign(glatt(flaecheMitVorzeichen(poly)));

  /* Gleiche Figur an gleicher Stelle: gleiche Ecken in gleicher Reihenfolge,
     Startecke und Richtung egal. */
  function polygonGleich(p, q, eps = EPS) {
    const n = p.length;
    if (n !== q.length) return false;
    for (let k = 0; k < n; k++) for (const dir of [1, -1]) {
      let ok = true;
      for (let i = 0; i < n && ok; i++) ok = gleich(p[i], q[((k + dir * i) % n + n) % n], eps);
      if (ok) return true;
    }
    return false;
  }

  /* Deckungsgleich: q entsteht aus p durch Verschieben und Drehen (gespiegelt: false)
     oder zusätzlich Spiegeln (gespiegelt: true). Ohne Verkleinern oder Vergrößern.
     Rechnet mit komplexen Zahlen: z' = w·z + t bzw. w·conj(z) + t mit |w| = 1.
     Rückgabe: { gleich: true/false, gespiegelt: true/false/null } */
  function deckungsgleich(p, q, eps = 1e-7) {
    const n = p.length;
    if (n !== q.length || n < 2) return { gleich: false, gespiegelt: null };
    const mul = (a, b) => ({ x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x });
    const div = (a, b) => { const d = b.x * b.x + b.y * b.y; return { x: (a.x * b.x + a.y * b.y) / d, y: (a.y * b.x - a.x * b.y) / d }; };
    const konj = a => ({ x: a.x, y: -a.y });
    const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
    const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
    let gefundenOhne = false, gefundenMit = false;
    for (const spiegel of [false, true]) {
      const P = spiegel ? p.map(konj) : p;
      const d = sub(P[1], P[0]);
      if (nah(Math.hypot(d.x, d.y), 0)) return { gleich: false, gespiegelt: null };
      for (let k = 0; k < n; k++) for (const dir of [1, -1]) {
        const j = i => ((k + dir * i) % n + n) % n;
        const w = div(sub(q[j(1)], q[j(0)]), d);
        if (!nah(Math.hypot(w.x, w.y), 1, eps)) continue;
        const t = sub(q[j(0)], mul(w, P[0]));
        let ok = true;
        for (let i = 0; i < n && ok; i++) ok = gleich(add(mul(w, P[i]), t), q[j(i)], eps);
        if (ok) { if (spiegel) gefundenMit = true; else gefundenOhne = true; }
      }
    }
    if (gefundenOhne) return { gleich: true, gespiegelt: false };
    if (gefundenMit) return { gleich: true, gespiegelt: true };
    return { gleich: false, gespiegelt: null };
  }

  /* ---------- Rasterfelder (Spiegeln am Karopapier, Bandornamente) ---------- */
  /* Spiegelt ein Feld über seinen Mittelpunkt. null, wenn das Ergebnis kein ganzes Feld ist
     (Achse liegt nicht passend zum Raster). */
  function feldSpiegeln(f, ach) {
    const m = spiegeln({ x: f.s + 0.5, y: f.z + 0.5 }, ach);
    const s = m.x - 0.5, z = m.y - 0.5;
    if (!nah(s, Math.round(s), 1e-9) || !nah(z, Math.round(z), 1e-9)) return null;
    return { s: glatt(Math.round(s)), z: glatt(Math.round(z)) };
  }
  const feldVerschieben = (f, ds, dz) => ({ s: f.s + ds, z: f.z + dz });
  /* Mehrere Felder auf einmal. Liefert null, wenn eines nicht aufs Raster fällt. */
  function felderSpiegeln(felder, ach) {
    const r = felder.map(f => feldSpiegeln(f, ach));
    return r.some(x => x === null) ? null : r;
  }
  const feldSchluessel = f => `${f.s},${f.z}`;
  /* Gleiche Feldmengen (Reihenfolge egal, doppelte zählen einmal) */
  function felderGleich(a, b) {
    const A = new Set(a.map(feldSchluessel)), B = new Set(b.map(feldSchluessel));
    if (A.size !== B.size) return false;
    for (const k of A) if (!B.has(k)) return false;
    return true;
  }

  SW.geometrie = {
    EPS, glatt, punkt, nah, gleich, abstand,
    verschieben, drehen,
    achse, achseSenkrecht, achseWaagerecht, spiegeln, abstandZurAchse, schnittpunkt, achsenWinkel,
    abbilden, flaeche, flaecheMitVorzeichen, umlaufsinn, polygonGleich, deckungsgleich,
    feldSpiegeln, feldVerschieben, felderSpiegeln, feldSchluessel, felderGleich
  };
})();
