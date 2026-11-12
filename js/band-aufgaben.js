/* Seesternwerkstatt: Station Bandornamente, Aufgaben erzeugen und prüfen (Etappe 4a). Reine Rechnung.
   Getestet in tools/band-test.html.

   Aufgabe: { art: 'band', stufe, b: 14, h: 4, vorlage: L, vorgabe: Bild }
     Die ersten L Spalten sind die Vorlage (gesperrt), darin steht der Baustein genau zweimal.
     Das Kind setzt das Muster bis zum Ende des Streifens fort.
   Die Lösung wird berechnet: kleinste Wiederholungslänge p der Vorlage, dann Spalte s = Spalte (s mod p).
   Bild wie in js/spiegeln-raster.js: "s,z" → Farbe 1..3.

   Eindeutig heißt hier: Die kleinste Wiederholungslänge p ist genau L/2. Damit ist der Baustein zweimal
   ganz zu sehen, und jede Wiederholungslänge, die zweimal ganz in die Vorlage passt, ist p selbst.
   Außerdem bleibt mindestens ein ganzer Baustein zum Fortsetzen.

   Stufen:
     leicht  Baustein 2 oder 3 Spalten, 1 oder 2 Farben, nur verschoben.
     mittel  Baustein 3 oder 4 Spalten, 2 oder 3 Farben. Bei 4 Spalten auch mit Spiegelbild darin:
             „spiegelS“ = Hälfte und ihr Spiegelbild (senkrechte Achse),
             „spiegelW“ = Hälfte und dieselbe Hälfte auf den Kopf gestellt (waagerechte Achse).
   Der Baustein reicht über mindestens 3 der 4 Zeilen, höchstens eine Spalte ist leer.
   Schutz: keine Windrad-Form (dreht sich mit, ohne Spiegelachse) in irgendeinem Teil des fertigen Bandes.

   Parkett (knifflig, Etappe 4b): { art: 'parkett', stufe: 'knifflig', b: 9, h: 9, vorlageB, vorlageH, vorgabe }
     Oben links steht die Vorlage: der Baustein (kb × kh, 2 oder 3 Kästchen) zweimal nach rechts und zweimal
     nach unten, also 2kb × 2kh. Das Kind setzt nach rechts und nach unten fort, bis das Raster voll ist.
     Lösung: Kästchen (s, z) = Vorlage (s mod kb, z mod kh), kb und kh = kleinste Wiederholung der Vorlage.
     Eindeutig: kleinste Wiederholung nach rechts genau vorlageB/2, nach unten genau vorlageH/2, und die Vorlage
     wiederholt sich bei keiner anderen (schrägen) Verschiebung. Sonst könnte man das Muster anders weiterlesen.
     Nach rechts und nach unten bleibt mindestens ein ganzer Baustein zum Fortsetzen. */
(() => {
  'use strict';
  const R = SW.spiegelRaster, { key, feldAus } = R;
  const B = 14, H = 4;
  const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  /* ---------- Zufall mit Startwert (wie bei Spiegeln) ---------- */
  const zufall = saat => SW.spiegelAufgaben.zufall(saat);

  /* ---------- Spalten und Wiederholung ---------- */
  const spalte = (bild, s, h = H) => { let t = ''; for (let z = 0; z < h; z++) t += bild[`${s},${z}`] || 0; return t; };
  /* Kleinste Wiederholungslänge der ersten L Spalten */
  function periode(bild, L, h = H) {
    const sp = []; for (let s = 0; s < L; s++) sp.push(spalte(bild, s, h));
    for (let p = 1; p <= L; p++) if (sp.every((x, i) => i + p >= L || x === sp[i + p])) return p;
    return L;
  }
  /* ---------- Parkett: Wiederholung in zwei Richtungen ---------- */
  const zelle = (bild, s, z) => bild[`${s},${z}`] || 0;
  /* Wiederholt sich der Block W × H bei Verschiebung um (dx, dy)? (nur wo beide Kästchen im Block liegen) */
  function wiederholt(bild, W, Hh, dx, dy) {
    for (let s = 0; s < W; s++) for (let z = 0; z < Hh; z++) {
      const s2 = s + dx, z2 = z + dy;
      if (s2 < 0 || z2 < 0 || s2 >= W || z2 >= Hh) continue;
      if (zelle(bild, s, z) !== zelle(bild, s2, z2)) return false;
    }
    return true;
  }
  function perioden(bild, W, Hh) {
    let px = W, py = Hh;
    for (let d = 1; d <= W; d++) if (wiederholt(bild, W, Hh, d, 0)) { px = d; break; }
    for (let d = 1; d <= Hh; d++) if (wiederholt(bild, W, Hh, 0, d)) { py = d; break; }
    return { px, py };
  }
  /* Schräge Verschiebungen, bei denen sich die Vorlage auch wiederholt (dürfen nicht vorkommen) */
  function schraegeWiederholungen(bild, W, Hh, px, py) {
    const out = [];
    for (let dx = 0; dx <= px; dx++) for (let dy = -py; dy <= py; dy++) {
      if (!dx && !dy) continue;
      if (dx % px === 0 && dy % py === 0) continue;
      if (wiederholt(bild, W, Hh, dx, dy)) out.push([dx, dy]);
    }
    return out;
  }

  /* Lösung: das ganze Band bzw. Parkett (Vorlage eingeschlossen) */
  function loesung(a) {
    if (a.art === 'parkett') {
      const { px, py } = perioden(a.vorgabe, a.vorlageB, a.vorlageH), out = {};
      for (let s = 0; s < a.b; s++) for (let z = 0; z < a.h; z++) { const f = zelle(a.vorgabe, s % px, z % py); if (f) out[`${s},${z}`] = f; }
      return out;
    }
    const p = periode(a.vorgabe, a.vorlage, a.h), out = {};
    for (let s = 0; s < a.b; s++) for (let z = 0; z < a.h; z++) {
      const f = a.vorgabe[`${s % p},${z}`];
      if (f) out[`${s},${z}`] = f;
    }
    return out;
  }
  const imVorlagebereich = (a, k) => { const f = feldAus(k); return a.art === 'parkett' ? f.s < a.vorlageB && f.z < a.vorlageH : f.s < a.vorlage; };
  /* Wie R.pruefen: gemalt = nur die Kästchen des Kindes */
  function pruefen(a, gemalt) {
    const l = loesung(a), fehlt = [], zuviel = [], falscheFarbe = [];
    for (const [k, f] of Object.entries(l)) {
      if (imVorlagebereich(a, k)) continue;
      if (gemalt[k] === undefined) fehlt.push(k); else if (gemalt[k] !== f) falscheFarbe.push(k);
    }
    for (const k of Object.keys(gemalt)) if (imVorlagebereich(a, k) || l[k] === undefined) zuviel.push(k);
    return { ok: !fehlt.length && !zuviel.length && !falscheFarbe.length, fehlt, zuviel, falscheFarbe };
  }
  /* Brauchbar? Liste der Gründe (leer = gut) */
  function aufgabePruefen(a) {
    const g = [];
    const ks = Object.keys(a.vorgabe);
    if (!ks.length) g.push('Vorlage leer');
    if (a.art === 'parkett') {
      if (ks.some(k => !imVorlagebereich(a, k) || feldAus(k).s < 0 || feldAus(k).z < 0)) g.push('Vorgabe außerhalb der Vorlage');
      const { px, py } = perioden(a.vorgabe, a.vorlageB, a.vorlageH);
      if (2 * px !== a.vorlageB || 2 * py !== a.vorlageH) g.push(`Baustein nicht genau zweimal in jede Richtung (${px} × ${py})`);
      if (a.b - a.vorlageB < px || a.h - a.vorlageH < py) g.push('weniger als ein ganzer Baustein zum Fortsetzen');
      if (schraegeWiederholungen(a.vorgabe, a.vorlageB, a.vorlageH, px, py).length) g.push('Vorlage wiederholt sich auch schräg');
      return g;
    }
    if (ks.some(k => { const f = feldAus(k); return f.s < 0 || f.z < 0 || f.s >= a.vorlage || f.z >= a.h; })) g.push('Vorgabe außerhalb der Vorlage');
    const p = periode(a.vorgabe, a.vorlage, a.h);
    if (p * 2 !== a.vorlage) g.push(`Baustein nicht genau zweimal zu sehen (p = ${p}, Vorlage ${a.vorlage})`);
    if (a.b - a.vorlage < p) g.push('weniger als ein ganzer Baustein zum Fortsetzen');
    return g;
  }

  /* ---------- Bausteine bauen ---------- */
  function wachsen(zf, b, h, n) {
    const erlaubt = new Set(); for (let s = 0; s < b; s++) for (let z = 0; z < h; z++) erlaubt.add(`${s},${z}`);
    const start = `${zf.zz(0, b - 1)},${zf.zz(0, h - 1)}`, drin = new Set([start]), rand = [];
    const dazu = k => { const f = feldAus(k); for (const [ds, dz] of NACHBARN) { const x = key({ s: f.s + ds, z: f.z + dz }); if (erlaubt.has(x) && !drin.has(x) && !rand.includes(x)) rand.push(x); } };
    dazu(start);
    while (drin.size < n && rand.length) { const k = rand.splice(zf.zz(0, rand.length - 1), 1)[0]; drin.add(k); dazu(k); }
    return drin.size === n ? [...drin] : null;
  }
  /* Färbt in zusammenhängenden Gruppen */
  function faerben(zf, zellen, anzahl) {
    const farben = zf.mischen([1, 2, 3]).slice(0, anzahl), bild = {};
    if (anzahl === 1) { zellen.forEach(k => { bild[k] = farben[0]; }); return bild; }
    const menge = new Set(zellen);
    let rand = zf.mischen(zellen).slice(0, anzahl);
    rand.forEach((k, i) => { bild[k] = farben[i]; });
    while (rand.length) {
      const neu = [];
      for (const k of rand) { const f = feldAus(k); for (const [ds, dz] of NACHBARN) { const x = key({ s: f.s + ds, z: f.z + dz }); if (menge.has(x) && bild[x] === undefined) { bild[x] = bild[k]; neu.push(x); } } }
      rand = neu;
    }
    return bild;
  }
  const farbZahl = bild => new Set(Object.values(bild)).size;
  /* Windrad: deckt sich nach Vierteldrehung, hat aber keine Spiegelachse */
  function windrad(bild) {
    const l = R.lagen(bild);
    return R.gleich(l[0], l[2]) && !R.achsenDurchMitte(bild).some(a => R.istAchse(bild, a));
  }
  /* Teile eines Bildes, die über Kästchenseiten zusammenhängen (Farbe egal) */
  function teile(bild) {
    const offen = new Set(Object.keys(bild)), out = [];
    while (offen.size) {
      const start = offen.values().next().value, t = {}, stapel = [start];
      offen.delete(start);
      while (stapel.length) {
        const k = stapel.pop(); t[k] = bild[k];
        const f = feldAus(k);
        for (const [ds, dz] of NACHBARN) { const x = key({ s: f.s + ds, z: f.z + dz }); if (offen.has(x)) { offen.delete(x); stapel.push(x); } }
      }
      out.push(t);
    }
    return out;
  }

  const FORMEN = {
    leicht: [['schieben2', 1], ['schieben3', 2]],
    mittel: [['schieben3', 2], ['schieben4', 2], ['spiegelS', 1], ['spiegelW', 1]]
  };
  function baustein(zf, form, stufe) {
    const farben = stufe === 'leicht' ? zf.gewichtet([[1, 2], [2, 1]]) : zf.gewichtet([[2, 3], [3, 2]]);
    if (form.startsWith('schieben')) {
      const p = Number(form.slice(-1)), n = zf.zz(Math.ceil(p * H * 0.35), Math.floor(p * H * 0.65));
      const z = wachsen(zf, p, H, n);
      return z ? { p, bild: faerben(zf, z, farben) } : null;
    }
    /* Hälfte 2 × 4, dann gespiegelt daneben */
    const z = wachsen(zf, 2, H, zf.zz(3, 5));
    if (!z) return null;
    const halb = faerben(zf, z, Math.min(farben, z.length)), bild = { ...halb };
    for (const [k, f] of Object.entries(halb)) {
      const { s, z: zz } = feldAus(k);
      bild[form === 'spiegelS' ? `${3 - s},${zz}` : `${s + 2},${H - 1 - zz}`] = f;
    }
    return { p: 4, bild };
  }

  /* Letzte Prüfung, unabhängig davon, wie die Aufgabe entstanden ist */
  function brauchbar(a, stufe) {
    if (aufgabePruefen(a).length) return false;
    const l = loesung(a), fz = farbZahl(a.vorgabe);
    if (stufe === 'leicht' ? fz > 2 : fz < 2 || fz > 3) return false;
    if (teile(l).some(windrad)) return false;
    /* Baustein hat höchstens eine leere Spalte (sonst zerfällt das Band in Einzelstücke) */
    const p = a.vorlage / 2;
    let leer = 0; for (let s = 0; s < p; s++) if (!/[1-3]/.test(spalte(a.vorgabe, s, a.h))) leer++;
    if (leer > 1) return false;
    /* Baustein reicht über mindestens 3 der 4 Zeilen (sonst wirkt das Band wie ein halber Streifen) */
    return R.rahmen(a.vorgabe).h >= 3;
  }
  /* Parkett: Baustein kb × kh (2 oder 3), eine Figur in 2 bis 3 Farben, der Rest bleibt weiß */
  function parkettVersuch(zf) {
    const kb = zf.gewichtet([[2, 1], [3, 2]]), kh = zf.gewichtet([[2, 1], [3, 2]]), n = zf.zz(Math.ceil(kb * kh * 0.45), kb * kh);   /* auch ganz gefüllt (ohne Weiß) */
    const z = wachsen(zf, kb, kh, n);
    if (!z) return null;
    const bs = faerben(zf, z, zf.gewichtet([[2, 3], [3, 1]]));
    const vorgabe = {};
    for (const [k, f] of Object.entries(bs)) {
      const { s, z: zz } = feldAus(k);
      for (const ds of [0, kb]) for (const dz of [0, kh]) vorgabe[`${s + ds},${zz + dz}`] = f;
    }
    return { art: 'parkett', stufe: 'knifflig', form: `${kb}x${kh}`, b: 9, h: 9, vorlageB: 2 * kb, vorlageH: 2 * kh, vorgabe };
  }
  function parkettBrauchbar(a) {
    if (aufgabePruefen(a).length) return false;
    if (farbZahl(a.vorgabe) < 2) return false;
    return !teile(loesung(a)).some(windrad);
  }

  const statistik = { aufgaben: 0, versuche: 0, meiste: 0 };
  function eine(stufe, saat) {
    const zf = zufall(saat);
    if (stufe === 'knifflig') {
      for (let versuch = 1; versuch <= 600; versuch++) {
        const a = parkettVersuch(zf);
        if (a && parkettBrauchbar(a)) { statistik.aufgaben++; statistik.versuche += versuch; statistik.meiste = Math.max(statistik.meiste, versuch); return a; }
      }
      throw new Error('Keine brauchbare Aufgabe: parkett');
    }
    if (!FORMEN[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    for (let versuch = 1; versuch <= 600; versuch++) {
      const form = zf.gewichtet(FORMEN[stufe]), bs = baustein(zf, form, stufe);
      if (!bs) continue;
      const vorgabe = {};
      for (const [k, f] of Object.entries(bs.bild)) { const { s, z } = feldAus(k); vorgabe[`${s},${z}`] = f; vorgabe[`${s + bs.p},${z}`] = f; }
      const a = { art: 'band', stufe, form, b: B, h: H, vorlage: 2 * bs.p, vorgabe };
      if (brauchbar(a, stufe)) {
        statistik.aufgaben++; statistik.versuche += versuch; statistik.meiste = Math.max(statistik.meiste, versuch);
        return a;
      }
    }
    throw new Error('Keine brauchbare Aufgabe: band ' + stufe);
  }

  /* ---------- Runde: sechs Aufgaben ----------
     leicht: 6 Bänder leicht. mittel: 6 Bänder mittel.
     knifflig: erst 3 Bänder mittel, dann 3 Parkette (gleiche Arten hintereinander), weil ein Parkett viel Malarbeit ist.
     Gleicher Startwert = gleiche Runde. Keine Aufgabe kommt in einer Runde doppelt vor. */
  const RUNDE = { leicht: Array(6).fill('leicht'), mittel: Array(6).fill('mittel'), knifflig: ['mittel', 'mittel', 'mittel', 'knifflig', 'knifflig', 'knifflig'] };   /* erst Bänder, dann Parkette (gebündelt, Etappe 6b) */
  function runde(stufe, saat) {
    if (!RUNDE[stufe]) throw new Error('Unbekannte Stufe: ' + stufe);
    const gesehen = new Set(), aufgaben = [];
    let n = 0;
    for (const st of RUNDE[stufe]) {
      let a;
      do { a = eine(st, (Number(saat) * 1009 + n++) >>> 0 || 1); } while (gesehen.has(JSON.stringify(a.vorgabe)) && n < 500);
      gesehen.add(JSON.stringify(a.vorgabe));
      aufgaben.push(a);
    }
    return { stufe, saat, aufgaben };
  }

  SW.bandAufgaben = { B, H, eine, runde, RUNDE, periode, perioden, schraegeWiederholungen, imVorlagebereich, loesung, pruefen, aufgabePruefen, brauchbar, windrad, teile, spalte, FORMEN, statistik };
})();
