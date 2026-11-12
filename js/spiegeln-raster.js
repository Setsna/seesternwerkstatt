/* Seesternwerkstatt: Spiegeln am Kästchenraster, reine Rechnung (Etappe 3a/3b).
   Getestet in tools/spiegeln-test.html.

   Raster: b Spalten × h Zeilen, Feld { s, z } wie in js/geometrie.js (Spalte, Zeile ab 0).
   Ein Bild ist ein Objekt "s,z" → Farbnummer (1, 2, 3). Leere Felder fehlen.
   Achse (Einheit = Kästchenseite, y nach unten):
     { typ: 'senkrecht',  pos: x }     Linie x = pos (ganze oder halbe Zahl)
     { typ: 'waagerecht', pos: y }     Linie y = pos
     { typ: 'fallend',    pos: c }     Linie y = x + c   (von links oben nach rechts unten)
     { typ: 'steigend',   pos: c }     Linie y = −x + c  (von links unten nach rechts oben)
     { typ: 'frei', von: {x, y}, nach: {x, y} }   beliebige Linie durch zwei Punkte. Nur als angebotene
                                       Linie bei „Achsen finden“ (Diagonale eines Rechtecks von Ecke zu Ecke).

   Aufgaben (erzeugt in js/spiegeln-aufgaben.js). Die Lösung wird immer berechnet, nie gespeichert:
     Ergänzen     { art: 'ergaenzen', b, h, achsen: [Achse], vorgabe: Bild }
                  Eine Achse: Lösung = Vorgabe und ihr Spiegelbild. Zwei Achsen (Achsenkreuz,
                  „nacheinander spiegeln“): dazu das Bild an Achse 2 und das Bild an beiden Achsen.
     Achsen       { art: 'achsen', b, h, figur: Bild, kandidaten: [Achse] }
                  Welche der Linien sind Spiegelachsen der Figur? Auch „keine“ ist möglich.
     Faltschnitt  { art: 'faltschnitt', modus: 'waehlen' | 'zeichnen', b, h, achsen: [Faltlinie],
                    vorgabe: Bild (die Hälfte auf dem gefalteten Papier), optionen: [Bild] (nur 'waehlen') }
                  Aufgeklappt entsteht dieselbe Figur wie beim Ergänzen. */
(() => {
  'use strict';
  const G = SW.geometrie;
  const key = f => `${f.s},${f.z}`;
  const feldAus = k => { const [s, z] = k.split(',').map(Number); return { s, z }; };

  /* ---------- Bilder umformen und vergleichen ---------- */
  function rahmen(bild) {
    let s0 = Infinity, z0 = Infinity, s1 = -Infinity, z1 = -Infinity;
    for (const k of Object.keys(bild)) {
      const f = feldAus(k);
      if (f.s < s0) s0 = f.s;
      if (f.s > s1) s1 = f.s;
      if (f.z < z0) z0 = f.z;
      if (f.z > z1) z1 = f.z;
    }
    return { s0, z0, s1, z1, b: s1 - s0 + 1, h: z1 - z0 + 1 };
  }
  const abbilden = (bild, f) => { const out = {}; for (const [k, farbe] of Object.entries(bild)) out[key(f(feldAus(k)))] = farbe; return out; };
  const verschoben = (bild, ds, dz) => abbilden(bild, f => ({ s: f.s + ds, z: f.z + dz }));
  /* An den Rand geschoben (kleinste Spalte und Zeile = 0): gleiche Form → gleiches Bild */
  const normal = bild => { if (!Object.keys(bild).length) return {}; const r = rahmen(bild); return verschoben(bild, -r.s0, -r.z0); };
  /* Gleiche Felder mit gleichen Farben */
  function gleich(a, b) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => a[k] === b[k]);
  }
  /* Alle acht Lagen einer Figur (vier Drehungen, jeweils auch gewendet), an den Rand geschoben */
  function lagen(bild) {
    const out = [];
    let b = normal(bild);
    for (let i = 0; i < 4; i++) {
      out.push(b, normal(abbilden(b, f => ({ s: -f.s, z: f.z }))));
      b = normal(abbilden(b, f => ({ s: -f.z, z: f.s })));
    }
    return out;
  }
  /* Deckungsgleich: gleich nach Verschieben, Drehen oder Wenden (mit Farben) */
  const kongruent = (a, b) => { const nb = normal(b); return lagen(a).some(l => gleich(l, nb)); };
  /* Hängt die Figur über Kästchenseiten zusammen? auchUeberEck: Berührung an Ecken zählt mit. */
  function zusammenhaengend(bild, auchUeberEck = false) {
    const alle = Object.keys(bild);
    if (!alle.length) return false;
    const offen = new Set(alle), stapel = [alle[0]];
    offen.delete(alle[0]);
    while (stapel.length) {
      const f = feldAus(stapel.pop());
      for (let ds = -1; ds <= 1; ds++) for (let dz = -1; dz <= 1; dz++) {
        if ((!ds && !dz) || (!auchUeberEck && ds && dz)) continue;
        const k = key({ s: f.s + ds, z: f.z + dz });
        if (offen.has(k)) { offen.delete(k); stapel.push(k); }
      }
    }
    return offen.size === 0;
  }
  const imRaster = (bild, b, h) => Object.keys(bild).every(k => { const f = feldAus(k); return f.s >= 0 && f.z >= 0 && f.s < b && f.z < h; });

  /* ---------- Spiegeln ---------- */
  function alsGeometrie(a) {
    if (a.typ === 'senkrecht') return G.achseSenkrecht(a.pos);
    if (a.typ === 'waagerecht') return G.achseWaagerecht(a.pos);
    if (a.typ === 'fallend') return G.achse({ x: 0, y: a.pos }, { x: 1, y: a.pos + 1 });
    if (a.typ === 'steigend') return G.achse({ x: 0, y: a.pos }, { x: 1, y: a.pos - 1 });
    if (a.typ === 'frei') return G.achse(a.von, a.nach);
    throw new Error('unbekannte Achse ' + a.typ);
  }
  /* Bild an einer Achse spiegeln. null, wenn ein Feld nicht aufs Raster fällt. */
  function bildSpiegeln(bild, achse) {
    const g = alsGeometrie(achse), out = {};
    for (const [k, farbe] of Object.entries(bild)) {
      const f = G.feldSpiegeln(feldAus(k), g);
      if (!f) return null;
      out[key(f)] = farbe;
    }
    return out;
  }

  /* ---------- Ergänzen ---------- */
  /* Ganzes Bild der Lösung (Vorgabe eingeschlossen). Bei Widerspruch (zwei Farben auf einem Feld) null. */
  function loesung(aufgabe) {
    let teile = [aufgabe.vorgabe];
    for (const a of aufgabe.achsen) {
      const neu = [];
      for (const t of teile) { const s = bildSpiegeln(t, a); if (!s) return null; neu.push(s); }
      teile = teile.concat(neu);
    }
    const out = {};
    for (const t of teile) for (const [k, f] of Object.entries(t)) {
      if (out[k] !== undefined && out[k] !== f) return null;
      out[k] = f;
    }
    return out;
  }
  /* Prüft eine Aufgabe auf Brauchbarkeit. Gibt Liste von Gründen zurück (leer = gut). */
  function aufgabePruefen(aufgabe) {
    const gruende = [];
    if (!Object.keys(aufgabe.vorgabe).length) gruende.push('Vorgabe ist leer');
    if (!imRaster(aufgabe.vorgabe, aufgabe.b, aufgabe.h)) gruende.push('Vorgabe liegt nicht im Raster');
    const l = loesung(aufgabe);
    if (!l) { gruende.push('Spiegelbild fällt nicht aufs Raster oder widerspricht sich'); return gruende; }
    if (!imRaster(l, aufgabe.b, aufgabe.h)) gruende.push('Spiegelbild passt nicht ins Raster');
    if (Object.keys(l).length === Object.keys(aufgabe.vorgabe).length) gruende.push('nichts zu tun: Vorgabe ist schon symmetrisch');
    return gruende;
  }
  /* Vergleicht das Bild des Kindes mit der Lösung.
     gemalt: nur die Felder, die das Kind gemalt hat (ohne Vorgabe).
     Rückgabe: { ok, fehlt, zuviel, falscheFarbe } (Listen von Schlüsseln). */
  function pruefen(aufgabe, gemalt) {
    const l = loesung(aufgabe), v = aufgabe.vorgabe;
    const fehlt = [], zuviel = [], falscheFarbe = [];
    for (const [k, f] of Object.entries(l)) {
      if (v[k] !== undefined) continue;
      if (gemalt[k] === undefined) fehlt.push(k);
      else if (gemalt[k] !== f) falscheFarbe.push(k);
    }
    for (const k of Object.keys(gemalt)) if (l[k] === undefined) zuviel.push(k);
    return { ok: !fehlt.length && !zuviel.length && !falscheFarbe.length, fehlt, zuviel, falscheFarbe };
  }
  /* Ganze Figur frei gezeichnet (Faltschnitt zeichnen ohne Vorgabe im Raster): richtig, wenn sie der
     Lösung gleicht. Entlang der Faltlinie darf sie verschoben sein, quer dazu nicht (dann stimmt
     der Abstand zur Faltlinie nicht mehr). Zahlen statt Felder: Wo etwas fehlt, wird nicht verraten. */
  function pruefenGanz(aufgabe, gemalt) {
    const l = loesung(aufgabe), a = aufgabe.achsen[0];
    const entlang = a.typ === 'senkrecht' ? [0, 1] : a.typ === 'waagerecht' ? [1, 0] : null;
    const spanne = entlang ? Math.max(aufgabe.b, aufgabe.h) : 0;
    let best = null;
    for (let k = -spanne; k <= spanne; k++) {
      const ziel = entlang ? verschoben(l, entlang[0] * k, entlang[1] * k) : l;
      let fehlt = 0, zuviel = 0, falscheFarbe = 0;
      for (const [f, farbe] of Object.entries(ziel)) { if (gemalt[f] === undefined) fehlt++; else if (gemalt[f] !== farbe) falscheFarbe++; }
      for (const f of Object.keys(gemalt)) if (ziel[f] === undefined) zuviel++;
      const summe = fehlt + zuviel + falscheFarbe;
      if (!best || summe < best.summe || (summe === best.summe && Math.abs(k) < Math.abs(best.verschoben))) best = { summe, fehlt, zuviel, falscheFarbe, verschoben: k };
    }
    return { ok: best.summe === 0, fehlt: best.fehlt, zuviel: best.zuviel, falscheFarbe: best.falscheFarbe, verschoben: best.verschoben };
  }

  /* ---------- Achsen finden ---------- */
  const ACHSTYPEN = ['senkrecht', 'waagerecht', 'fallend', 'steigend'];
  /* Die beiden Diagonalen des umgebenden Rechtecks, von Ecke zu Ecke */
  function eckDiagonalen(bild) {
    const r = rahmen(bild);
    return [
      { typ: 'frei', von: { x: r.s0, y: r.z0 }, nach: { x: r.s1 + 1, y: r.z1 + 1 } },
      { typ: 'frei', von: { x: r.s0, y: r.z1 + 1 }, nach: { x: r.s1 + 1, y: r.z0 } }
    ];
  }
  /* Die Linien durch die Mitte der Figur. Jede Spiegelachse einer Figur geht durch diese Mitte. */
  function achsenDurchMitte(bild, typen = ACHSTYPEN) {
    const r = rahmen(bild), mx = r.s0 + r.b / 2, my = r.z0 + r.h / 2;
    const pos = { senkrecht: mx, waagerecht: my, fallend: my - mx, steigend: my + mx };
    return typen.map(typ => ({ typ, pos: pos[typ] }));
  }
  /* Ist die Linie eine Spiegelachse der Figur? (Farben zählen mit.) */
  const istAchse = (bild, achse) => { const s = bildSpiegeln(bild, achse); return !!s && gleich(s, bild); };
  /* Für jede angebotene Linie: Spiegelachse oder nicht */
  const achsenWahr = aufgabe => aufgabe.kandidaten.map(a => istAchse(aufgabe.figur, a));
  /* gewaehlt: je angebotener Linie true oder false. Welche Achse fehlt, wird nicht verraten (nur die Zahl). */
  function pruefenAchsen(aufgabe, gewaehlt) {
    const zuviel = [];
    let fehlt = 0;
    achsenWahr(aufgabe).forEach((wahr, i) => {
      if (wahr && !gewaehlt[i]) fehlt++;
      if (!wahr && gewaehlt[i]) zuviel.push(i);
    });
    return { ok: fehlt === 0 && zuviel.length === 0, fehlt, zuviel };
  }

  /* ---------- Faltschnitt: Antwort wählen ---------- */
  /* Nummern der Antworten, die der aufgeklappten Figur gleichen (Lage im Bild egal). Soll genau eine sein. */
  function richtigeWahl(aufgabe) {
    const l = normal(loesung(aufgabe)), out = [];
    aufgabe.optionen.forEach((o, i) => { if (gleich(normal(o), l)) out.push(i); });
    return out;
  }
  const pruefenWahl = (aufgabe, nummer) => ({ ok: richtigeWahl(aufgabe).includes(nummer) });

  /* ---------- Zeichnung ---------- */
  /* Lage der Achse als Strecke im Raster (für die Zeichnung), in Kästchen-Einheiten */
  function achsenStrecke(a, b, h) {
    if (a.typ === 'senkrecht') return [{ x: a.pos, y: 0 }, { x: a.pos, y: h }];
    if (a.typ === 'waagerecht') return [{ x: 0, y: a.pos }, { x: b, y: a.pos }];
    if (a.typ === 'frei') {
      /* Gerade durch zwei Punkte bis zu den Rändern des Rasters verlängern */
      const dx = a.nach.x - a.von.x, dy = a.nach.y - a.von.y, schnitte = [];
      const dazu = t => { const x = a.von.x + t * dx, y = a.von.y + t * dy; if (x > -1e-9 && x < b + 1e-9 && y > -1e-9 && y < h + 1e-9) schnitte.push({ t, x: G.glatt(x), y: G.glatt(y) }); };
      if (dx) { dazu(-a.von.x / dx); dazu((b - a.von.x) / dx); }
      if (dy) { dazu(-a.von.y / dy); dazu((h - a.von.y) / dy); }
      schnitte.sort((p, q) => p.t - q.t);
      const erster = schnitte[0], letzter = schnitte[schnitte.length - 1];
      return [{ x: erster.x, y: erster.y }, { x: letzter.x, y: letzter.y }];
    }
    /* schräg: Gerade mit dem Rasterrechteck schneiden */
    const f = a.typ === 'fallend' ? x => x + a.pos : x => -x + a.pos;
    const g = a.typ === 'fallend' ? y => y - a.pos : y => a.pos - y;
    const punkte = [];
    for (const x of [0, b]) { const y = f(x); if (y >= 0 && y <= h) punkte.push({ x, y }); }
    for (const y of [0, h]) { const x = g(y); if (x > 0 && x < b) punkte.push({ x, y }); }
    punkte.sort((p, q) => p.x - q.x || p.y - q.y);
    return [punkte[0], punkte[punkte.length - 1]];
  }

  SW.spiegelRaster = {
    key, feldAus,
    rahmen, abbilden, verschoben, normal, gleich, lagen, kongruent, zusammenhaengend, imRaster,
    alsGeometrie, bildSpiegeln,
    loesung, aufgabePruefen, pruefen, pruefenGanz,
    ACHSTYPEN, achsenDurchMitte, eckDiagonalen, istAchse, achsenWahr, pruefenAchsen,
    richtigeWahl, pruefenWahl,
    achsenStrecke
  };
})();
